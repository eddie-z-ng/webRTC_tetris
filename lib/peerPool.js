'use strict';

function _removeConfirmedPeers(list, idIndex, idIndex2) {
  var returnList;
  returnList = list.filter(function(elem, index) {
    if (index === idIndex || index === idIndex2) {
      return false;
    }
    return true;
  });
  return returnList;
}

module.exports = {
  // List of all clients (peers) connected to PeerJS Server
  allConnectedPeers: [],

  // List of all clients (peers) connected to PeerJS Server that have confirmed ready to connect to others
  confirmedConnectedPeers: [],

  // addPeerToPool and removePeerFromPool are used by PeerJS Server only
  addPeerToPool: function(id) {
    if (!this.allConnectedPeers.hasOwnProperty(id)) {
      this.allConnectedPeers[id] = false;
      return true;
    } else {
      return false;
    }
  },
  removePeerFromPool: function(id) {
    if (this.allConnectedPeers.hasOwnProperty(id)) {
      delete this.allConnectedPeers[id];
    }
    // Need to also remove them from the confirmedConnectedPeers list
    var cIndex = this.confirmedConnectedPeers.indexOf(id);
    if (cIndex > -1) {
      this.confirmedConnectedPeers.splice(cIndex, 1);
    }
  },

  // Peer client indication to server that it is ready to connect to other Peers
  confirmPeer: function(id, secret) {
    var cIndex = this.confirmedConnectedPeers.indexOf(id);

    if (this.allConnectedPeers.hasOwnProperty(id)) {
      // has not been initialized yet
      if(this.allConnectedPeers[id] === false) {
        this.allConnectedPeers[id] = secret;
      }

      // if secret matches, add confirm the peer to list if it doesn't already exist
      if (this.allConnectedPeers[id] === secret ) {
        if(cIndex === -1) {
          this.confirmedConnectedPeers.push(id);
        }
        return true;
      } else {
        console.log('\tSecret does not match for requestID', id, ' secret given: ', secret);
        return false;
      }
    } else {
      return false;
    }
  },

  // Request to connect to a specific peer
  requestConnectPeer: function(origID, requestID, secret) {
    // First check if the given IDs are even present in the pool
    if (this.allConnectedPeers.hasOwnProperty(origID) &&
        this.allConnectedPeers.hasOwnProperty(requestID)) {

      if (this.allConnectedPeers[origID] !== secret) {
        console.log('\tSecret does not match for requestID', origID, ' secret given: ', secret);
        return false;
      }

      // Check if both the originator ID and the requested ID are both confirmed
      var oIndex = this.confirmedConnectedPeers.indexOf(origID);
      var rIndex = this.confirmedConnectedPeers.indexOf(requestID);

      console.log("directed request confirmed ", this.confirmedConnectedPeers, oIndex, rIndex);

      if ((oIndex > -1) && (rIndex > -1)) {
        // Remove them from the confirmed list of peers
        this.confirmedConnectedPeers = _removeConfirmedPeers(this.confirmedConnectedPeers, oIndex, rIndex);
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  },

  // Request to connect to a random ready peer
  requestRandomPeer: function(id, secret) {
    var idIndex = this.confirmedConnectedPeers.indexOf(id);

    if (this.allConnectedPeers[id] !== secret) {
      console.log('\tSecret does not match for requestID', id, ' secret given: ', secret);
      return -1;
    }

    if (this.confirmedConnectedPeers.length <= 1 || idIndex === -1) {
      console.log('Failed to connect [', id, '] : not enough peers');
      return -1;
    } else {
      var otherPeerIdIndex;
      do {
        otherPeerIdIndex = Math.floor(Math.random()*this.confirmedConnectedPeers.length);
      } while (otherPeerIdIndex === idIndex);

      var otherPeerId = this.confirmedConnectedPeers[otherPeerIdIndex];

      this.confirmedConnectedPeers = _removeConfirmedPeers(this.confirmedConnectedPeers, idIndex, otherPeerIdIndex);

      console.log("Within Filtered", this.confirmedConnectedPeers);

      return otherPeerId;
    }

  }

};


// module.exports = {
//   connectedPeers: [],
//   unconfirmedPeers: [],

//   // PeerJS Server on connection adds peer ID to unconfirmedPeers list via addPeerToPool
//   // When a Peer disconnects from PeerJS, removePeerFromPool is called

//   addPeerToPool: function(id) {
//     var index = this.unconfirmedPeers.indexOf(id);
//     if (index === -1) {
//       this.unconfirmedPeers.push(id);
//       return true;
//     }
//     return false;
//   },

//   removePeerFromPool: function(id) {
//     var cIdIndex = this.unconfirmedPeers.indexOf(id);
//     var idIndex = this.connectedPeers.indexOf(id);

//     if (cIdIndex !== -1) {
//       this.unconfirmedPeers.splice(cIdIndex, 1);
//     }

//     if (idIndex !== -1) {
//       this.connectedPeers.splice(idIndex, 1);
//     }
//   },

//   // When a Peer confirms with the server that they can play and connect to others (i.e. getUserMedia() works), confirmPeerInPool is called

//   confirmPeerInPool: function(id) {
//     var idIndex = this.unconfirmedPeers.indexOf(id);

//     if (idIndex !== -1) {
//       var cIdIndex = this.connectedPeers.indexOf(id);

//       // Add only if it doesn't already exist
//       if(cIdIndex === -1) {
//         this.connectedPeers.push(id);
//       }

//       // Remove from unconfirmed list
//       this.unconfirmedPeers.splice(idIndex, 1);

//       return true;
//     }

//     return false;
//   },

//   connectPeerToPeer: function(id) {
//     var idIndex = this.connectedPeers.indexOf(id);

//   },

//   getRandomPeer: function(id) {
//     var idIndex = this.connectedPeers.indexOf(id);

//     if (this.connectedPeers.length <= 1 || idIndex === -1) {
//       console.log('Failed to connect, not enough peers');
//       return -1;
//     } else {
//       var otherPeerIdIndex;
//       do {
//         otherPeerIdIndex = Math.floor(Math.random()*this.connectedPeers.length);
//       } while (otherPeerIdIndex === idIndex);

//       var otherPeerId = this.connectedPeers[otherPeerIdIndex];

//       this.connectedPeers = this.connectedPeers.filter(function(elem, index) {
//         if (index === otherPeerIdIndex || index === idIndex) {
//           return false;
//         }
//         return true;
//       });
//       console.log("Within Filtered", this.connectedPeers);

//       return otherPeerId;
//     }

//   }

// };