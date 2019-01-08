http = require 'http'
path = require 'path'
config = require 'config'
express = require 'express'


app = express()
server = http.createServer app

app.use '/capybara-router/example/data', express.static(path.join(__dirname, '..', 'example', 'data'))
app.use (req, res) ->
  res.sendFile path.join(__dirname, '..', 'index.html')

# launch server
server.listen config.server.port, config.server.host, ->
  address = server.address()
  console.log "Server listening at http://#{address.address}:#{address.port}/capybara-router"
