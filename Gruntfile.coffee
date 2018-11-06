path = require 'path'


module.exports = (grunt) ->
  require('time-grunt') grunt
  require('load-grunt-tasks') grunt

  grunt.registerTask 'default', ->
    grunt.task.run [
      'cjsx'
      'parallel:develop'
    ]
  grunt.registerTask 'build', [
    'cjsx:exampleServer'
    'cjsx:router'
  ]
  grunt.registerTask 'buildTest', ['cjsx:test']

  grunt.config.init
    cjsx:
      exampleServer:
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
      test:
        expand: true
        flatten: no
        cwd: '__tests__'
        src: [
          '**/*.coffee'
        ]
        dest: '__tests__'
        ext: '.js'
    watch:
      router:
        files: [
          path.join 'src', '**', '*.coffee'
        ]
        tasks: ['cjsx:router']
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
