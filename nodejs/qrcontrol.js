var express = require('express');
var http = require('http');
var Mysql = require('mysql').Client,
    mysql = new Mysql();
var config = require('./config.js').Config;
var ch = require('./modules/clienthelper');

var webserver = express.createServer();

mysql.user = config.mysqlUser;
mysql.password = config.mysqlPass;
mysql.host = config.mysqlHost;
mysql.port = config.mysqlPort;
mysql.database = config.mysqlDB;

mysql.connect();

var clientAuth = {};

webserver.set('view engine', 'jade');
webserver.set('views', __dirname + '/views');
webserver.use(express.staticProvider(__dirname + '/static'));

webserver.get(/^\/qr\/(.+)?/, function(req, res) {
    var google = http.createClient(80, 'chart.googleapis.com');
    var request = google.request('GET', '/chart?chs=250x250&cht=qr&chl='+req.params[0], {'host': 'chart.googleapis.com'});
    request.end();
    request.on('response', function (response) {
        response.on('data', function (chunk) {
            res.send(chunk, {'Content-Type': 'image/png'});
        });
    });
});

webserver.get('/appctrl/:appid/:userid/:authkey', function(req, res) {
    if (ch.findClient(req.params.appid)) {
        mysql.query('SELECT id FROM users WHERE authkey = ? AND id = ? LIMIT 1', [req.params.authkey, req.params.userid], function (err, results, fields) {
            if (err) {
              throw err;
            }
            if(results.length==1) {
                mysql.query('UPDATE users SET authkey = ? WHERE id = ?', [ch.randomString(7), req.params.userid], function (err) {
                    if (err) {
                      throw err;
                    } else {
                        clientAuth[req.params.userid] = (new Date).getTime();
                        res.render('controller', {
                            locals: {
                                appid: req.params.appid,
                                userid: req.params.userid,
                                title: "App Controller",
                                page: "controller"
                            }
                        });
                    }
                });
            } else {
                res.redirect("http://ewi1544.ewi.utwente.nl/q-arrr/php/index.php/j/"+req.params.appid);    
            }
        });
    } else {
        res.send("App not found");    
    }
});

var io = require('socket.io'); 
var socket = io.listen(webserver); 
socket.on('connection', function(client){
    client.on('message', function(msg){
        var msgd = JSON.parse(msg);
        if (false && msgd.msgtype!='heartbeat') console.log(msg);
        if (msgd.msgtype == 'registerapp') {
            var identifier = ch.addClient(client);
            var res = { msgtype: 'identifier', appid: identifier };
            client.send(JSON.stringify(res));
        } else if (msgd.msgtype == 'connection') {
            if (clientAuth[msgd.userid]) {
                delete clientAuth[msgd.userid];
                var app = ch.findClient(msgd.appid).client;
                msgd.clientid = ch.addClient(client);
                ch.joinApp(client, app);
                app.send(JSON.stringify(msgd));
            }
        } else if (msgd.clientid) {
            var target = ch.findClient(msgd.clientid).client;
            msgd.clientid = ch.getClient(client.sessionId).id;
            target.send(JSON.stringify(msgd));
        }
    });
    
    client.on('disconnect', function(){
        ch.removeClient(client);
    }); 
});

webserver.listen(config.httpPort);