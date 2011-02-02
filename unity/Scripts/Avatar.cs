using UnityEngine;
using System.Collections;

public class Avatar : MonoBehaviour {
	
	public string clientid;
	public string username;
	
	public RemoteController remoteController;
	
	public GameObject qArrr;
	
	public void Start() {
		// Let them know we're ready!
		remoteController = gameObject.AddComponent<RemoteController>();
		remoteController.avatar = this;
		qArrr.GetComponent<ClientLoader>().OnJoined(this);
	}
	
	// Impement character specific functions here, such as walking/moving.
	
}
