using UnityEngine;
using System.Collections;
using System.Collections.Generic;

public class Player {
	public GameObject cube;
	public Client client;
	public int score;
	public bool moving = false;
	
	public Player(GameObject cube) {
		this.cube = cube;
	}
	
	public Player() {
		this.cube = GameObject.CreatePrimitive(PrimitiveType.Cube);
		this.cube.transform.renderer.material.color = new Color(
                                        Random.Range(0.0f, 1.0f),
                                        Random.Range(0.0f, 1.0f),
                                        Random.Range(0.0f, 1.0f));
	}
}

public class Game : MonoBehaviour {
	
	[HideInInspector]
	public ClientLoader clientLoader;
	public GameObject qArrr;
	
	private Dictionary<Client, Player> players;
	private EventedButton[] defaultController;
	
	void Awake() {
		if (qArrr == null) qArrr = GameObject.Find("Q-Arrr");
		
		clientLoader = qArrr.GetComponent<ClientLoader>();
		
		// Register join and leave events
		clientLoader.Joined += new JoinEventHandler(PlayerJoin);
		clientLoader.Left += new LeaveEventHandler(PlayerLeave);
		
		defaultController = new EventedButton[] {
			new EventedButton("Up",    "arrowUp",    "button", PlayerUp),
			new EventedButton("Down",  "arrowDown",  "button", PlayerDown),
			new EventedButton("Left",  "arrowLeft",  "button", PlayerLeft),
			new EventedButton("Right", "arrowRight", "button", PlayerRight),
			new EventedButton("A",     "buttonA",    "button", PlayerScaleUp),
			new EventedButton("B",     "buttonB",    "button", PlayerScaleDown),
			
			new EventedButton("80",    "health", "bar", null),
			new EventedButton("0",     "score", "text", null)
		};
		
		players = new Dictionary<Client, Player>();
	}
	
	public void Start() {
		//
	}
	
	public void Update() {
		//
	}
	
	public IEnumerator PlayerMove(Client a, Vector3 dir) {
		Player p = players[a];
		p.moving = false;
		yield return 2;
		p.moving = true;
		while (p.moving) {
			p.cube.transform.position += dir/(Time.deltaTime*10000.0f);
			yield return 1;
		}
	}
	
	public IEnumerator PlayerScale(Client a, float dir) {
		Player p = players[a];
		p.moving = false;
		yield return 2;
		p.moving = true;
		while (p.moving) {
			p.cube.transform.localScale += (Vector3.one*dir)/(Time.deltaTime*10000.0f);
			yield return 1;
		}
	}
	
	public void StopMoving(Client a) {
		players[a].moving = false;
	}
	
	public void PlayerScaleUp(Client a, bool up) {
		if (up) StopMoving(a);
		else {
			StartCoroutine(PlayerScale(a, 1.0f));
			
		}
	}
	
	public void PlayerScaleDown(Client a, bool up) {
		if (up) {
			StopMoving(a);
			a.remoteController.UpdateController(
				new EventedButton(Random.Range(0,100)+"", "health", "bar", null)
			);
		} else {
			StartCoroutine(PlayerScale(a, -1.0f));
		}
	}
	
	public void PlayerUp(Client a, bool up) {
		if (up) StopMoving(a);
		else {
			StartCoroutine(PlayerMove(a, 
				new Vector3(0.0f, 0.0f, 1.0f)                          
			));
		}
	}
	
	public void PlayerDown(Client a, bool up) {
		if (up) StopMoving(a);
		else {
			StartCoroutine(PlayerMove(a, 
				new Vector3(0.0f, 0.0f, -1.0f)                          
			));
		}
	}
	
	public void PlayerLeft(Client a, bool up) {
		if (up) StopMoving(a);
		else {
			StartCoroutine(PlayerMove(a, 
				new Vector3(-1.0f, 0.0f, 0.0f)                          
			));
		}
	}
	
	public void PlayerRight(Client a, bool up) {
		if (up) StopMoving(a);
		else {
			StartCoroutine(PlayerMove(a, 
				new Vector3(1.0f, 0.0f, 0.0f)                          
			));
		}
	}
	
	
	public void PlayerJoin(Client a) {
		if (a == null) return;
		
		Player newPlayer = new Player();
		newPlayer.client = a;
		newPlayer.score = 0;
		
		newPlayer.cube.transform.position = Vector3.zero;
		players.Add(a, newPlayer);
		
		a.remoteController.SendController(defaultController);
	}
	
	public void PlayerLeave(Client a) {
		StartCoroutine(RemovePlayer(a));
	}
		               
	public IEnumerator RemovePlayer(Client a) {
		players[a].moving = false;
		yield return 2;
		Destroy(players[a].cube);
		players.Remove(a);
	}
	
}
