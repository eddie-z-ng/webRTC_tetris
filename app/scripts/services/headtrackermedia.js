'use strict';

angular.module('gameRtcApp')
  .factory('HeadTrackerMedia', ['$q', '$rootScope',
    function ($q, $rootScope) {
      var deferred = $q.defer();
      var cameraStream = null;

      var resolved = false;

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
      htracker.init(videoInput, canvasInput, false);
      htracker.start();

      window.htracker = htracker;
      window.showProbabilityCanvas = showProbabilityCanvas;

      function getLocalStream (e) {
        if ( (e.status === 'camera found' || e.status in statusMessages) &&
              !resolved )
        {
          var dataObj = {
            htracker: htracker,
            stream: cameraStream,
            canvasOverlay: canvasOverlay,
            overlayContext: overlayContext,
            getPicture: function takepicture() {
              // canvasInput.width = width;
              // canvasInput.height = height;
              width = videoInput.clientWidth;
              height = videoInput.clientHeight;

              canvasInput.width = width;
              canvasInput.height = height;

              // console.log("CanvasInput", canvasInput, canvasInput.width, canvasInput.height);
              // console.log("VideoInput", videoInput, videoInput.width, videoInput.height);
              // console.log("Width - Height", width, height);

              canvasInput.getContext('2d').drawImage(videoInput, 0, 0, width, height);
              var data = canvasInput.toDataURL('image/png');
              return data;
              //photo.setAttribute('src', data);
            }
          };

          resolved = true;
          deferred.resolve(dataObj);
        }

        // Debug messages
        if (e.status in supportMessages) {
          var messagep = document.getElementById('gUMMessage');
          messagep.innerHTML = supportMessages[e.status];

          if (!resolved) {
            resolved = true;
            deferred.reject('Couldn\'t get camera/microphone');
          }

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
        getHTrackMedia: function(localStream) {
          cameraStream = localStream;
          return deferred.promise;
        }
      };

  }]);
