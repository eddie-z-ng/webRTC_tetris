'use strict';

angular.module('gameRtcApp.factories')
  .factory('PeerConnect', ['$q', function ($q) {

    var deferred = $q.defer();
    var streamReady = false;
    var peerIdReady = false;
    var allReady = false;

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

    document.addEventListener('localStreamReady', function(event) {
      streamReady = true;
      resolvePeer();
    });

    document.addEventListener('localStreamFail', function(event) {
      deferred.reject(event);
    });

    function resolvePeer() {
      allReady = streamReady && peerIdReady;

      if (allReady) {
        var peerObject = {
          peer: peer,
          makeCall: function(remotePeerId) {
            // Initiate a call!
            console.log('Initiating a call to: ', remotePeerId);

            var call = peer.call(remotePeerId, window.localStream);
            step3(call);
          }
        };
        deferred.resolve(peerObject);
      }
    }

    // Receiving a call
    peer.on('call', function(call){
      // Answer the call automatically (instead of prompting user) for demo purposes
      console.log('Answering a call!');

      call.answer(window.localStream);
      step3(call);
    });
    peer.on('error', function(err){
      alert(err.message);
      // Return to step 2 if error occurs
      step2();
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

    // function step1 () {
    //   // Get audio/video stream
    //   navigator.getUserMedia({audio: true, video: true}, function(stream){
    //     // Set your video displays
    //     $('#my-video').prop('src', URL.createObjectURL(stream));

    //     window.localStream = stream;
    //     step2();
    //   }, function(){ $('#step1-error').show(); });
    // }

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

        $('#their-video').prop('src', URL.createObjectURL(stream));
      });

      // UI stuff
      window.existingCall = call;
      $('#their-id').text(call.peer);
      call.on('close', step2);
      $('#step1, #step2').hide();
      $('#step3').show();
    }


    return {
      getPeer: function() {
        return deferred.promise;
      }
    };

  }]);
