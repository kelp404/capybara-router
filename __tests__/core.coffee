history = require 'history'
core = require '../lib/core'


setupRouter = ->
  core.setup
    history: history.createMemoryHistory
      initialEntries: ['/']
    routes: [
      {
        name: 'home'
        uri: '/'
      }
      {
        name: 'login'
        uri: '/login'
      }
      {
        name: 'projects'
        uri: '/users/{userId:[\\w-]{20}}/projects?index'
      }
    ]

beforeEach ->
  setupRouter()
  core.history?.push?.mockClear?()
  core.history?.replace?.mockClear?()
  core.reload?.mockClear?()

test 'Go to a page with the URI.', ->
  core.history.push = jest.fn -> null
  core.go '/login'
  expect(core.history.push).toBeCalledWith '/login'

test 'Replace a page with the URI.', ->
  core.history.replace = jest.fn -> null
  core.go '/login', replace: yes
  expect(core.history.replace).toBeCalledWith '/login'

test 'Reload a page with the URI.', ->
  core.reload = jest.fn -> null
  core.go '/'
  expect(core.reload).toBeCalled()

test 'Go to a page with a route name.', ->
  core.history.push = jest.fn -> null
  core.go
    name: 'projects'
    params:
      userId: 'AWgrmJp1SjjuUM2bzZXM'
      index: 0
  expect(core.history.push).toBeCalledWith '/users/AWgrmJp1SjjuUM2bzZXM/projects?index=0'

test 'Replace a page with a route name.', ->
  core.history.replace = jest.fn -> null
  core.go name: 'projects', params: userId: 'AWgrmJp1SjjuUM2bzZXM', index: 0,
    replace: yes
  expect(core.history.replace).toBeCalledWith '/users/AWgrmJp1SjjuUM2bzZXM/projects?index=0'

test 'Reload a page with a route name.', ->
  core.reload = jest.fn -> null
  core.go name: 'home'
  expect(core.reload).toBeCalled()

test 'Get the current route.', ->
  route = core.getCurrentRoute()
  expect(route).toMatchSnapshot()

test 'Find the route by the location.', ->
  route = core.findRoute core.history.location
  expect(route).toMatchSnapshot()

test 'Get an error on finding the route by the location.', ->
  func = ->
    fakeHistory = history.createMemoryHistory
      initialEntries: ['/not-found']
    core.findRoute fakeHistory
  expect(func).toThrow Error
