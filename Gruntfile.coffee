path = require 'path'


module.exports = (grunt) ->
  require('time-grunt') grunt
  require('load-grunt-tasks') grunt

  grunt.registerTask 'default', ->
    grunt.task.run [
      'coffee'
      'parallel:develop'
    ]
  grunt.registerTask 'build', ->
    grunt.task.run [
      'coffee'

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
      router:
        expand: true
        flatten: no
        cwd: 'src'
        src: [
          path.join '**', '*.coffee'
        ]
        dest: '.'
        ext: '.js'
    watch:
      router:
        files: [
          path.join 'src', '**', '*.coffee'
        ]
        tasks: ['coffee:router']
        options:
          spawn: no
    parallel:
      develop:
        tasks: [
          {
            grunt: yes
            stream: yes
            args: ['watch']
          }
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
