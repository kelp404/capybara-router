(function() {
  var app, config, express, http, path, server;

  http = require('http');

  path = require('path');

  config = require('config');

  express = require('express');

  app = express();

  server = http.createServer(app);

  app.get('/', function(req, res) {
    return res.redirect('/capybara-router');
  });

  app.use('/capybara-router/example/data', express["static"](path.join(__dirname, '..', 'example', 'data')));

  app.use(function(req, res) {
    return res.sendFile(path.join(__dirname, '..', 'index.html'));
  });

  server.listen(config.server.port, config.server.host, function() {
    var address;
    address = server.address();
    return console.log("Server listening at http://" + address.address + ":" + address.port + "/capybara-router");
  });

}).call(this);
