'use strict';

// Returns a promise that resolves to an object that has the peer and makeCall function
// makeCall calls and connects to the given remotePeerId
// Emits: 'connectionChange' events to the $rootScope
//        'peerStream' events to the $rootScope
angular.module('gameRtcApp.factories')
  .factory('PeerConnect', ['$q', '$rootScope', '$sce',
    function ($q, $rootScope, $sce) {

    var deferred = $q.defer();
    // var streamReady = false;
    var peerIdReady = false;
    var allReady = false;
    var peerLocalStream;

    var peerKey = '7k99lrngvwle4s4i';
    var stunURL = 'stun:stun.l.google.com:19302';

    // PeerJS object
    var peer = new Peer({ key: peerKey, debug: 3, config: {'iceServers': [
      { url: stunURL } // Pass in optional STUN and TURN server for maximum network compatibility
    ]}});

    peer.on('open', function(){
      peerIdReady = true;
      resolvePeer();
    });

    // document.addEventListener('localStreamReady', function(event) {
    //   streamReady = true;
    //   resolvePeer();
    // });

    // document.addEventListener('localStreamFail', function(event) {
    //   deferred.reject(event);
    // });

    function resolvePeer() {
      // allReady = streamReady && peerIdReady;
      allReady = peerIdReady;

      if (allReady) {
        var peerObject = {
          peer: peer,
          makeCall: function(remotePeerId) {
            // Initiate a call!
            console.log('Initiating a call to: ', remotePeerId);

            // var call = peer.call(remotePeerId, window.localStream);
            var call = peer.call(remotePeerId, peerLocalStream);
            step3(call);

            // Initiate a data connection!
            console.log('Initiating a data connection to: ', remotePeerId);

            // var conn = peer.connect(remotePeerId, window.localStream);
            var conn = peer.connect(remotePeerId, peerLocalStream);
            // conn.on('data', function(data) {
            //   console.log('Received:', data);
            // });
            return conn;
          },
          endCall: function() {

          }
        };
        deferred.resolve(peerObject);
      }
    }

    // Receiving a call
    peer.on('call', function(call){
      // Answer the call automatically (instead of prompting user) for demo purposes
      console.log('Answering a call!');

      // call.answer(window.localStream);
      call.answer(peerLocalStream);
      step3(call);
    });
    peer.on('error', function(err){
      alert(err.message);
      // Return to step 2 if error occurs
      step2();
    });

    // Receiving a connection
    peer.on('connection', function(connection) {
      console.log('Answering a connection!');

      // connection.on('data', function(data) {
      //   console.log('Received:', data);
      // });

      $rootScope.$emit('connectionChange', connection);
    });

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

    function step2 () {
      $('#step1, #step3').hide();
      $('#step2').show();
    }

    function step3 (call) {
      // Hang up on an existing call if present
      if (window.existingCall) {
        window.existingCall.close();
      }

      // Wait for stream on the call, then set peer video display
      call.on('stream', function(stream){
        console.log(URL.createObjectURL(stream));
        var blobURL = $sce.trustAsResourceUrl(URL.createObjectURL(stream));
        $rootScope.$emit('peerStream', blobURL);
      });

      // UI stuff
      window.existingCall = call;
      $('#their-id').text(call.peer);
      call.on('close', step2);
      $('#step1, #step2').hide();
      $('#step3').show();
    }

    return {
      getPeer: function(localStream) {
        peerLocalStream = localStream;
        return deferred.promise;
      }
    };

  }]);
