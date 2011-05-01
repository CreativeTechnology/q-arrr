Q-Arrr - Control 3D Applications [on public screens] with smartphones
=====================================================================

This is a node.js application that lets users control Unity3D (and other) applications
via their smartphones by redirecting them from a QR-Code to a websocket-enabled
controller website. The application itself is also connected to the websocket
server and can modify the controllers layout remotely.

This is a partitial result of a larger effort to make a gamelayer for reality,
using qr-codes to like between real objects and digital feedback.

Check out the README in the unity folder for setup instructions.

Install needed node modules:
$npm install express hash jade joose joosex-namespace-depended socket.io
