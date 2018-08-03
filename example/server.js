(function() {
  var app, config, express, http, path, server;

  http = require('http');

  path = require('path');

  config = require('config');

  express = require('express');

  app = express();

  server = http.createServer(app);

  app.use('/re-router', express.static(path.join(__dirname, '..')));

  // launch server
  server.listen(config.server.port, config.server.host, function() {
    var address;
    address = server.address();
    return console.log(`Server listening at http://${address.address}:${address.port}/re-router`);
  });

}).call(this);
