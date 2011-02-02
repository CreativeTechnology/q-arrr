var express = require('express');
var http =    require('http');
var Store =   require('supermarket');
var config =  require('./config.js.default').Config;
var ch =      require('./modules/clienthelper');

require('joose');
require('joosex-namespace-depended');
require('hash');

var webserver = express.createServer();

var clientAuth = {};

var users = new Store({
    filename : __dirname + '/users.db',
    json : true
});

var sessions = new Store({
    filename : __dirname + '/sessions.db',
    json : true
});

webserver.set('view engine', 'jade');
webserver.set('views', __dirname + '/views');

webserver.use(express.staticProvider(__dirname + '/static'));
webserver.use(express.bodyDecoder());
webserver.use(require('sesame')({ store : sessions }));

webserver.get('/', function(req, res) {
    res.render('default', { locals: {
            title: "Welcome",
            page: "root",
            authed: req.session.authed,
            user: req.session.username
        }
    });
});

webserver.get('/logout', function(req, res) {
    req.session.authed = false;
    delete req.session.redirect;
    res.redirect('/');
});

webserver.get('/login', function(req, res) {
    res.render('user', { locals: {
            title: "Login",
            page: "login",
            action: "/login"
        }
    });
});

webserver.post('/login', function(req, res) {
    users.get(req.body.user.name, function(error, value, key) {
        if (!error && value._pass == Hash.md5(req.body.user.pass)) {
            req.session.authed = true;
            req.session.username = req.body.user.name;
            if (req.session.redirect) {
                res.redirect(req.session.redirect);
                delete req.session.redirect;
            } else {
                res.redirect('/');
            }
        }
    });
    res.redirect('/login');
});

webserver.get('/register', function(req, res) {
    res.render('user', { locals: {
            title: "Register",
            page: "register",
            action: "/register"
        }
    });
});

webserver.post('/register', function(req, res) {
    users.set(req.body.user.name, {
        "name":req.body.user.name,
        "items":[
            //{"id":1,"name":"Wrench","assetname":"wrench","slot":"rh"}
        ],
        _pass: Hash.md5(req.body.user.pass)
    }, function(error) {
        if (!error) {
            req.session.authed = true;
            req.session.username = req.body.user.name;
            if (req.session.redirect) {
                res.redirect(req.session.redirect);
                delete req.session.redirect;
            } 
            res.redirect('/');
        } else {
            res.redirect('/register');
        }
    });  
});

webserver.get('/join/:appid', function(req, res) {
    if (!req.session.authed) {
        req.session.redirect = "/join/"+req.params.appid;
        res.redirect('/login');
    } else if (ch.findClient(req.params.appid)) {
        req.session._authkey = ch.randomString(7);
        res.render('controller', {
            locals: {
                title: "App Controller",
                page:  "controller",
                appid: req.params.appid,
                authkey: req.session._authkey,
                username: req.session.username
            }
        });
    } else {
        res.render('message', { locals: {
                title: "Error",
                page:  "message",
                message: "App not Found"
            }
        });
    }
});

webserver.get(/^\/qr\/(.+)?/, function(req, res) {
    var google = http.createClient(80, 'chart.googleapis.com');
    var request = google.request('GET',
        '/chart?chs=250x250&cht=qr&chl='+req.params[0],
        {'host': 'chart.googleapis.com'}
    );
    request.end();
    request.on('response', function (response) {
        response.on('data', function (chunk) {
            res.send(chunk, {'Content-Type': 'image/png'});
        });
    });
});

var io = require('socket.io'); 
var socket = io.listen(webserver); 
socket.on('connection', function(client){
    client.on('message', function(msg){
        var msgd = JSON.parse(msg);
        if (false && msgd.msgtype!='_heartbeat') console.log(msg);
        if (msgd.msgtype == '_register') {
            var identifier = ch.addClient(client);
            var res = { "msgtype": '_identifier', "content": identifier };
            if (msgd.content) {
                sessions.filter(function(meta){
                    return meta.value.username==msgd.content.username &&
                        meta.value.authed &&
                        meta.value._authkey == msgd.content.authkey;
                })
                .join(function(results) {
                    if (results.length == 1) {
                        results = results[0];
                        results.value._authkey = ch.randomString(7);
                        sessions.set(results.key, results.value);
                        ch.getClient(client.sessionId).user =
                        msgd.content.username;
                        client.send(JSON.stringify(res));
                    }
                });
            } else {
                client.send(JSON.stringify(res));
            }
        } else if (msgd.msgtype == '_connect') {
            if (ch.getClient(client.sessionId).user) {
                users.get(ch.getClient(client.sessionId).user, function(error, value, key) {
                    if (!error && ch.findClient(msgd.dest) && ch.findClient(msgd.src).user==key) {
                        msgd.content = value;
                        delete msgd.content._pass;
                        var app = ch.findClient(msgd.dest).client;
                        ch.joinApp(client, app);
                        app.send(JSON.stringify(msgd));
                    }
                });
            }
        } else if (msgd.dest) {
            var dest = ch.findClient(msgd.dest).client;
            if (msgd.src == ch.getClient(client.sessionId).id) {
                dest.send(JSON.stringify(msgd));
            }
        }
    });
    
    client.on('disconnect', function(){
        ch.removeClient(client);
    }); 
});

webserver.listen(config.httpPort);
