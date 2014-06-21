Webtris
=============
A web-app that allows two-player roulette Tetris. The app uses WebRTC to allow video chat calls and connections directly within the browser.

See it at [webtris](http://web-tris.com).

Please note that this currently works only in WebRTC capable browsers (e.g. Chrome, Opera, Firefox).

Pardon the mess!

Screenshots
--------
While screenshots are nice, I recommend playing around the web-app itself for some neat animations!

###Main Page
![MainPage](/screenshots/main.png)
![MainPageAbout](/screenshots/mainabout.png)

###Game Room
![Gameroom](/screenshots/game.png)

###Online Users
![OnlineUsers](/screenshots/onlineusers.png)

###Keyboard Controls
![KeyboardControls](/screenshots/keyboard.png)


Overview
--------
WebRTC (Real Time Communication) enables video chat and peer-to-peer data sharing directly in the browser and implements three APIs:
-MediaStream
-RTCPeerConnection
-RTCDataChannel

MediaStream (aka `getUserMedia`) provides access to local data streams such as the user's webcam and/or microphone.
RTCPeerConnection provides video and/or audio calling.
RTCDataChannel provides peer-to-peer communication of generic data.

Unlike web sockets, which involves a client (aka browser) sending data to a server which then emits it to other connected clients, WebRTC allows a more direct real-time connection between two clients, thus making it a perfect avenue for multiplayer games...like Tetris!

###What I used
[PeerJS](http://peerjs.com) - an awesome library that simplifies WebRTC peer-to-peer data, video, and audio calls

[PeerServer](https://github.com/peers/peerjs-server) - a complementary server that helps broker connections between PeerJS clients

[SoundManager2](http://www.schillmania.com/projects/soundmanager2/) - used to enable playing the Tetris theme music in the web-app

[jakesgordon javascript-tetris](https://github.com/jakesgordon/javascript-tetris/) - a starting point for the Tetris game used. Most of it has been broken apart and repurposed for web-tris

And of course...AngularJS, Express, Node

###Challenges
* Figuring out how to call and connect "Peers" using PeerJS and implementing as a service in AngularJS
* Setting up PeerServer in Express. Using PeerServer requires another port, so my hopes of deploying to Heroku were shot -- I instead went with kicking off my own virtual web server on [DigitalOcean](https://www.digitalocean.com)
* Maintaining concept of whether the Peer is currently in a call, and/or connected to another Peer and subsequently ensuring Tetris and other events are reset on disconnect. Many of these were tied to server-side APIs
* Implementing server-side API to maintain list of Peers
* Creating a match-making scheme on my server. For this I used socket.io to maintain a list of Peers that are connected and ready to play, removing them when they are either disconnected or are currently connected to other Peers.
* Implementing Tetris, refactoring out draw routines, adding game features (e.g. fast-drop blocks, emitting garbage blocks to opponent). Each client only runs their own version of Tetris -- the other one shown is merely a drawn representation
* Synchronizing Tetris games between two Peers and handling sending and receipt of game data
* Tetris performance issues -- throttling the sending and receiving of game data updates
* Grunt build issues, ranging from old faulty "compression" Express middleware modules to not being able to directly import CSS files into a main SASS file for minification
* Creating a droplet on [DigitalOcean](https://www.digitalocean.com), installing required software, and starting my own web server
* Figuring out and implementing animations from collection of tutorials on [codrops](http://tympanus.net/codrops/)
* And many other things I can't currently remember...


Improvements
---------
* Add other game features that might utilize other Web-RTC JavaScript libraries (e.g. headtrackr.js)
* Add a ranking system for currently connected players and/or ability to create user accounts that track game records
* Add free-play option
* Refactoring Tetris and animation scripts into AngularJS services
* Refactoring colossal main controller code
* Refactoring code to be more "Angular"

[webtris]:http://web-tris.com
