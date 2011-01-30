var socket = new io.Socket('ewi1544.ewi.utwente.nl', {
    transports:['websocket', 'htmlfile', 'xhr-multipart',
                            'xhr-polling', 'jsonp-polling']});

socket.on('connect', function(){
    var msg = { "msgtype":"connection", "clientid":appid, "userid":userid };
    var msgEncoded = $.toJSON(msg);
    socket.send(msgEncoded);
    var timer = setInterval(function() {
        socket.send($.toJSON({ "msgtype":"heartbeat" }));
    }, 1000);
});

function buttonEvent(msg) {
    return function() {
        socket.send(msg);
    }    
}

socket.on('message', function(msg){
    var msg = $.parseJSON(msg);
    if(msg.msgtype=="controller") {
    	$('#box').html("");
        for(var k=0; k< msg.buttons.length; k++) {
            var button = msg.buttons[k];
            var res = $.toJSON({
                "msgtype":"buttonevent",
                "buttonevent":button.buttonevent,
                "clientid":appid });
    		$("<button />")
    			.html( button.label)
    			.attr( 'id', 'button'+k)
    			.attr( 'value', button.buttonevent )
    			.css('background', button.color)
        		.click(buttonEvent(res))
    			.appendTo( $('#box') );
    	}
    } else if (msg.msgtype=="connectionlost" && msg.clientid == appid) {
        $('#box').html("<b>Connection lost</b>");
    }
});
socket.on('disconnect', function(){
    $('#box').html("<b>Connection lost</b>");    
});

$(document).ready(function() {
  socket.connect();
});