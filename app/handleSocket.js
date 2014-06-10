var socket = io.connect(); // TIP: .connect with no args does auto-discovery

socket.on('peer_pool', function (data) {
  console.log('Socket IO received: ', data);
});