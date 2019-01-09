history = require 'history'
core = require '../lib/core'


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

test 'Find the route by the name.', ->
  core.setup
    history: history.createMemoryHistory
      initialEntries: ['/']
    routes: [
      name: 'web'
      uri: '/'
    ]
  route = core.findRouteByName 'web', core.routes
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
