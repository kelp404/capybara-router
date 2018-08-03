path = require 'path'


module.exports = (grunt) ->
  require('time-grunt') grunt
  require('load-grunt-tasks') grunt

  grunt.registerTask 'default', ->
    grunt.task.run [
      'coffee:node'
      'parallel:develop'
    ]

  grunt.config.init
    coffee:
      node:
        expand: true
        flatten: no
        cwd: 'example'
        src: [
          'server.coffee'
        ]
        dest: 'example'
        ext: '.js'

    parallel:
      develop:
        tasks: [
          {
            # run web server
            stream: true
            cmd: 'nodemon'
            args: [
              path.join 'example', 'server.js'
              '--watch', path.join('example', 'server.js')
            ]
          }
          {
            # run webpack dev server
            stream: true
            cmd: 'node'
            args: [
              path.join 'node_modules', 'webpack-dev-server', 'bin', 'webpack-dev-server.js'
            ]
          }
        ]
