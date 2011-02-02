using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using LitJson;

public delegate void JoinEventHandler(Avatar a);
public delegate void LeaveEventHandler(Avatar a);

public class ClientLoader : MonoBehaviour {
	
	// Register to these events with a callback that takes 
	// an Avatar object as parameter.
	public event JoinEventHandler Joined;
	public event LeaveEventHandler Left;
	
	private Dictionary<string, Avatar> avatars;
	
	void Start () {
		avatars = new Dictionary<string, Avatar>();
	}
	
	// Create a cube with a random color for incomming player;
	public void Load(JsonData user) {
		JsonData dbuser = user["content"];
		
		GameObject character = GameObject.CreatePrimitive(PrimitiveType.Cube);
		character.renderer.material.color = new Color(Random.Range(0.0f, 1.0f),
													  Random.Range(0.0f, 1.0f),
													  Random.Range(0.0f, 1.0f));
		Avatar newAvatar = character.AddComponent<Avatar>();
		newAvatar.clientid = (string) user["src"];
		newAvatar.username = (string) dbuser["name"];
		newAvatar.qArrr = this.gameObject;
		
		avatars.Add(newAvatar.clientid, newAvatar);
	}
	
	public Avatar GetAvatar(string id) {
		return avatars[id];
	}
	
	public void OnJoined(Avatar a) {
         if (Joined != null)
            Joined(a);
	}
	
	public void OnLeave(Avatar a) {
         if (Left != null)
            Left(a);
	}
	
	public void Unload(string id) {
		OnLeave(avatars[id]);
		Destroy(avatars[id].gameObject);
		avatars.Remove(id);
	}
}