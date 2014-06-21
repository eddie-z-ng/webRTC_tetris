'use strict';

var api = require('./controllers/api'),
    index = require('./controllers'),
    peerPool = require('./peerPool');

/**
 * Application routes
 */
module.exports = function(app, io) {

  // Server API Routes
  app.route('/api/awesomeThings')
    .get(api.awesomeThings);

  app.route('/confirmID')
    .post(function(req, res) {
      var requestID = req.body.id;
      var secret = req.body.secret;
      var added = false;

      console.log(new Date(), 'Request to add ', requestID, ' to confirmed list...');

      if (requestID) {
        added = peerPool.confirmPeer(requestID, secret);
      }

      if (!requestID || !added ) {
        console.log('Failure - Confirmed Peers List: ', peerPool.confirmedConnectedPeers);

        res.send(400, { error: 'The Peer ID sent to the server was invalid - try refreshing the page' });
      } else {

        console.log('Success - Confirmed Peers List: ', peerPool.confirmedConnectedPeers.length, peerPool.confirmedConnectedPeers);

        io.sockets.emit('peer_pool', peerPool.confirmedConnectedPeers);
        res.send(200);
      }
  });

  app.route('/callPeer')
    .post(function(req, res) {
      var requestID = req.body.id;
      var secret = req.body.secret;
      var calleeID = req.body.callee_id;
      var success = false;

      console.log(new Date(), 'Request to call from [', requestID, '] to [', calleeID, ']');

      if (requestID && calleeID) {

        if (requestID === calleeID) {
          success = false;
        } else {
          success = peerPool.requestConnectPeer(requestID, calleeID, secret);
        }
      }

      if (!requestID || !calleeID || !success) {
        res.send(400, { error: 'Cannot connect to Peer ID: ' + calleeID } );
      } else {
        io.sockets.emit('peer_pool', peerPool.confirmedConnectedPeers);
        res.send(200, { peerID: calleeID });
      }
  });

  app.route('/callRandom')
    .post(function(req, res) {
      var requestID = req.body.id;
      var secret = req.body.secret;
      var peerID = -1;

      console.log(new Date(), 'Request to connect ', requestID, ' to RANDOM peer...');

      if (requestID) {
        peerID = peerPool.requestRandomPeer(requestID, secret);
      }

      if (!requestID || peerID === -1) {
        console.log('Failure: Can\'t get random peer for [', requestID, ']');
        res.send(400, { error: 'Not enough peers or invalid peer ID' });
      } else {
        console.log('Success: Connect [', requestID, '] to [', peerID, '] --> Pool of peers after: ', peerPool.confirmedConnectedPeers);

        io.sockets.emit('peer_pool', peerPool.confirmedConnectedPeers);
        res.send(200, { peerID: peerID });
      }
  });

  app.route('/endCall')
    .post(function(req, res) {
      var requestID = req.body.id;
      var secret = req.body.secret;
      var confirmed = false;

      console.log(new Date(), 'Request to return ', requestID, ' to connected peers');

      if (requestID) {
        confirmed = peerPool.confirmPeer(requestID, secret);
      }

      if (!requestID || !confirmed) {
        res.send(400, { error: 'Invalid Peer ID: ' + requestID  });
      }
      else {
        io.sockets.emit('peer_pool', peerPool.confirmedConnectedPeers);
        res.send(200);
      }
  });


  // All undefined api routes should return a 404
  app.route('/api/*')
    .get(function(req, res) {
      res.send(404);
    });

  // All other routes to use Angular routing in app/scripts/app.js
  app.route('/partials/*')
    .get(index.partials);
  app.route('/*')
    .get( index.index);
};