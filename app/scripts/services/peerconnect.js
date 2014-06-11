'use strict';

// Returns a promise that resolves to an object that has the peer and makeCall function
// makeCall calls and connects to the given remotePeerId
// Emits: 'connectionChange' events to the $rootScope
//        'peerStream' events to the $rootScope
angular.module('gameRtcApp.factories')
  .factory('PeerConnect', ['$q', '$rootScope', '$sce', '$location',
    function ($q, $rootScope, $sce, $location) {

    var deferred = $q.defer();
    var peerIdReady = false;
    var allReady = false;
    var peerLocalStream;
    var peer;
    var blobURL;

    var existingCall;

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
        alert(err.message);
        // Return to step 2 if error occurs
        step2();
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

            var conn = peer.connect(remotePeerId, peerLocalStream);

            return conn;
          },
          endCall: function() {
            existingCall.close();
          }
        };
        deferred.resolve(peerObject);
      }
    }



    // // Click handlers setup
    // $(function(){
    //   // $('#make-call').click(function(){
    //   //   // Initiate a call!
    //   //   var call = peer.call($('#callto-id').val(), window.localStream);

    //   //   step3(call);
    //   // });

    //   // $('#end-call').click(function(){
    //   //   window.existingCall.close();
    //   //   step2();
    //   // });

    //   // // Retry if getUserMedia fails
    //   // $('#step1-retry').click(function(){
    //   //   $('#step1-error').hide();
    //   //   step1();
    //   // });

    //   // Get things started
    //   step1();
    // });

    function step1 () {
      console.log("Step 1: Local Stream is: ", window.localStream);
      step2();
    }

    // function step2 () {
    //   $('#step1, #step3').hide();
    //   $('#step2').show();
    // }

    function initiateCall (call) {
      // Hang up on an existing call if present
      if (existingCall) {
        existingCall.close();
      }

      // Wait for stream on the call, then set peer video display
      call.on('stream', function(stream){
        console.log(URL.createObjectURL(stream));
        var blobURL = $sce.trustAsResourceUrl(URL.createObjectURL(stream));
        $rootScope.$emit('peerStream', blobURL);
      });

      // UI stuff
      existingCall = call;

      // $('#their-id').text(call.peer);
      // call.on('close', step2);
      // $('#step1, #step2').hide();
      // $('#step3').show();
    }

    return {
      getPeer: function() {
        return deferred.promise;
      }
    };

  }]);
