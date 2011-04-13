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

function buttonEvent(msg) {
    var em = msg;
    return function( e ) {
        e.preventDefault();
        socket.send(em);
    };
}

socket.on('message', function(msg){
    var msg = $.parseJSON(msg);
    if(msg.msgtype=="controller") {
    	$('#box').html("");
        for(var k=0; k< msg.content.length; k++) {
            var button = msg.content[k];
            var res = $.toJSON({
                "msgtype":"buttonevent",
                "content":button.buttonevent,
                "src":userid,
                "dest":appid });
    		$("<button />")
    			.html( button.label)
    			.attr( 'id', 'button'+k)
    			.attr( 'value', button.buttonevent )
    			.css('background', button.color)
                .bind("touchstart", buttonEvent(res))
                .bind("mousedown", buttonEvent(res))
    			.appendTo( $('#box') );
    	}
    } else if (msg.msgtype=="_disconnect" && msg.src == appid) {
        $('#box').html("<b>Connection lost (Remote)</b>");
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
