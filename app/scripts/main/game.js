(function() {
  var cameraStream = null;
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
  // canvasOverlay.style.position = "absolute";
  // canvasOverlay.style.top = '110px';
  // canvasOverlay.style.zIndex = '100001';
  // canvasOverlay.style.display = 'block';
  // debugOverlay.style.position = "absolute";
  // debugOverlay.style.top = '0px';
  // debugOverlay.style.zIndex = '100002';
  // debugOverlay.style.display = 'none';

  // add some custom messaging

  statusMessages = {
    "whitebalance" : "checking for stability of camera whitebalance",
    "detecting" : "Detecting face",
    "hints" : "Hmm. Detecting the face is taking a long time",
    "redetecting" : "Lost track of face, redetecting",
    "lost" : "Lost track of face",
    "found" : "Tracking face"
  };

  supportMessages = {
    "no getUserMedia" : "Unfortunately, <a href='http://dev.w3.org/2011/webrtc/editor/getusermedia.html'>getUserMedia</a> is not supported in your browser. Try <a href='http://www.opera.com/browser/'>downloading Opera 12</a> or <a href='http://caniuse.com/stream'>another browser that supports getUserMedia</a>. Now using fallback video for facedetection.",
    "no camera" : "No camera found. Using fallback video for facedetection."
  };

  // the face tracking setup

  var htracker = new headtrackr.Tracker({altVideo : {ogv : "./media/capture5.ogv", mp4 : "./media/capture5.mp4"}, calcAngles : true, ui : false, headPosition : false, debug : debugOverlay});
  htracker.init(videoInput, canvasInput);
  htracker.start();

  window.htracker = htracker;
  window.showProbabilityCanvas = showProbabilityCanvas;


  function getLocalStream (e) {
    if (e.status === 'camera found') {
      setTimeout(function() {
        console.log('Stream is ', htracker.stream);
        window.localStream = htracker.stream;
        // document.removeEventListener('headtrackrStatus',
        //   getLocalStream);

        // emit event
        var event = new Event('localStreamReady');
        event.stream = htracker.stream;
        document.dispatchEvent(event);
      }, 1); // Delay this so that headtrackr.js finishes initializing stream
    } else {
      console.log(e.status);
    }


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
    drawRectangle(event);
    //drawCircle(event.x, event.y);
  });

  function drawRectangle(event) {
    overlayContext.clearRect(0,0,canvasInput.width,canvasInput.height);
    // once we have stable tracking, draw rectangle
    if (event.detection == "CS") {
      overlayContext.translate(event.x, event.y)
      overlayContext.rotate(event.angle-(Math.PI/2));
      overlayContext.strokeStyle = "#BADA55";
      overlayContext.strokeRect((-(event.width/2)) >> 0, (-(event.height/2)) >> 0, event.width, event.height/1.2);
      overlayContext.rotate((Math.PI/2)-event.angle);
      overlayContext.translate(-event.x, -event.y);
    }
  }

  function drawCircle(x, y) {
     overlayContext.strokeStyle = '#0000FF';
     overlayContext.fillStyle = '#FFFF00';
     overlayContext.lineWidth = 4;
     overlayContext.beginPath();
     overlayContext.arc(x, y, 50, 0, Math.PI * 2, true);
     overlayContext.closePath();
     overlayContext.stroke();
     overlayContext.fill();

      // The smile
      overlayContext.strokeStyle = '#FF0000';
      overlayContext.lineWidth = 2;
      overlayContext.beginPath();
      overlayContext.arc(x, y - 10, 40, 0.2 * Math.PI, 0.8 * Math.PI, false);
      // overlayContext.closePath();
      overlayContext.stroke();
      // overlayContext.fill();

      // The Left eye
      overlayContext.strokeStyle = '#000000';
      overlayContext.fillStyle = '#000000';
      overlayContext.beginPath();
      overlayContext.arc(x - 20, y - 15, 10, 0 * Math.PI, 2 * Math.PI, false);
      overlayContext.closePath();
      overlayContext.stroke();
      overlayContext.fill();

      // The Right Eye
      overlayContext.strokeStyle = '#000000';
      overlayContext.fillStyle = '#000000';
      overlayContext.beginPath();
      overlayContext.arc(x + 20, y - 15, 10, 0 * Math.PI, 2 * Math.PI, false);
      overlayContext.closePath();
      overlayContext.stroke();
      overlayContext.fill();
  }


  // turn off or on the canvas showing probability
  function showProbabilityCanvas() {
    var debugCanvas = document.getElementById('debug');
    if (debugCanvas.style.display == 'none') {
      debugCanvas.style.display = 'block';
    } else {
      debugCanvas.style.display = 'none';
    }
  }

  function takepicture() {
    canvasInput.getContext('2d').drawImage(videoInput, 0, 0, width, height);
    var data = canvasInput.toDataURL('image/png');
    console.log(data);
    photo.setAttribute('src', data);
  }

  startbutton.addEventListener('click', function(ev){
      takepicture();
    ev.preventDefault();
  }, false);
})();