history = require 'history'
core = require '../lib/core'


test 'Generate a route without the parent.', ->
  route = core.generateRoute
    name: 'web'
    uri: '/users/{userId:[\\w-]{20}}/projects?index?sort'
    resolve:
      id: -> 'id'
    onEnter: ->
    component: ->
  expect(route).toMatchSnapshot()

test 'Get an error on generating a route with a resolve key called "key".', ->
  func = ->
    core.generateRoute
      name: 'web'
      uri: '/'
      resolve:
        key: -> null
  expect(func).toThrow Error
test 'Get an error on generating a route with a resolve key called "params".', ->
  func = ->
    core.generateRoute
      name: 'web'
      uri: '/'
      resolve:
        params: -> null
  expect(func).toThrow Error

test 'Get the current route.', ->
  core.setup
    history: history.createMemoryHistory
      initialEntries: ['/']
    routes: [
      name: 'web'
      uri: '/'
    ]
  route = core.getCurrentRoute()
  expect(route).toMatchSnapshot()

test 'Find the route by the location.', ->
  core.setup
    history: history.createMemoryHistory
      initialEntries: ['/users/AWgrmJp1SjjuUM2bzZXM/projects?index=0&sort=asc']
    routes: [
      name: 'web'
      uri: '/users/{userId:[\\w-]{20}}/projects?index?sort'
    ]
  route = core.findRoute core.history.location
  expect(route).toMatchSnapshot()

test 'Get an error on finding the route by the location.', ->
  core.setup
    history: history.createMemoryHistory
      initialEntries: ['/']
    routes: [
      name: 'web'
      uri: '/'
    ]
  func = ->
    fakeHistory = history.createMemoryHistory
      initialEntries: ['/not-found']
    core.findRoute fakeHistory
  expect(func).toThrow Error
