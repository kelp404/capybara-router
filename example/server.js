const http = require('http');
const path = require('path');
const config = require('config');
const express = require('express');

const app = express();

app.get('/', (req, res) => res.redirect('/capybara-router'));
app.use('/capybara-router/example/data', express.static(path.join(__dirname, '..', 'example', 'data')));
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Launch server.
const server = http.createServer(app);
server.listen(config.server.port, config.server.host, () => {
  const address = server.address();
  console.log(`Server listening at http://${address.address}:${address.port}/capybara-router`);
});
