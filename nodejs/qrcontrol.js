var express = require('express'),
    http    = require('http'),
    nStore  = require('nstore').extend(require('/usr/local/lib/node/.npm/nstore/active/package/lib/nstore/query')()),
    Memory  = require('connect/middleware/session/memory'),
    config  = require('./config.js.default').Config,
    ch      = require('./modules/clienthelper');

require('joose');
require('joosex-namespace-depended');
require('hash');

var webserver = express.createServer(
    express.staticProvider(__dirname + '/static'),
    express.bodyDecoder(),
    express.cookieDecoder(),
    express.session({
        store: new MemoryStore({ reapInterval: 60000 * 30 }), 
        key: 'qarrr_session',
        secret: 'bYba6jHVat73HR0HsslU5XVALXjWIsJE'
    })
);

var users = nStore.new(__dirname+'/users.db');
var sessions = nStore.new(__dirname+'/sessions.db');

var setAuthkey = function(user, cb) {
    users.get(user, function (err, doc, key) {
        if(!err) {
            doc._authkey = ch.randomString(7);
            users.save(key, doc, function(errr) {
                if (!errr) {
                    cb(doc._authkey);
                } else console.log(errr);
            });
        } else console.log(err);
    });
}


webserver.set('view engine', 'jade');
webserver.set('views', __dirname + '/views');
webserver.set('security', 'secret');

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
        } else {
            res.redirect('/login');
        }
    });
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
    users.save(req.body.user.name, {
        "name":req.body.user.name,
        "items":[
            //{"id":1,"name":"Wrench","assetname":"wrench","slot":"rh"}
        ],
        _authkey: ch.randomString(7),
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
        req.session.redirect = req.url;
        res.redirect('/login');
    } else if (ch.findClient(req.params.appid)) {
        setAuthkey(req.session.username, function(key) {
            res.render('controller', {
                locals: {
                    title: "App Controller",
                    page:  "controller",
                    appid: req.params.appid,
                    authkey: key,
                    username: req.session.username
                }
            });
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
                users.find({
                    name:msgd.content.username,
                    _authkey:msgd.content.authkey
                }, function(err, results) {
                    if (!err) {
                        if (results[msgd.content.username]) setAuthkey(msgd.content.username, function(key) {
                            ch.getClient(client.sessionId).user = msgd.content.username;
                            client.send(JSON.stringify(res));
                        });
                    } else console.log(err);
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
        } else if (msgd.dest && ch.findClient(msgd.dest)) {
            var dest = ch.findClient(msgd.dest).client;
            if (msgd.src == ch.getClient(client.sessionId).id) {
                dest.send(JSON.stringify(msgd));
            }
        } else {
            console.log("Don't know what to do with this:");
            console.log(msgd);
        }
    });
    
    client.on('disconnect', function(){
        ch.removeClient(client);
    }); 
});

webserver.listen(config.httpPort);
