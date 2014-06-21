'use strict';

var express = require('express');

var PeerServer = require('peer').PeerServer;
var peerPool = require('./lib/peerPool');

/**
 * Main application file
 */

// Set default node environment to development
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

var config = require('./lib/config/config');

// Setup Express
var app = express();
require('./lib/config/express')(app);

var io;

// Start server
var server = app.listen(config.port, config.ip, function () {
  console.log('Express server listening on %s:%d, in %s mode', config.ip, config.port, app.get('env'));

  var peerServer = new PeerServer({port:3000, path:'/'});

  peerServer.on('connection', function(id) {
   console.log(new Date(), '++Connection from ', id);

   peerPool.addPeerToPool(id);

   console.log('\tAll Connected Peers ==>', peerPool.allConnectedPeers);
   console.log('\tConfirmed Peers ==>', peerPool.confirmedConnectedPeers);
  });

  peerServer.on('disconnect', function(id) {
   console.log(new Date(), '--Disconnect of ', id);

   peerPool.removePeerFromPool(id);

   console.log('\tAll Connected Peers ==>', peerPool.allConnectedPeers);
   console.log('\tConfirmed Peers ==>', peerPool.confirmedConnectedPeers);

   io.sockets.emit('peer_pool', peerPool.confirmedConnectedPeers);
  });

});

io = require('socket.io').listen(server);

require('./lib/routes')(app, io);

// Expose app
exports = module.exports = app;
