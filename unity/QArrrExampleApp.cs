using UnityEngine;
using System.Collections;
using System.Collections.Generic;

public class QArrrExampleApp : MonoBehaviour {
	
	[HideInInspector]
	public ClientLoader clientLoader;

	private EventedButton[] defaultController;
	
	void Start() {
		clientLoader = gameObject.GetComponent<ClientLoader>();
		
		// Register join and leave events
		clientLoader.Joined += new JoinEventHandler(PlayerJoin);
		clientLoader.Left += new LeaveEventHandler(PlayerLeave);
		
		// Create default controller, pass callbacks.
		defaultController = new EventedButton[] {
			new EventedButton("Up",       "#35D3AB", PlayerUp),
			new EventedButton("Down",     "#70ED3B", PlayerDown)
		};
	}
	
	public void PlayerUp(Avatar a) {
		a.gameObject.transform.position += Vector3.up;
	}
	
	public void PlayerDown(Avatar a) {
		a.gameObject.transform.position += Vector3.down;
	}
	
	public void PlayerJoin(Avatar a) {
		print("Sending now....");
		a.remoteController.SendController(defaultController);

		a.gameObject.transform.position = new Vector3(
											Random.Range(-5.0f,5.0f),
											0.0f,
											Random.Range(-5.0f,5.0f));
	}
	
	public void PlayerLeave(Avatar a) {
		// Nothing to do...
	}
}
