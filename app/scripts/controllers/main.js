'use strict';

angular.module('gameRtcApp')
  .controller('MainCtrl', ['$scope', 'PeerConnect',
    function ($scope, PeerConnect) {
      PeerConnect.getPeer().then(function(peerObject) {
        $scope.my_id = peerObject.peer.id;

        $scope.callPeer = function() {
          var remotePeerId = $scope.remotePeerId;
          peerObject.makeCall(remotePeerId);
        };
      });



  }]);
