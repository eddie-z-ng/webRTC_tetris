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

      function handleReceiptPeerData (data) {
        if (data.drawEvent) {
          // draw the received rectangle event
          //console.log("Should draw rectangle for event:", data.drawEvent);
          var theirCanvasInput = document.getElementById('their-video-canvas');
          var theirCanvasOverlay = document.getElementById('their-overlay');
          var theirOverlayContext = theirCanvasOverlay.getContext('2d');

          window.drawRectangle(theirCanvasInput, theirOverlayContext, data);
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

            console.log("Adding garbage lines count ", data.garbageRowData, " to my game");
            window.addGarbageLines(data.garbageRowData);

          } else {
            $scope.receivedData = data;
            $scope.$apply();
          }

        }
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

            // Connected to peer -- listen for boardChange event
            document.addEventListener('boardChange', function(event) {
              if (event.boardRepresentation) {
                var data = event.boardRepresentation;
                data.boardData = true;

                data = JSON.stringify(data);
                //console.log("Sending ", boardRepresentation);
                // console.log("Sending ", data);
                $scope.peerDataConnection.send(data);
              }
            });

            // Connected to peer -- listen for garbageRow event
            document.addEventListener('garbageRow', function(event) {
              var data = { garbageRowData: event.garbageRows};

              data = JSON.stringify(data);
              console.log("Sending garbageRowData: ", data);
              $scope.peerDataConnection.send(data);
            });

            // Set up receipt of data (this is the original peer receiver)
            $scope.peerDataConnection.on('data', handleReceiptPeerData);

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

          $scope.callPeer = function() {
            var remotePeerId = $scope.remotePeerId;
            $scope.peerDataConnection = peerObject.makeCall(remotePeerId);

            // Connected to peer -- listen for boardChange event
            document.addEventListener('boardChange', function(event) {
              // console.log("got event:", event.boardRepresentation);
              if (event.boardRepresentation) {
                var data = event.boardRepresentation;
                data.boardData = true;

                data = JSON.stringify(data);
                //console.log("Sending ", boardRepresentation);
                // console.log("Sending ", data);
                $scope.peerDataConnection.send(data);
              }
            });

            // Connected to peer -- listen for garbageRow event
            document.addEventListener('garbageRow', function(event) {
              var data = { garbageRowData: event.garbageRows};

              data = JSON.stringify(data);
              console.log("Sending garbageRowData: ", data);
              $scope.peerDataConnection.send(data);
            });

            $scope.peerDataConnection.on('data', handleReceiptPeerData);
          };

          $scope.sendData = function() {
            //console.log('Sending:', $scope.dataToSend);
            $scope.peerDataConnection.send($scope.dataToSend);
          };

        });
      });

  }]);
