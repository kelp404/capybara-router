const path = require('path');

module.exports = (env = {}) => {
  return {
    target: 'web',
    mode: env.mode || 'development',
    entry: {
      web: path.join(__dirname, 'example', 'app.js')
    },
    devServer: {
      host: 'localhost',
      port: 8001,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Max-Age': '3000',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET'
      }
    },
    resolve: {
      extensions: ['.js']
    },
    output: {
      path: path.join(__dirname, 'example'),
      publicPath: '/',
      filename: '[name].js'
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
                  '@babel/react'
                ],
                plugins: [
                  '@babel/plugin-proposal-class-properties'
                ]
              }
            }
          ]
        }
      ]
    }
  };
};
