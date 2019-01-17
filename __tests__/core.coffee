history = require 'history'
core = require '../lib/core'
Route = require '../lib/route'
historyActions = require '../lib/constants/history-actions'


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

test 'Go to a page with the URI.', ->
  core.history.push = jest.fn -> null
  core.go '/login'
  expect(core.history.push).toBeCalledWith '/login'

test 'Replace a page with the URI.', ->
  core.history.replace = jest.fn -> null
  core.go '/login', replace: yes
  expect(core.history.replace).toBeCalledWith '/login'

test 'Reload a page with the URI.', ->
  _reload = core.reload
  fakeReload = jest.fn -> null
  core.reload = fakeReload
  core.go '/'
  core.reload = _reload
  expect(fakeReload).toBeCalled()

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
  _reload = core.reload
  fakeReload = jest.fn -> null
  core.reload = fakeReload
  core.go name: 'home'
  core.reload = _reload
  expect(fakeReload).toBeCalled()

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

test 'Get an error when listen with a failed event name.', ->
  func = ->
    core.listen 'not-exist', ->
  expect(func).toThrow()

test 'Listen change start events.', ->
  onChangeStart = ->
  unsubscribe = core.listen 'ChangeStart', onChangeStart
  expect(core.eventHandlers.changeStart[0].func).toBe onChangeStart
  unsubscribe()
  expect(core.eventHandlers.changeStart).toEqual []

test 'Listen change success events.', ->
  onChangeSuccess = ->
  unsubscribe = core.listen 'ChangeSuccess', onChangeSuccess
  expect(core.eventHandlers.changeSuccess[0].func).toBe onChangeSuccess
  unsubscribe()
  expect(core.eventHandlers.changeSuccess).toEqual []

test 'Listen change error events.', ->
  onChangeError = ->
  unsubscribe = core.listen 'ChangeError', onChangeError
  expect(core.eventHandlers.changeError[0].func).toBe onChangeError
  unsubscribe()
  expect(core.eventHandlers.changeError).toEqual []

test 'Broadcast a start event.', ->
  route = new Route
    name: 'web'
    uri: '/'
  onChangeStart = jest.fn (action, toState, fromState, cancel) ->
    expect(action).toBe 'PUSH'
    expect(toState).toMatchSnapshot()
    expect(fromState).toMatchSnapshot()
    expect(typeof(cancel)).toBe 'function'
  unsubscribe = core.listen 'ChangeStart', onChangeStart
  core.broadcastStartEvent
    action: 'PUSH'
    cancel: ->
    previousRoute: route
    previousParams:
      id: 'old'
    nextRoute: route
    nextParams:
      id: 'new'
  unsubscribe()
  expect(onChangeStart).toBeCalled()

test 'Broadcast a success event.', ->
  route = new Route
    name: 'web'
    uri: '/'
  onChangeSuccess = jest.fn (action, toState, fromState) ->
    expect(action).toBe 'PUSH'
    expect(toState).toMatchSnapshot()
    expect(fromState).toMatchSnapshot()
  unsubscribe = core.listen 'ChangeSuccess', onChangeSuccess
  core.broadcastSuccessEvent
    action: 'PUSH'
    previousRoute: route
    previousParams:
      id: 'old'
    nextRoute: route
    nextParams:
      id: 'new'
  unsubscribe()
  expect(onChangeSuccess).toBeCalled()

test 'Broadcast an error event.', ->
  onChangeError = jest.fn (error) ->
    expect(error.constructor).toBe Error
  unsubscribe = core.listen 'ChangeError', onChangeError
  core.broadcastErrorEvent(new Error('error'))
  unsubscribe()
  expect(onChangeError).toBeCalled()

test 'Reload the page and cancel it.', ->
  onChangeStart = jest.fn (action, toState, fromState, cancel) ->
    expect(action).toBe historyActions.RELOAD
    cancel()
  unsubscribe = core.listen 'ChangeStart', onChangeStart
  core.reload()
  unsubscribe()
  expect(onChangeStart).toBeCalled()

test 'Reload the page.', ->
  _flattenResolveData = core.flattenResolveData
  core.flattenResolveData = jest.fn (resolveData) ->
    result = _flattenResolveData resolveData
    result.key = 'random'
    result
  core.reload().then (result) ->
    core.flattenResolveData = _flattenResolveData
    expect(result).toMatchSnapshot()

test 'Get an error when reload the page.', ->
  _flattenResolveData = core.flattenResolveData
  fakeFlattenResolveData = jest.fn -> throw new Error()
  onChangeError = jest.fn ->
  unsubscribe = core.listen 'ChangeError', onChangeError
  core.flattenResolveData = fakeFlattenResolveData
  core.reload().catch ->
    unsubscribe()
    core.flattenResolveData = _flattenResolveData
    expect(fakeFlattenResolveData).toBeCalled()
    expect(onChangeError).toBeCalled()
