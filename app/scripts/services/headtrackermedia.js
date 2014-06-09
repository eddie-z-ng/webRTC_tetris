'use strict';

angular.module('gameRtcApp')
  .factory('HeadTrackerMedia', ['$q', '$rootScope',
    function ($q, $rootScope) {
      var deferred = $q.defer();
      var cameraStream = null;

      var statusMessages = {
        'whitebalance' : 'checking for stability of camera whitebalance',
        'detecting' : 'Detecting face',
        'hints' : 'Hmm. Detecting the face is taking a long time',
        'redetecting' : 'Lost track of face, redetecting',
        'lost' : 'Lost track of face',
        'found' : 'Tracking face'
      };

      var supportMessages = {
        'no getUserMedia': "Unfortunately, <a href='http://dev.w3.org/2011/webrtc/editor/getusermedia.html'>getUserMedia</a> is not supported in your browser. Try <a href='http://www.opera.com/browser/'>downloading Opera 12</a> or <a href='http://caniuse.com/stream'>another browser that supports getUserMedia</a>. Now using fallback video for facedetection.",
        'no camera': 'No camera found. Using fallback video for facedetection.'
      };

      window.URL = window.URL || window.webkitURL;
      navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

      // set up video and canvas elements needed
      function fallback(e) {
         videoInput.src = 'fallbackvideo.webm';
         console.log('Reeeejected!', e);
      }

      var videoInput = document.getElementById('my-video');
      var canvasInput = document.getElementById('my-video-canvas');
      var canvasOverlay = document.getElementById('my-overlay');
      var debugOverlay = document.getElementById('debug');
      var overlayContext = canvasOverlay.getContext('2d');
      var photo        = document.querySelector('#photo');
      var startbutton  = document.querySelector('#startbutton');
      var width = videoInput.width;
      var height = 0;


      // the face tracking setup
      var htracker = new headtrackr.Tracker({altVideo : {ogv : "./media/capture5.ogv", mp4 : "./media/capture5.mp4"}, calcAngles : true, ui : false, headPosition : false, debug : debugOverlay});
      htracker.init(videoInput, canvasInput);
      htracker.start();

      window.htracker = htracker;
      window.showProbabilityCanvas = showProbabilityCanvas;

      function getLocalStream (e) {
        if (e.status === 'camera found') {
          console.log(e.status);
          setTimeout(function() {
            console.log('Stream is ', htracker.stream);
            window.localStream = htracker.stream;
            cameraStream = htracker.stream;
            // document.removeEventListener('headtrackrStatus',
            //   getLocalStream);

            // emit event
            // var event = new Event('localStreamReady');
            // event.stream = htracker.stream;
            // document.dispatchEvent(event);

            var dataObj = {
              htracker: htracker,
              stream: htracker.stream,
              canvasOverlay: canvasOverlay,
              overlayContext: overlayContext
            };

            deferred.resolve(dataObj);

          }, 1); // Delay this so that headtrackr.js finishes initializing stream
        } else {
          console.log(e.status);
          deferred.reject("error getting stream");
        }

        // Debug messages
        if (e.status in supportMessages) {
          var messagep = document.getElementById('gUMMessage');
          messagep.innerHTML = supportMessages[e.status];
        } else if (e.status in statusMessages) {
          var messagep = document.getElementById('headtrackerMessage');
          messagep.innerHTML = statusMessages[e.status];
        }
      }

      document.addEventListener('headtrackrStatus', getLocalStream);

      // for each facetracking event received draw rectangle around tracked face on canvas
      document.addEventListener("facetrackingEvent", function( event ) {
        $rootScope.$emit('drawEvent', event);
        event.style = '#bada55';
        drawRectangle(canvasInput, overlayContext, event);

      });

      function showProbabilityCanvas() {
        var debugCanvas = document.getElementById('debug');
        if (debugCanvas.style.display == 'none') {
          debugCanvas.style.display = 'block';
        } else {
          debugCanvas.style.display = 'none';
        }
      }

      return {
        getHTrackMedia: function() {
          return deferred.promise;
        }
      };

  }]);
