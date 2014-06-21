'use strict';

/* Returns a promise that resolves to PeerObject with:

  PeerObject:
  {
    peer => Local PeerJS Object that automatically receives calls and connections
    peerLocalStream => Local MediaStream
    videoURL => Video stream source

    Functions:
      makeCall => Calls and connects to the given remotePeerID and returns a DataConnection object
      endCall => Closes existing call and connection
  }

  The following events are emitted to the $rootScope:
  'peerStreamReceived'     : MediaStream has been received from peer
  'peerConnectionReceived' : DataConnection has been received from peer
  'callFailed'             : Error when attempting to call/connect to peer
  'callEnded'              : Local peer or remote peer have ended the call/connection
*/

angular.module('gameRtcApp.factories')
  .factory('PeerConnect', ['$q', '$rootScope', '$sce', '$location',
    function ($q, $rootScope, $sce, $location) {

      function _resolvePeer(peer, peerLocalStream, blobURL) {
        var peerObject = {
          peer: peer,
          peerLocalStream: peerLocalStream,
          videoURL: blobURL,

          // Calls and connects to the given remotePeerId -- returns a DataConnection object
          makeCall: function(remotePeerId) {
            console.log('Initiating a call to: ', remotePeerId);

            var call = peer.call(remotePeerId, peerLocalStream);
            _setupCallEvents(call);

            console.log('Initiating a data connection to: ', remotePeerId);

            existingConn = peer.connect(remotePeerId, peerLocalStream);

            existingConn.on('close', function() {
              console.log('Data connection closed!');
            });

            return existingConn;
          },

          // Closes the existing call and connection
          endCall: function() {
            _endExistingCalls();
          }
        };

        deferred.resolve(peerObject);
      }

      function _endExistingCalls() {
        if(existingCall) { existingCall.close(); }
        if(existingConn) { existingConn.close(); }
      }

      function _setupCallEvents (call) {
        // Hang up on an existing call if present
        _endExistingCalls();

        existingCall = call;

        // Wait for MediaStream on the call, then set peer video display
        call.on('stream', function(stream){
          // console.log(URL.createObjectURL(stream));
          var remoteBlobURL = $sce.trustAsResourceUrl(URL.createObjectURL(stream));
          $rootScope.$emit('peerStreamReceived', remoteBlobURL);
        });

        // When either you or the other ends the call
        call.on('close', function() {
          console.log('You have been disconnected from ', existingCall);
          $rootScope.$emit('callEnded', existingCall);

          // Hang up on any existing calls if present
          _endExistingCalls();
        });

        call.on('error', function(err) {
          console.log('Call Error: ', err);
          _endExistingCalls();
        });
      }

      var deferred = $q.defer();
      // var peerKey = '7k99lrngvwle4s4i';
      var stunURL = 'stun:stun.l.google.com:19302';
      var existingCall;
      var existingConn;

      // Compatibility shim
      navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

      // PeerJS object
      // -- Peer JS CLOUD
      // var peer = new Peer({ key: peerKey, debug: 3, config: {'iceServers': [
      //   { url: stunURL } // Pass in optional STUN and TURN server for maximum network compatibility
      // ]}});

      // navigator.getUserMedia({audio: true, video: true}, function(stream) {
      navigator.getUserMedia({audio: true, video: true}, function(stream) {
        var peerLocalStream = stream;
        var blobURL = $sce.trustAsResourceUrl(URL.createObjectURL(stream));
        var peer = new Peer({ host: $location.host(), path: '/', port: 3000, debug: 3, config: {'iceServers': [ { url: stunURL } // Pass in optional STUN and TURN server for maximum network compatibility
        ]}});

        peer.on('open', function() { _resolvePeer(peer, peerLocalStream, blobURL); });

        // Receiving a call -- answer automatically
        peer.on('call', function(call){
          console.log('Answering a call!');

          call.answer(peerLocalStream);
          _setupCallEvents(call);
        });

        // Receiving a data connection
        peer.on('connection', function(connection) {
          console.log('Answering a connection!', connection);
          $rootScope.$emit('peerConnectionReceived', connection);
        });

        peer.on('error', function(err){
          console.log('ERROR! Couldn\'t connect to given peer');

          $rootScope.$emit('callFailed', err);
        });

        // As convenience, add our localStream to global window object
        console.log('Peer Connect: Stream ready: ', stream);
        window.localStream = stream;

      }, function(){ deferred.reject('Failed to getUserMedia!'); });


      return {
        getPeer: function() {
          return deferred.promise;
        }
      };

  }]);
