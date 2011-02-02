using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using System;
using LitJson;
// Inherit from SocketIoClient Class
public class QArrrSocket : SocketIoClient {
	
	public string host;
	public int port;
	public string appname;
	
	[HideInInspector]
	public string identifier;
	
	private ClientLoader clientLoader;
	
	void Awake() {
		Security.PrefetchSocketPolicy(host, port);
		// Setup Socket Connection
		SetupClient("ws://"+host+":"+port+"/socket.io/websocket");
	}
	
	void Start() {
		// Connect client and start up read thread
		StartClient();
		clientLoader = gameObject.GetComponent<ClientLoader>();
		Send("{\"msgtype\": \"_register\", \"appname\":  \""+appname+"\"}");
	}
	
	public void Update() {
		// Calls "HandleMessage" if a message was in queue
		ProcessQueue();
	}
	
	// overrides default "onMessage" behaviour:
	public override void HandleMessage(string msg) {
		// Convert to JSON
		JsonData message = JsonMapper.ToObject(msg);
		string msgtype = (string) message["msgtype"];
		
		if (msgtype == "buttonevent") {
			clientLoader.GetAvatar((string) message["src"]).remoteController.HandleEvent((string) message["content"]);
		} else if (msgtype == "_connect") {
			clientLoader.Load((JsonData) message);
		}  else if (msgtype == "_disconnect") {
			clientLoader.Unload((string) message["src"]);
		} else if (msgtype == "_identifier") {
			StartCoroutine(gameObject.GetComponent<QRGui>().SetCode((string) message["content"]));
			identifier = (string) message["content"];
		}
	}
}