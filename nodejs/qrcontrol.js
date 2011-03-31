var express = require('express'),
    http    = require('http'),
    config  = require('./config.js').Config,
    ch      = require('./modules/clienthelper');

require('joose');
require('joosex-namespace-depended');
require('hash');

var webserver = express.createServer(
    express.bodyParser(),
    express.static(__dirname + '/static')
);

webserver.set('view engine', 'jade');
webserver.set('views', __dirname + '/views');
webserver.set('security', 'secret');

webserver.get('/a/:appid/', function(req, res) {
    if (ch.findClient(req.params.appid)) {
        res.render('controller', {
            locals: {
                title: "App Controller",
                page:  "controller",
                appid: req.params.appid,
                authkey: "",
                username: parseInt(Math.random()*2000) //TODO
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
        if (msgd.msgtype !='_heartbeat') console.log(msg);
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
                msgd.content = [] // user information from db
                var app = ch.findClient(msgd.dest);
                if (app) { 
                    ch.joinApp(client, app.client);
                    app.client.send(JSON.stringify(msgd));
                }
            }
        } else if (msgd.dest && ch.findClient(msgd.dest) && ch.getClient(client.sessionId)) {
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
