'use strict';

angular.module('gameRtcApp')
  .controller('MainCtrl', ['$rootScope', '$scope', 'HeadTrackerMedia', 'PeerConnect',
    function ($rootScope, $scope, HeadTrackerMedia, PeerConnect) {
      $scope.callPeer = function(){};
      $scope.peerURL = '';
      $scope.receivedData = '';

      HeadTrackerMedia.getHTrackMedia().then(function(hTrackObject) {
        // htracker: htracker,
        // stream: htracker.stream,
        // canvasOverlay: canvasOverlay,
        // overlayContext: overlayContext
        console.log("Got htrackmedia: ", hTrackObject);
        var localStream = hTrackObject.stream;
        // var canvasOverlay = hTrackObject.canvasOverlay;
        // var overlayContext = hTrackObject.overlayContext;

        var theirCanvasInput = document.getElementById('their-video-canvas');
        var theirCanvasOverlay = document.getElementById('their-overlay');
        var theirOverlayContext = theirCanvasOverlay.getContext('2d');

        PeerConnect.getPeer(localStream).then(function(peerObject) {
          $scope.my_id = peerObject.peer.id;

          $rootScope.$on('connectionChange', function (event, connection) {
            console.log('Connection change event!', connection);
            $scope.peerDataConnection = connection;

            // Set up receipt of data (this is the original peer receiver)
            $scope.peerDataConnection.on('data', function(data) {
              if (data.drawEvent) {
                // draw the received rectangle event
                //console.log("Should draw rectangle for event:", data.drawEvent);
                window.drawRectangle(theirCanvasInput, theirOverlayContext, data);
              } else {
                $scope.receivedData = data;
                $scope.$apply();
              }
            });

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

            // Set up receipt of data (this is the original peer connector)
            $scope.peerDataConnection.on('data', function(data) {
              if (data.drawEvent) {
                // draw the received rectangle event
                //console.log("Should draw rectangle for event:", data.drawEvent);
                window.drawRectangle(theirCanvasInput, theirOverlayContext, data);
              } else {
                $scope.receivedData = data;
                $scope.$apply();
              }
            });
          };

          $scope.sendData = function() {
            //console.log('Sending:', $scope.dataToSend);
            $scope.peerDataConnection.send($scope.dataToSend);
          };

        });
      });

  }]);
