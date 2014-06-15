'use strict';

// Returns a promise that resolves to an object that has the peer and makeCall function
// makeCall calls and connects to the given remotePeerId
// Emits: 'connectionChange' events to the $rootScope
//        'peerStream' events to the $rootScope
angular.module('gameRtcApp.factories')
  .factory('PeerConnect', ['$q', '$rootScope', '$sce', '$location',
    function ($q, $rootScope, $sce, $location) {

    var deferred = $q.defer();
    var deferredEnd = $q.defer();
    var peerIdReady = false;
    var allReady = false;
    var peerLocalStream;
    var peer;
    var blobURL;

    var existingCall;
    var existingConn;

    var peerKey = '7k99lrngvwle4s4i';
    var stunURL = 'stun:stun.l.google.com:19302';

    // Compatibility shim
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

    // PeerJS object
    // -- Peer JS CLOUD
    // var peer = new Peer({ key: peerKey, debug: 3, config: {'iceServers': [
    //   { url: stunURL } // Pass in optional STUN and TURN server for maximum network compatibility
    // ]}});

    // // -- My own Peer JS Server
    // var peer = new Peer({ host: 'wardsng-peerjs.herokuapp.com', path: '/', port: 80, debug: 3, config: {'iceServers': [ { url: stunURL } // Pass in optional STUN and TURN server for maximum network compatibility
    // ]}});

    // var myvideo = document.getElementById('my-video');

    // navigator.getUserMedia({audio: true, video: true}, function(stream) {
    navigator.getUserMedia({audio: true, video: true}, function(stream) {
      // Set your video displays
      // myvideo.prop('src', URL.createObjectURL(stream));

      blobURL = $sce.trustAsResourceUrl(URL.createObjectURL(stream));

      console.log("Peer Connect: Stream ready: ", stream);
      window.localStream = stream;

      peerLocalStream = stream;

      peer = new Peer({ host: $location.host(), path: '/', port: 3000, debug: 3, config: {'iceServers': [ { url: stunURL } // Pass in optional STUN and TURN server for maximum network compatibility
      ]}});

      peer.on('open', function(){
        peerIdReady = true;
        resolvePeer();
      });

      // Receiving a call
      peer.on('call', function(call){
        // Answer the call automatically (instead of prompting user) for demo purposes
        console.log('Answering a call!');

        call.answer(peerLocalStream);
        initiateCall(call);
      });

      peer.on('error', function(err){
        console.log('ERROR! Couldn\'t connect to given peer');

        $rootScope.$emit('callFailed', err);

      });

      // Receiving a connection
      peer.on('connection', function(connection) {
        console.log('Answering a connection!', connection);

        $rootScope.$emit('connectionChange', connection);
      });

    }, function(){ deferred.reject('Failed to getUserMedia!'); });


    function resolvePeer() {
      allReady = peerIdReady;

      if (allReady) {
        var peerObject = {
          peer: peer,
          peerLocalStream: peerLocalStream,
          videoURL: blobURL,
          makeCall: function(remotePeerId) {
            // Initiate a call!
            console.log('Initiating a call to: ', remotePeerId);

            // var call = peer.call(remotePeerId, window.localStream);
            var call = peer.call(remotePeerId, peerLocalStream);
            initiateCall(call);

            // Initiate a data connection!
            console.log('Initiating a data connection to: ', remotePeerId);

            existingConn = peer.connect(remotePeerId, peerLocalStream);

            existingConn.on('close', function() {
              console.log("Data connection closed!");
            });

            return existingConn;
          },
          endCall: function() {
            if(existingCall) { existingCall.close(); }
            if(existingConn) { existingConn.close(); }
          }
        };
        deferred.resolve(peerObject);
      }
    }

    function initiateCall (call) {
      // Hang up on an existing call if present
      if (existingCall) {
        existingCall.close();
      }
      if (existingConn) {
        existingConn.close();
      }

      // Wait for stream on the call, then set peer video display
      call.on('stream', function(stream){
        console.log(URL.createObjectURL(stream));
        var blobURL = $sce.trustAsResourceUrl(URL.createObjectURL(stream));
        $rootScope.$emit('peerStream', blobURL);
      });

      // When either you or the other ends the call
      call.on('close', function() {
        console.log('You have been disconnected from ', existingCall);
        $rootScope.$emit('callEnd', existingCall);

        if (existingCall) {
          existingCall.close();
        }
        if (existingConn) {
          existingConn.close();
        }
      });

      call.on('error', function(err) {
        console.log('Call Error: ', err);

        if (existingCall) {
          existingCall.close();
        }
        if (existingConn) {
          existingConn.close();
        }
      });

      // UI stuff
      existingCall = call;

    }

    return {
      getPeer: function() {
        return deferred.promise;
      }
    };

  }]);
