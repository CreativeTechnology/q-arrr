var express = require('express'),
    http    = require('http'),
    Mysql   = require('mysql').Client,
    config  = require('./config.js').Config,
    ch      = require('./modules/clienthelper');

mysql = new Mysql();

mysql.user = config.mysqlUser;
mysql.password = config.mysqlPass;
mysql.database = config.mysqlDB;
mysql.host = config.mysqlHost;
mysql.connect();

require('joose');
require('joosex-namespace-depended');
require('hash');

var webserver = express.createServer(
    express.staticProvider(__dirname + '/static'),
    express.bodyDecoder()
);

var setAuthkey = function(user, cb) {
    mysql.query('UPDATE users SET authkey = ? WHERE id = ?',
        [ch.randomString(7), user], cb
    );
};

var verifyAuthkey = function(user, authkey, cb) {
    mysql.query('SELECT id FROM users WHERE authkey = ? AND id = ? LIMIT 1',
       [authkey, user], function(err, results, fields) {
       if (err) throw err;
       cb(results.length==1);
    });
};

var getUser = function(user, cb) {
    var ewi = http.createClient(80, 'ewi1544.ewi.utwente.nl');
    var request = ewi.request('GET',
        '/q-arrr/php/index.php/data/user/'+user,
        {'host': 'ewi1544.ewi.utwente.nl'}
    );
    request.end();
    request.on('response', function (response) {
        response.on('data', function (chunk) {
            cb(chunk+'');
        });
    });
};

webserver.set('view engine', 'jade');
webserver.set('views', __dirname + '/views');
webserver.set('security', 'secret');

webserver.get('/a/:appid/:userid/:authkey', function(req, res) {
    verifyAuthkey(req.params.userid, req.params.authkey, function(verified) {
        if (verified) {
            setAuthkey(req.params.userid, function(err) {
                if (!err && ch.findClient(req.params.appid)) {
                    res.render('controller', {
                        locals: {
                            title: "App Controller",
                            page:  "controller",
                            appid: req.params.appid,
                            authkey: "",
                            username: req.params.userid
                        }
                    });
                } else {
                    res.render('message', {
                        locals: {
                            title: "Error",
                            page:  "message",
                            message: "App not Found"
                        }
                    });
                }
            }); 
        } else {
            res.redirect('http://ewi1544.ewi.utwente.nl/q-arrr/php/index.php/j/'+req.params.appid);
        }
    });
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
        if (false && msgd.msgtype !='_heartbeat') console.log(msg);
        if (msgd.msgtype == '_register') {
            var identifier = ch.addClient(client);
            var res = { "msgtype": '_identifier', "content": identifier };
            if (msgd.content) { // Needs verification
                ch.getClient(client.sessionId).user = msgd.content.username;
            }
            client.send(JSON.stringify(res));
        } else if (msgd.msgtype == '_connect') {
            var c = ch.getClient(client.sessionId);
            if (c.user) {
                getUser(c.user, function(data) {
                    //console.log(data);
                    msgd.content = JSON.parse(data);
                    var app = ch.findClient(msgd.dest);
                    if (app) { 
                        ch.joinApp(client, app.client);
                        app.client.send(JSON.stringify(msgd));
                    }
                });
            }
        } else if (msgd.dest && ch.findClient(msgd.dest)) {
            var dest = ch.findClient(msgd.dest).client;
            if (msgd.src == ch.getClient(client.sessionId).id) {
                dest.send(JSON.stringify(msgd));
            }
        } else {
            if (msgd.msgtype != '_heartbeat') {
                console.log("Don't know what to do with this:");
                console.log(msgd);
            }
        }
    });
    
    client.on('disconnect', function(){
        ch.removeClient(client);
    }); 
});

webserver.listen(config.httpPort);
