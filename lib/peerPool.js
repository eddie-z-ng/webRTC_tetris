'use strict';

/**
 * Get awesome things
 */

var connectedPeers = [];

module.exports = {
  connectedPeers: connectedPeers,
  addPeerToPool: function(id) {
    connectedPeers.push(id);
  },
  removePeerFromPool: function(id) {
    var idIndex = connectedPeers.indexOf(id);

    if (idIndex !== -1) {
      connectedPeers.splice(idIndex, 1);
    }
  },
  connectRandomPeer: function(id) {
    var idIndex = connectedPeers.indexOf(id);

    if (connectedPeers.length <= 1 || idIndex === -1) {
      console.log("Failed to connect, not enough peers");
    }
    else {
      var filteredList = connectedPeers.slice(0, idIndex).concat(connectedPeers.slice(idIndex+1));

      var otherPeerId = Math.floor(Math.random()*filteredList.length);

      return otherPeerId;
    }

  }
};