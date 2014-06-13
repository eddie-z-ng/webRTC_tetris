'use strict';

angular.module('gameRtcApp')
  .controller('MainCtrl',
    ['$rootScope', '$scope', 'PeerConnect', '$http', 'socket',
    function ($rootScope, $scope, PeerConnect, $http, socket) {

      var theirCanvas  = document.getElementById('their-gamecanvas'),
          theirCtx     = theirCanvas.getContext('2d'),
          theirUcanvas = document.getElementById('their-upcoming'),
          theirUctx    = theirUcanvas.getContext('2d');

      var homeBtn = document.getElementById('moveToHome');
      var gameBtn = document.getElementById('moveToGame');

      var musicPaused = false;
      var musicLoopEnabled = false;

      $scope.gameStartCount = 0;
      $scope.gameWon = false;
      $scope.streamReady = false;
      $scope.connected = false;
      $scope.gameCount = 0;
      $scope.playing = false;
      $scope.waiting = false;

      $scope.musicEnabled = (function() {
        if (window.tetrisMusic) {

          $scope.playMusic = function() {
            if(!musicPaused && !musicLoopEnabled) {
              window.tetrisMusic.loopSound();
              musicLoopEnabled = true;
            } else if (musicPaused) {
              window.tetrisMusic.resume();
              musicPaused = false;
            }
          };

          $scope.stopMusic = function() {
            musicLoopEnabled = false;
            window.tetrisMusic.stop();
          };

          $scope.pauseMusic = function() {
            musicPaused = true;
            window.tetrisMusic.pause();
          };

          return true;
        } else {
          return false;
        }
      })();
      console.log($scope.musicEnabled);

      $scope.allowMusic = false;

      window.addEventListener('resize', resize);

      function resize(event) {
        // theirCanvas.width   = theirCanvas.clientWidth;  // set canvas logical size equal to its physical size
        // theirCanvas.height  = theirCanvas.clientHeight; // (ditto)
        theirUcanvas.width  = theirUcanvas.clientWidth;
        theirUcanvas.height = theirUcanvas.clientHeight;
      }

      // Socket listeners
      // ================

      socket.on('peer_pool', function(data) {
        $scope.onlineUsers = data.length;
        $scope.peerIDs = data;
      });

      $scope.callRandomPeer = function() {
        if ($scope.my_id) {
          $http.post('/connectRandom', { id: $scope.my_id }).success(function(res) {
            console.log(res);

            $scope.remotePeerId = res.peerID;

            $scope.peerError = null;

            $scope.callPeer();

          }).error(function(data, status) {
            console.log('Failed ', data, status);

            $scope.peerError = data.error;
          });
        }
      };

      $scope.play = function(originator) {
        $scope.gameWon = false;
        $scope.gameCount = 0;

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

              if ($scope.playMusic && $scope.allowMusic) {
                $scope.playMusic();
              }

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

      var lastProcessed = new Date();
      function handleReceiptPeerData (data) {
        if (data.drawEvent) {
          // draw the received rectangle event
          var theirCanvasOverlay = document.getElementById('their-overlay');
          var theirOverlayContext = theirCanvasOverlay.getContext('2d');

          window.drawRectangle(theirCanvasOverlay, theirOverlayContext, data);
        } else {

          data = JSON.parse(data);
          if (data.boardData) {
            var now = new Date();

            if(now - lastProcessed > 1000/30) {
              lastProcessed = new Date();

              data.invalid.court = true; // prevent blinking
              data.invalid.next = true;

              window.drawTetris(theirCtx, theirCanvas, theirUctx, data);
              window.drawScore('their-score', data);
              window.drawRows('their-cleared-rows', data);
            }

          } else if (data.garbageRowData) {

            // console.log('Received ', data.garbageRowData, ' garbage lines');
            window.queueGarbageLines(data.garbageRowData);

          } else if (data.gameStart) {

            // console.log("Received game start!");
            $scope.play(false);

          } else if (data.gameOver) {

            // console.log("Received game over");

            // We win!
            window.lose(false);

            $scope.gameStartCount = 0;
            $scope.playing = false;
            $scope.gameWon = true;

//             $scope.getPicture();
// console.log('PHOTO', $scope.photo);

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

//           $scope.getPicture();
// console.log('PHOTO', $scope.photo);
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

      PeerConnect.getPeer().then(function(peerObject) {
        $scope.my_id = peerObject.peer.id;
        $scope.streamReady = true;

        $scope.videoURL = peerObject.videoURL;

        $http.post('/confirmID', { id: $scope.my_id }).success(function(res) {
          console.log(res);
        }).error(function(data, status) {
          console.log('Failed ', data, status);

          $scope.peerError = data.error;
          // $scope.$apply();
        });

        $rootScope.$on('connectionChange', function (event, connection) {
          console.log('Connection change event!', connection);
          $scope.peerDataConnection = connection;

          attachReceiptListeners();

          $scope.connected = true;
          $scope.remotePeerId = connection.peer;
          $scope.peerError = null;

          $scope.$apply();
        });

        $rootScope.$on('peerStream', function(event, objURL) {
          console.log('Peer video stream received!', objURL);
          $scope.peerURL = objURL;

           gameBtn.click();
          $scope.$apply();
        });


        $scope.endCall = function() {
          peerObject.endCall();

          $scope.gameStartCount = 0;
          $scope.connected = false;
          $scope.playing = false;
          $scope.waiting = false;

          $http.post('/returnPool', { id: $scope.my_id }).success(function(res) {
              console.log(res);
              $scope.remotePeerId = null;

              $scope.peerError = null;
          }).error(function(data, status) {
              console.log("Failed ", data, status);

              $scope.peerError = data.error;
          });
        };

        $scope.callPeer = function() {
          var remotePeerId = $scope.remotePeerId;
          $scope.peerDataConnection = peerObject.makeCall(remotePeerId);

          attachReceiptListeners();

          $scope.connected = true;

          gameBtn.click();
        };

        $scope.callPeerHelper = function(remotePeerId) {
          $scope.remotePeerId = remotePeerId;
          $scope.callPeer();
        };

        // HeadTrackerMedia.getHTrackMedia(peerObject.peerLocalStream)
        // .then(function(hTrackObject) {
        //   console.log('Htrack object: ', hTrackObject);

        //   $rootScope.$on('drawEvent', function(event, dataEvent) {
        //     if ($scope.peerDataConnection) {
        //       var data = {
        //         x: dataEvent.x,
        //         y: dataEvent.y,
        //         angle: dataEvent.angle,
        //         detection: dataEvent.detection,
        //         width: dataEvent.width,
        //         height: dataEvent.height,
        //         style: '#3052db'
        //       };
        //       data.drawEvent = true;
        //       $scope.peerDataConnection.send(data);
        //     }
        //   });

        //   $scope.getPicture = function() {
        //     $scope.photo = hTrackObject.getPicture();
        //   };

        // });


      });

  }]);
