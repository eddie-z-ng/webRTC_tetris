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
      $scope.gameStart = false;
      $scope.playing = false;
      $scope.waiting = false;
      $scope.otherWaiting = false;

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
      console.log("Music enabled: ", $scope.musicEnabled);

      $scope.allowMusic = false;

      window.addEventListener('resize', resize);

      function callPeer(peerObject) {
        var remotePeerId = $scope.remotePeerId;
        $scope.peerDataConnection = peerObject.makeCall(remotePeerId);

        $scope.peerDataConnection.on('open', function () {
          attachReceiptListeners();

          $scope.peerError = null;
          $scope.connected = true;
          gameBtn.click();

          $scope.$apply();
        });

        $scope.peerDataConnection.on('error', function(err) {
          console.log('Failed to connect to given peerID', err);
        });
      }

      function resize(event) {
        // theirCanvas.width   = theirCanvas.clientWidth;  // set canvas logical size equal to its physical size
        // theirCanvas.height  = theirCanvas.clientHeight; // (ditto)

        // console.log("WINDOW RESIZED", window.clientHeight, window.clientWidth);
        theirUcanvas.width  = theirUcanvas.clientWidth;
        theirUcanvas.height = theirUcanvas.clientHeight;
      }

      // Socket listeners
      // ================
      socket.on('peer_pool', function(data) {
        $scope.onlineUsers = data.length;
        $scope.peerIDs = data;
      });

      $scope.play = function(originator) {
        $scope.gameWon = false;
        $scope.gameCount = 0;
        $scope.gameStartCount += 1;

        if (originator) {
          var data = {};
          data.gameStart = true;

          data = JSON.stringify(data);
          $scope.peerDataConnection.send(data);

          $scope.waiting = true;
          $scope.gameStart = true;

        } else {
          console.log('Otherwaiting is true');
          $scope.otherWaiting = true;
          $scope.$apply();
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
              $scope.otherWaiting = false;
              window.playTetris();

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
        // if (data.drawEvent) {
        //   // draw the received rectangle event
        //   var theirCanvasOverlay = document.getElementById('their-overlay');
        //   var theirOverlayContext = theirCanvasOverlay.getContext('2d');

        //   window.drawRectangle(theirCanvasOverlay, theirOverlayContext, data);
        // } else {

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
            $scope.gameStart = false;
            $scope.playing = false;
            $scope.gameWon = true;

//             $scope.getPicture();
// console.log('PHOTO', $scope.photo);

            $scope.$apply();

          } else {
            $scope.receivedData = data;
            $scope.$apply();
          }

        // }
      }

      function attachLocalListeners() {
        // These are event listeners for our own events from Tetris
        // If we're connected to an opponent, we need to send these events over

        // Listen for boardChange event
        document.addEventListener('boardChange', function(event) {
          if($scope.connected) {
            if (event.boardRepresentation) {
              var data = event.boardRepresentation;
              data.boardData = true;

              data = JSON.stringify(data);
              $scope.peerDataConnection.send(data);
            }
          }
        });

        // Listen for gameOver event -- we lost,
        document.addEventListener('gameOver', function(event) {
          if ($scope.connected) {
            var data = {};
            data.gameOver = true;

            data = JSON.stringify(data);
            $scope.peerDataConnection.send(data);
          }

          $scope.gameStartCount = 0;
          $scope.gameStart = false;
          $scope.playing = false;
          $scope.gameWon = false;

          $scope.$apply();
        });

        // Listen for garbageRow event -- send garbage row to opponent
        document.addEventListener('garbageRow', function(event) {
          if ($scope.connected) {
            var data = { garbageRowData: event.garbageRows};

            data = JSON.stringify(data);
            $scope.peerDataConnection.send(data);
          }
        });

      }

      function attachReceiptListeners() {
        // Reset if currently playing
        if ($scope.playing) {
          window.lose(false);
        }
        // Set up receipt of data (this is the original peer receiver)
        $scope.peerDataConnection.on('data', handleReceiptPeerData);
      }

      $scope.callPeer = function(){};
      $scope.peerURL = '';
      $scope.receivedData = '';

      PeerConnect.getPeer().then(function(peerObject) {
        $scope.my_id = peerObject.peer.id;
        $scope.streamReady = true;
        var mysecret = Math.random().toString(36).substring(10);

        $scope.videoURL = peerObject.videoURL;

        // Confirm to the server that my peerID is ready to be connected to
        $http.post('/confirmID', {
          id: $scope.my_id,
          secret: mysecret
        }).success(function(res) {
          console.log(res);

        }).error(function(data, status) {
          console.log('Failed ', data, status);

          $scope.peerError = data.error;
        });

        // Setup local Tetris game listeners so that we can send our events
        attachLocalListeners();


        $rootScope.$on('callFailed', function(event, error) {
          console.log('Call failed: ', error, error.message);
          $scope.peerError = error.message;
          $scope.$apply();
        });

        $rootScope.$on('peerConnectionReceived', function (event, connection) {
          console.log('Peer DataConnection received', connection);
          $scope.peerDataConnection = connection;

          attachReceiptListeners();

          $scope.connected = true;
          $scope.remotePeerId = connection.peer;
          $scope.peerError = null;

          $scope.$apply();
        });

        $rootScope.$on('peerStreamReceived', function(event, objURL) {
          console.log('Peer MediaStream received!', objURL);
          $scope.peerURL = objURL;

          gameBtn.click();
          $scope.$apply();
        });

        $rootScope.$on('callEnded', function(event, callObject) {
          console.log('Peer Disconnected!', callObject);

          if ($scope.playing) {
            window.lose(false);
            $scope.gameWon = true;
          }

          $scope.gameStartCount = 0;
          $scope.connected = false;
          $scope.playing = false;
          $scope.waiting = false;
          $scope.otherWaiting = false;

          $http.post('/endCall', { id: $scope.my_id, secret: mysecret }).success(function(res) {
              console.log(res);
              $scope.remotePeerId = null;

              $scope.peerError = null;
          }).error(function(data, status) {
              console.log('Failed ', data, status);

              $scope.peerError = data.error;
          });

        });

        $scope.endCall = function() {
          peerObject.endCall();
        };

        $scope.callRandomPeer = function() {
          $http.post('/callRandom', {
            id: $scope.my_id,
            secret: mysecret
          }).success(function(res) {
            console.log(res);

            $scope.remotePeerId = res.peerID;
            $scope.peerError = null;
            callPeer(peerObject);

          }).error(function(data, status) {
            console.log('Failed ', data, status);

            $scope.peerError = data.error;
          });
        };

        $scope.callRequestedPeer = function() {
          var remotePeerId = $scope.remotePeerId;
          if (remotePeerId) {
            $http.post('/callPeer', {
              id: $scope.my_id,
              callee_id: remotePeerId,
              secret: mysecret
            }).success(function(res) {
              console.log(res);

              $scope.remotePeerId = res.peerID;
              $scope.peerError = null;
              callPeer(peerObject);

            }).error(function(data, status) {
              console.log('Failed ', data, status);
              $scope.peerError = data.error;
            });
          }
        };

        $scope.callPeerHelper = function(remotePeerId) {
          $scope.remotePeerId = remotePeerId;
          $scope.callRequestedPeer();
        };

      });

  }]);
