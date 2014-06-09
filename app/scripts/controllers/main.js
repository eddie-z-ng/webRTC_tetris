'use strict';

angular.module('gameRtcApp')
  .controller('MainCtrl', ['$rootScope', '$scope', 'HeadTrackerMedia', 'PeerConnect',
    function ($rootScope, $scope, HeadTrackerMedia, PeerConnect) {

      var theirCanvas  = document.getElementById('their-gamecanvas'),
          theirCtx     = theirCanvas.getContext('2d'),
          theirUcanvas = document.getElementById('their-upcoming'),
          theirUctx    = theirUcanvas.getContext('2d');

          theirCanvas.width   = theirCanvas.clientWidth;  // set canvas logical size equal to its physical size
          theirCanvas.height  = theirCanvas.clientHeight; // (ditto)
          theirUcanvas.width  = theirUcanvas.clientWidth;
          theirUcanvas.height = theirUcanvas.clientHeight;

      $scope.gameStartCount = 0;
      $scope.gameWon = false;
      $scope.connected = false;
      $scope.gameCount = 0;
      $scope.playing = false;
      $scope.waiting = false;

      $scope.play = function(originator) {
        $scope.gameWon = false;

        $scope.gameStartCount += 1;
        $scope.waiting = true;

        if (originator) {
          var data = {};
          data.gameStart = true;

          data = JSON.stringify(data);
          $scope.peerDataConnection.send(data);
        }

        if ($scope.gameStartCount >= 2) {

          $scope.countDown = 3;
          var timer = setInterval(function(){
            $scope.countDown--;
            $scope.$apply();
            console.log($scope.countDown);

            if ($scope.countDown === 0) {
              $scope.waiting = false;
              window.play();

              $scope.playing = true;
              $scope.gameCount += 1;

              console.log("Starting game in scope", $scope.waiting);
              clearInterval(timer);

              $scope.countDown = null;
            }
            $scope.$apply();
          }, 1000);

        }
      };

      function handleReceiptPeerData (data) {
        if (data.drawEvent) {
          // draw the received rectangle event
          var theirCanvasOverlay = document.getElementById('their-overlay');
          var theirOverlayContext = theirCanvasOverlay.getContext('2d');

          window.drawRectangle(theirCanvasOverlay, theirOverlayContext, data);
        } else {

          data = JSON.parse(data);
          if (data.boardData) {

            theirCanvas.width = data.canvasWidth;
            theirCanvas.height = data.canvasHeight;

            theirUcanvas.width = data.ucanvasWidth;
            theirUcanvas.height = data.ucanvasHeight;

            data.invalid.court = true; // prevent blinking
            data.invalid.next = true;

            window.draw(theirCtx, theirUcanvas, theirUctx, data);
          } else if (data.garbageRowData) {

            window.addGarbageLines(data.garbageRowData);

          } else if (data.gameStart) {

            // console.log("Received game start!");
            $scope.play(false);

          } else if (data.gameOver) {

            // console.log("Received game over");
            window.lose(false);

            $scope.gameStartCount = 0;
            $scope.playing = false;
            $scope.gameWon = true;

            $scope.$apply();

          } else {
            $scope.receivedData = data;
            $scope.$apply();
          }

        }
      }

      function attachReceiptListeners() {
        // Connected to peer -- listen for boardChange event
        document.addEventListener('boardChange', function(event) {
          if (event.boardRepresentation) {
            var data = event.boardRepresentation;
            data.boardData = true;

            data = JSON.stringify(data);
            $scope.peerDataConnection.send(data);
          }
        });

        // Connected to peer -- listen for gameOver event
        document.addEventListener('gameOver', function(event) {
          var data = {};
          data.gameOver = true;

          data = JSON.stringify(data);
          $scope.peerDataConnection.send(data);

          $scope.gameStartCount = 0;
          $scope.playing = false;
          $scope.gameWon = false;

          $scope.$apply();
        });

        // Connected to peer -- listen for garbageRow event
        document.addEventListener('garbageRow', function(event) {
          var data = { garbageRowData: event.garbageRows};

          data = JSON.stringify(data);
          $scope.peerDataConnection.send(data);
        });

        // Set up receipt of data (this is the original peer receiver)
        $scope.peerDataConnection.on('data', handleReceiptPeerData);
      }

      $scope.callPeer = function(){};
      $scope.peerURL = '';
      $scope.receivedData = '';

      HeadTrackerMedia.getHTrackMedia().then(function(hTrackObject) {

        console.log("Got htrackmedia: ", hTrackObject);
        var localStream = hTrackObject.stream;

        PeerConnect.getPeer(localStream).then(function(peerObject) {
          $scope.my_id = peerObject.peer.id;

          $rootScope.$on('connectionChange', function (event, connection) {
            console.log('Connection change event!', connection);
            $scope.peerDataConnection = connection;

            attachReceiptListeners();

            $scope.connected = true;

            $scope.remotePeerId = connection.peer;

            $scope.$apply();
          });


          $rootScope.$on('drawEvent', function(event, dataEvent) {
            if ($scope.peerDataConnection) {
              var data = {
                x: dataEvent.x,
                y: dataEvent.y,
                angle: dataEvent.angle,
                detection: dataEvent.detection,
                width: dataEvent.width,
                height: dataEvent.height,
                style: '#3052db'
              };
              data.drawEvent = true;
              $scope.peerDataConnection.send(data);
            }
          });


          $rootScope.$on('peerStream', function(event, objURL) {
            console.log('Peer stream!', objURL);
            $scope.peerURL = objURL;
            $scope.$apply();
          });


          $scope.endCall = function() {
            peerObject.endCall();
            $scope.connected = false;
          };

          $scope.callPeer = function() {
            var remotePeerId = $scope.remotePeerId;
            $scope.peerDataConnection = peerObject.makeCall(remotePeerId);

            attachReceiptListeners();

            $scope.connected = true;
          };

          $scope.sendData = function() {
            $scope.peerDataConnection.send($scope.dataToSend);
          };

        });
      });

  }]);


// function takepicture() {
//   canvas.width = width;
//   canvas.height = height;
//   canvas.getContext('2d').drawImage(video, 0, 0, width, height);
//   var data = canvas.toDataURL('image/png');
//   photo.setAttribute('src', data);
// }
