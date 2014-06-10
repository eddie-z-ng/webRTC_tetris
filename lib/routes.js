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

  app.route('/connectRandom')
    .post(function(req, res) {
      console.log(req);
      console.log(peerPool.connectedPeers);
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