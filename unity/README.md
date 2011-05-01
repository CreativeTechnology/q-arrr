Use the node.js qrcontrol server to remote control a unity application
======================================================================

1. cd nodejs 
2. setup config.js (or copy default). node qrcontrol.js to start
3. Create empty unity project, add files from /unity folder to project
4. Add these Scripts as Components to an empty GameObject:
    - ClientLoader.cs
    - QArrrSocket.cs
    - QRGui.cs
    - Game.cs
5. Set up Host & Port in inspector of the QArrrSocket Component.
6. Press play.
7. Either scan the QR-code from the screen or copy paste the link from the
console to your browser to start "playing".

Please report any bugs or problems you run into :).
