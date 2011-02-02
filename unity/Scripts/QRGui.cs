using UnityEngine;
using System.Collections;

public class QRGui : MonoBehaviour {
	
	GUITexture guiTex;
	QArrrSocket socketIo;
	
	// Use this for initialization
	void Start () {
		socketIo = gameObject.GetComponent<QArrrSocket>();
		Security.PrefetchSocketPolicy(socketIo.host, socketIo.port);
		transform.position = Vector3.zero;
		transform.localScale = Vector3.zero;
		guiTex = gameObject.AddComponent<GUITexture>();
		guiTex.pixelInset = new Rect(0,0,180.0f,180.0f);
	}
	
	// Update is called once per frame
	void Update () {
	
	}
	
    public IEnumerator SetCode(string identifier) {
		string qrgen = "http://"+socketIo.host+":"+socketIo.port+"/qr/";
		string target = "http://"+socketIo.host+":"+socketIo.port+"/join/"+identifier;
        WWW www = new WWW(qrgen+target);
        yield return www;
		Destroy(guiTex.texture);
		guiTex.texture = www.texture;
		Application.ExternalEval( "prompt('Controller url:', '"+target+"')" );
	} 
    
}
