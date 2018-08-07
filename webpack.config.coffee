path = require 'path'


module.exports = ->
  target: 'web'
  mode: 'development'
  entry:
    'app': path.join __dirname, 'example', 'app.coffee'
  devServer:
    host: '0.0.0.0'
    port: 8001
    headers:
      'Access-Control-Allow-Origin': '*'
      'Access-Control-Max-Age': '3000'
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      'Access-Control-Allow-Methods': 'GET'
  resolve:
    extensions: ['.js', '.coffee']
  output:
    path: path.join __dirname, 'example'
    publicPath: '/'
    filename: '[name].js'
  module:
    rules: [
      {
        test: /\.coffee$/
        loaders: ['coffee-loader', 'cjsx-loader']
        exclude: /node_modules/
      }
    ]
