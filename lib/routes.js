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

  app.route('/addPool')
    .post(function(req, res) {
      var requestID = req.body.id;
      var added = false;

      if (requestID) {
        console.log('Pool of peers before: ', peerPool.connectedPeers);

        added = peerPool.confirmPeerInPool(requestID);

        console.log('Pool of peers after: ', peerPool.connectedPeers);
      }

      if (!requestID || !added ) {
        res.send(500, { error: 'The Peer ID sent to the server was invalid - try refreshing the page' });
      } else {
        io.sockets.emit('peer_pool', peerPool.connectedPeers);
        res.send(200);
      }

    });

  app.route('/connectRandom')
    .post(function(req, res) {
      var requestID = req.body.id;
      var peerID = -1;

      if (requestID) {
        console.log('Pool of peers before: ', peerPool.connectedPeers);

        peerID = peerPool.getRandomPeer(requestID);

        console.log('Pool of peers after: ', peerPool.connectedPeers);
      }

      if (peerID !== -1) {
        io.sockets.emit('peer_pool', peerPool.connectedPeers);
        res.send(200, { peerID: peerID });
      } else {
        res.send(500, { error: 'Not enough peers or invalid peer ID' });
      }
    });

  app.route('/returnPool')
    .post(function(req, res) {
      var requestID = req.body.id;

      if (requestID) {
        console.log('Adding peer ID back to pool: ', requestID);
        peerPool.addPeerToPool(requestID);
        peerPool.confirmPeerInPool(requestID);

        console.log('Pool of peers after: ', peerPool.connectedPeers);

        io.sockets.emit('peer_pool', peerPool.connectedPeers);
        res.send(200);
      } else {
        res.send(500, { error: 'Bad Peer ID' });
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