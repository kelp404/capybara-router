const path = require('path');

const MODE = process.env.NODE_ENV || 'development';
const IS_PRODUCTION = MODE === 'production';

module.exports = () => ({
  target: 'web',
  mode: MODE,
  entry: {
    web: path.join(__dirname, 'example', 'app.js'),
  },
  devServer: {
    host: 'localhost',
    port: 8001,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Max-Age': '3000',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET',
    },
  },
  resolve: {
    extensions: ['.js'],
  },
  output: {
    path: path.join(__dirname, 'example'),
    publicPath: IS_PRODUCTION ? '/' : '//localhost:8001/',
    filename: '[name].js',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: [
                '@babel/preset-env',
                '@babel/react',
              ],
              plugins: [
                '@babel/plugin-proposal-class-properties',
              ],
            },
          },
        ],
      },
    ],
  },
});
