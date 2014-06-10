'use strict';

/**
 * Get awesome things
 */


// var unconfirmedPeers = [];
// var connectedPeers = [];

module.exports = {
  connectedPeers: [],
  unconfirmedPeers: [],
  addPeerToPool: function(id) {
    this.unconfirmedPeers.push(id);
  },
  confirmPeerInPool: function(id) {
    var idIndex = this.unconfirmedPeers.indexOf(id);

    if (idIndex !== -1) {
      this.connectedPeers.push(id);

      // Remove from unconfirmed list
      this.unconfirmedPeers.splice(idIndex, 1);
    }
  },
  removePeerFromPool: function(id) {
    var cIdIndex = this.unconfirmedPeers.indexOf(id);
    var idIndex = this.connectedPeers.indexOf(id);

    if (cIdIndex !== -1) {
      this.unconfirmedPeers.splice(cIdIndex, 1);
    }

    if (idIndex !== -1) {
      this.connectedPeers.splice(idIndex, 1);
    }
  },
  getRandomPeer: function(id) {
    var idIndex = this.connectedPeers.indexOf(id);

    if (this.connectedPeers.length <= 1 || idIndex === -1) {
      console.log('Failed to connect, not enough peers');
      return -1;
    } else {
      var otherPeerIdIndex;
      do {
        otherPeerIdIndex = Math.floor(Math.random()*this.connectedPeers.length);
      } while (otherPeerIdIndex === idIndex);

      var otherPeerId = this.connectedPeers[otherPeerIdIndex];

      this.connectedPeers = this.connectedPeers.filter(function(elem, index) {
        if (index === otherPeerIdIndex || index === idIndex) {
          return false;
        }
        return true;
      });
      console.log("Within Filtered", this.connectedPeers);

      return otherPeerId;
    }


//     var idIndex = this.connectedPeers.indexOf(id);
// console.log(this.connectedPeers);
//     if (this.connectedPeers.length <= 1 || idIndex === -1) {
//       console.log("Failed to connect, not enough peers");
//       return -1;
//     }
//     else {
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

    }

};