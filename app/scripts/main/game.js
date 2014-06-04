(function() {
  // set up video and canvas elements needed

  var videoInput = document.getElementById('vid');
  var canvasInput = document.getElementById('compare');
  var canvasOverlay = document.getElementById('overlay')
  var debugOverlay = document.getElementById('debug');
  var overlayContext = canvasOverlay.getContext('2d');
  var photo        = document.querySelector('#photo');
  var startbutton  = document.querySelector('#startbutton');
  var width = 320;
  var height = 0;
  canvasOverlay.style.position = "absolute";
  canvasOverlay.style.top = '110px';
  canvasOverlay.style.zIndex = '100001';
  canvasOverlay.style.display = 'block';
  debugOverlay.style.position = "absolute";
  debugOverlay.style.top = '0px';
  debugOverlay.style.zIndex = '100002';
  debugOverlay.style.display = 'none';

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

  document.addEventListener("headtrackrStatus", function(event) {
    if (event.status in supportMessages) {
      var messagep = document.getElementById('gUMMessage');
      messagep.innerHTML = supportMessages[event.status];
    } else if (event.status in statusMessages) {
      var messagep = document.getElementById('headtrackerMessage');
      messagep.innerHTML = statusMessages[event.status];
    }
  }, true);

  // the face tracking setup

  var htracker = new headtrackr.Tracker({altVideo : {ogv : "./media/capture5.ogv", mp4 : "./media/capture5.mp4"}, calcAngles : true, ui : false, headPosition : false, debug : debugOverlay});
  htracker.init(videoInput, canvasInput);
  htracker.start();

  // for each facetracking event received draw rectangle around tracked face on canvas

  document.addEventListener("facetrackingEvent", function( event ) {
    // clear canvas
    overlayContext.clearRect(0,0,320,240);
    // once we have stable tracking, draw rectangle
    if (event.detection == "CS") {
      overlayContext.translate(event.x, event.y)
      overlayContext.rotate(event.angle-(Math.PI/2));
      overlayContext.strokeStyle = "#BADA55";
      overlayContext.strokeRect((-(event.width/2)) >> 0, (-(event.height/2)) >> 0, event.width, event.height);
      overlayContext.rotate((Math.PI/2)-event.angle);
      overlayContext.translate(-event.x, -event.y);
    }
  });

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