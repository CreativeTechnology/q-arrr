using UnityEngine;
using System.Collections;
using LitJson;

public delegate void ButtonEvent(Avatar a);
public class RemoteController : MonoBehaviour {
	
	public Avatar avatar;
	public EventedButton[] buttons;
	
	void Start() {
	}
		
	public void SendController(EventedButton[] b) {
		print("sneding");
		buttons = b;
		string identifier = avatar.qArrr.GetComponent<QArrrSocket>().identifier;
		string res = JsonMapper.ToJson(new ControllerLayout(avatar.clientid, b, identifier));
		avatar.qArrr.GetComponent<QArrrSocket>().Send(res);
		print(res);
	}
	
	public void HandleEvent(string e) {
		for (int i=0; i<buttons.Length; i++) {
			if (buttons[i].buttonevent.Equals(e)) {
				buttons[i].buttonEvent(this.avatar);
			}
		}
	}
}

public class ControllerLayout {
	
	public string msgtype;
	public string dest;
	public string src;
	public Button[] content;
	
	public ControllerLayout(string clientid, Button[] buttons,  string src) {
		// Using conversion from EventedButton to Button causes LitJson to crash
		// in infinite recursion, so here is a nasty hack:
		this.content = new Button[buttons.Length];
		for(int i=0; i<buttons.Length; i++) {
			this.content[i] = new Button(buttons[i].label,
				buttons[i].buttonevent, buttons[i].color);
		}
		this.dest = clientid;
		this.msgtype = "controller";
		this.src = src;
	}
}

public class Button {
	
	public string label;
	public string color;
	public string buttonevent;
	
	public Button(string label, string buttonevent, string color) {
		this.label = label;
		this.color = color;
		this.buttonevent = buttonevent;
	}
}


public class EventedButton:Button {
	
	public ButtonEvent buttonEvent;
	
	public EventedButton(string label, string color, ButtonEvent evt) : base(label, RandomString(7), color) {
		this.buttonEvent = evt;
	}
	
	public static string RandomString(int size) {
		string _chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	    char[] buffer = new char[size];
	
	    for (int i = 0; i < size; i++) {
	        buffer[i] = _chars[(int) Random.Range(0,_chars.Length)];
	    }
	    return new string(buffer);
	}
}