// Contains objects with sessionid as key, and as value an object of the form:
// { client:$clientobj, id:$clientid, connected:[$connected, $clients] }
var clients = {};
// contain objects wiht clientid as key and session as value
var clientIds = {};

// Returns the client object by passing the id
this.findClient = function(id) {
	return clients[clientIds[id]];
}

// Returns the client object by passing the sessionId
this.getClient = function(session) {
	return clients[session];
}

this.randomString = function(length) {
    var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
    var randomstring = '';
    for (var i=0; i<length; i++) {
    	var rnum = Math.floor(Math.random() * chars.length);
    	randomstring += chars.substring(rnum,rnum+1);
    }
    return randomstring;
}

// Remove client from this system. Notify connected clients.
this.removeClient = function(client) {
    if (clients[client.sessionId]) {
    	delete clientIds[clients[client.sessionId].id];
    	var connected = clients[client.sessionId].connected;
    	for (var i=0; i<connected.length; i++) {
    		this.connectionLost(clients[connected[i]],
    		                    clients[client.sessionId]);
    	}
    	delete clients[client.sessionId];
    }
}

// Add a client to the system. Generates an id.
this.addClient = function(client) {
    var id = this.randomString(4);
    clients[client.sessionId] = {client:client, id:id, connected:[]};
    clientIds[id] = client.sessionId;
    return id;
}

// Registers a connection between two clients.
this.joinApp = function(client, app) {
	clients[client.sessionId].connected.push(app.sessionId);
	clients[app.sessionId].connected.push(client.sessionId);
}

// Sends the connectionlost message on removal.
// Also keeps the connected array clean
this.connectionLost = function(client, other) {
    if (other && client) {
	var msg = {msgtype:"_disconnect", src:other.id, dest:client.id};
	client.connected.splice(client.connected.indexOf(other.client.sessionId), 1);
	client.client.send(JSON.stringify(msg));
    }
}
