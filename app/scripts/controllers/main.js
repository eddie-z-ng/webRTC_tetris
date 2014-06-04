'use strict';

angular.module('gameRtcApp')
  .controller('MainCtrl', ['$rootScope', '$scope', 'PeerConnect',
    function ($rootScope, $scope, PeerConnect) {
      $scope.callPeer = function(){};

      PeerConnect.getPeer().then(function(peerObject) {
        $scope.my_id = peerObject.peer.id;

        $rootScope.$on('connectionChange', function (event, connection) {
          console.log('Connection change event!', connection);
          $scope.peerDataConnection = connection;
        });

        $scope.callPeer = function() {
          var remotePeerId = $scope.remotePeerId;
          $scope.peerDataConnection = peerObject.makeCall(remotePeerId);
          // $scope.peerDataConnection = peerObject.makeConnection(remotePeerId);
        };

        $scope.sendData = function() {
          console.log('Sending:', $scope.dataToSend);
          $scope.peerDataConnection.send($scope.dataToSend);
        };

      });



  }]);
