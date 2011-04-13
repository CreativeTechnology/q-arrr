// replace window.location.hostname with hostname if running on different host
var socket = new io.Socket(window.location.hostname, {
    transports:['websocket', 'htmlfile', 'xhr-multipart',
                            'xhr-polling', 'jsonp-polling']});

socket.on('connect', function(){
    var msg = {
        "msgtype":"_register",
        "content": {
            "username":username,
            "authkey":authkey
        }
    };
    var msgEncoded = $.toJSON(msg);
    socket.send(msgEncoded);
    var timer = setInterval(function() {
        socket.send($.toJSON({ "msgtype":"_heartbeat" }));
    },600);
});

function buttonEvent(msg, pref) {
    var em = msg;
    return function( e ) {
        e.preventDefault();
        socket.send(em);
    };
}

function responseMsg(evt) {
    return $.toJSON({
        "msgtype":"buttonevent",
        "content": evt,
        "src":userid,
        "dest":appid
    });
}

function insertElement(element) {
    var evtDown = responseMsg('+'+element.buttonevent);
    var evtUp = responseMsg('-'+element.buttonevent);
    var div = $("<div />")
        .addClass(element.type)
    if (element.type==="button") {
        div.attr("alt", element.label)
            .bind("touchstart", buttonEvent(evtDown))
            .bind("touchend", buttonEvent(evtUp))
            .bind("mousedown", buttonEvent(evtDown))
            .bind("mouseup", buttonEvent(evtUp));
    } else if (element.type==="bar") {
        div.css({ 'width': parseInt(element.label)+"%" });
        // set color
    } else if (element.type==="text") {
        div.html(element.label);
    }
    $("#"+element.id).html(div);
}

socket.on('message', function(msg){
    var msg = $.parseJSON(msg);
    if(msg.msgtype=="controller") {
        if (!msg.update) {
            $('.element').html("");
        }
        for(var k=0; k< msg.content.length; k++) {
            insertElement(msg.content[k]);
    	}
    } else if (msg.msgtype=="_disconnect" && msg.src == appid) {
        $('body').html("<b>Connection lost (Remote)</b>");
    } else if (msg.msgtype=="_identifier") {
        userid = msg.content;
        var msg = { "msgtype":"_connect", "dest":appid, "src":userid };
        var msgEncoded = $.toJSON(msg);
        socket.send(msgEncoded);
    }
});

socket.on('disconnect', function(){
    $('#box').html("<b>Connection lost (Closed)</b>");    
});


$(document).ready(function() {
    socket.connect();
});
