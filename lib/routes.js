'use strict';

var api = require('./controllers/api'),
    index = require('./controllers'),
    peerPool = require('./peerPool');

/**
 * Application routes
 */
module.exports = function(app) {

  // Server API Routes
  app.route('/api/awesomeThings')
    .get(api.awesomeThings);

  app.route('/confirmID')
    .post(function(req, res) {
      var requestID = req.body.id;

      if (requestID) {
        console.log('Pool of peers before: ', peerPool.connectedPeers);

        peerPool.confirmPeerInPool(requestID);

        console.log('Pool of peers after: ', peerPool.connectedPeers);
      } else {
        res.send(500, { error: 'Invalid peer ID' });
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
        res.send({ peerID: peerID });
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
        res.send('Success...');
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