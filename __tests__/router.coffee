React = require 'react'
renderer = require 'react-test-renderer'
history = require 'history'
Router = require '../lib/router'
Route = require '../lib/route'
RouterView = require '../lib/components/router-view'
historyActions = require '../lib/constants/history-actions'


router = null
beforeEach ->
  router = new Router
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
        component: -> <div>Login</div>
      }
      {
        name: 'projects'
        uri: '/users/{userId:[\\w-]{20}}/projects?index'
      }
    ]
    errorComponent: -> <div>Error</div>
afterEach ->
  jest.restoreAllMocks()

test 'Going to a page with the URI will push the history state.', ->
  router.history.push = jest.fn ->
  router.go '/login'
  expect(router.history.push).toBeCalledWith '/login'

test 'Replace a page with the URI.', ->
  router.history.replace = jest.fn ->
  router.go '/login', replace: yes
  expect(router.history.replace).toBeCalledWith '/login'

test 'Reload a page with the URI.', ->
  router.reload = jest.fn ->
  router.go '/'
  expect(router.reload).toBeCalled()

test 'Going to a page with a route name will push the history state.', ->
  router.history.push = jest.fn ->
  router.go
    name: 'projects'
    params:
      userId: 'AWgrmJp1SjjuUM2bzZXM'
      index: 0
  expect(router.history.push).toBeCalledWith '/users/AWgrmJp1SjjuUM2bzZXM/projects?index=0'

test 'Replace a page with a route name.', ->
  router.history.replace = jest.fn ->
  router.go name: 'projects', params: userId: 'AWgrmJp1SjjuUM2bzZXM', index: 0,
    replace: yes
  expect(router.history.replace).toBeCalledWith '/users/AWgrmJp1SjjuUM2bzZXM/projects?index=0'

test 'Reload a page with a route name.', ->
  router.reload = jest.fn ->
  router.go name: 'home'
  expect(router.reload).toBeCalled()

test 'Get the current route.', ->
  route = router.getCurrentRoute()
  expect(route).toMatchSnapshot()

test 'Find the route by the location.', ->
  route = router.findRoute router.history.location
  expect(route).toMatchSnapshot()

test 'Get an error on finding the route by the location.', ->
  func = ->
    fakeHistory = history.createMemoryHistory
      initialEntries: ['/not-found']
    router.findRoute fakeHistory
  expect(func).toThrow Error

test 'Get an error when listen with a failed event name.', ->
  func = ->
    router.listen 'not-exist', ->
  expect(func).toThrow()

test 'Listen change start events.', ->
  onChangeStart = ->
  unsubscribe = router.listen 'ChangeStart', onChangeStart
  expect(router.eventHandlers.changeStart[0].func).toBe onChangeStart
  unsubscribe()
  expect(router.eventHandlers.changeStart).toEqual []

test 'Listen change success events.', ->
  onChangeSuccess = ->
  unsubscribe = router.listen 'ChangeSuccess', onChangeSuccess
  expect(router.eventHandlers.changeSuccess[0].func).toBe onChangeSuccess
  unsubscribe()
  expect(router.eventHandlers.changeSuccess).toEqual []

test 'Listen change error events.', ->
  onChangeError = ->
  unsubscribe = router.listen 'ChangeError', onChangeError
  expect(router.eventHandlers.changeError[0].func).toBe onChangeError
  unsubscribe()
  expect(router.eventHandlers.changeError).toEqual []

test 'Broadcast a start event.', ->
  route = new Route
    name: 'web'
    uri: '/'
  onChangeStart = jest.fn (action, toState, fromState, cancel) ->
    expect(action).toBe 'PUSH'
    expect(toState).toMatchSnapshot()
    expect(fromState).toMatchSnapshot()
    expect(typeof(cancel)).toBe 'function'
  unsubscribe = router.listen 'ChangeStart', onChangeStart
  router.broadcastStartEvent
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
  unsubscribe = router.listen 'ChangeSuccess', onChangeSuccess
  router.broadcastSuccessEvent
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
  unsubscribe = router.listen 'ChangeError', onChangeError
  router.broadcastErrorEvent(new Error('error'))
  unsubscribe()
  expect(onChangeError).toBeCalled()

test 'Start dispatch routes and cancel it.', ->
  onChangeStart = jest.fn (action, toState, fromState, cancel) ->
    expect(action).toBe historyActions.INITIAL
    cancel()
  unsubscribe = router.listen 'ChangeStart', onChangeStart
  router.start()
  unsubscribe()
  expect(onChangeStart).toBeCalled()

test 'Start dispatch routes.', ->
  onChangeStart = jest.fn ->
  onChangeSuccess = jest.fn ->
  onChangeError = jest.fn ->
  unsubscribeChangeStart = router.listen 'ChangeStart', onChangeStart
  unsubscribeChangeSuccess = router.listen 'ChangeSuccess', onChangeSuccess
  unsubscribeChangeError = router.listen 'ChangeError', onChangeError
  router.start()
  component = renderer.create do ->
    <RouterView>Loading</RouterView>
  router.promise.then (result) ->
    unsubscribeChangeStart()
    unsubscribeChangeSuccess()
    unsubscribeChangeError()
    expect(typeof(result[6].key)).toBe 'string'
    delete result[6].key
    expect(onChangeStart).toBeCalled()
    expect(onChangeSuccess).toBeCalled()
    expect(onChangeError).not.toBeCalled()
    expect(result).toMatchSnapshot()
    expect(component.toJSON()).toMatchSnapshot()

test 'Call onEnter() of the route when the router was started.', ->
  jest.spyOn(Math, 'random').mockImplementation () -> 0.1
  router.routes[0].onEnter = jest.fn ->
  router.start()
  renderer.create do ->
    <RouterView>Loading</RouterView>
  router.promise.then ->
    expect(router.routes[0].onEnter).toBeCalledWith
      key: 0.1.toString(36).substr(2)
      params: {}

test 'Render the error component when the router was started with error.', ->
  router.routes[0].resolve =
    error: -> Promise.reject new Error()
  router.start()
  component = renderer.create do ->
    <RouterView>Loading</RouterView>
  router.promise.then ->
    expect(router.views[0].name).toBeNull()
    expect(component.toJSON()).toMatchSnapshot()

test 'Go to a page and cancel it.', ->
  router.start()
  onChangeStart = jest.fn (action, toState, fromState, cancel) ->
    expect(action).toBe historyActions.PUSH
    cancel()
  onChangeError = jest.fn ->
  unsubscribeChangeStart = router.listen 'ChangeStart', onChangeStart
  unsubscribeChangeError = router.listen 'ChangeError', onChangeError
  renderer.create do ->
    <RouterView>Loading</RouterView>
  router.go '/login'
  unsubscribeChangeStart()
  unsubscribeChangeError()
  expect(onChangeStart).toBeCalled()

test 'Go to a page.', ->
  onChangeStart = jest.fn ->
  onChangeSuccess = jest.fn ->
  onChangeError = jest.fn ->
  unsubscribeChangeStart = router.listen 'ChangeStart', onChangeStart
  unsubscribeChangeSuccess = router.listen 'ChangeSuccess', onChangeSuccess
  unsubscribeChangeError = router.listen 'ChangeError', onChangeError
  router.start()
  component = renderer.create do ->
    <RouterView>Loading</RouterView>
  router.promise.then ->
    router.go '/login'
    router.promise.then (result) ->
      unsubscribeChangeStart()
      unsubscribeChangeSuccess()
      unsubscribeChangeError()
      expect(typeof(result[6].key)).toBe 'string'
      delete result[6].key
      expect(onChangeStart).toBeCalled()
      expect(onChangeSuccess).toBeCalled()
      expect(onChangeError).not.toBeCalled()
      expect(result).toMatchSnapshot()
      expect(component.toJSON()).toMatchSnapshot()

test 'Go to a page with reload.', ->
  router.start()
  renderer.create do ->
    <RouterView>Loading</RouterView>
  router.promise.then ->
    router.go '/login',
      reload: yes
    expect(router.isReloadNextHistoryChange).toBe no
  .then ->
    router.historyUnsubscription()
    router.go '/login',
      reload: yes
    expect(router.isReloadNextHistoryChange).toBe yes

test 'Call onEnter() of the route when the history was changed.', ->
  router.start()
  renderer.create do ->
    <RouterView>Loading</RouterView>
  router.promise.then ->
    jest.spyOn(Math, 'random').mockImplementation () -> 0.1
    router.routes[1].onEnter = jest.fn ->
    router.go '/login'
    router.promise
  .then ->
    expect(router.routes[1].onEnter).toBeCalledWith
      key: 0.1.toString(36).substr(2)
      params: {}

test 'Render the error component when the history was changed with error.', ->
  router.routes[1].resolve =
    error: -> Promise.reject new Error()
  router.start()
  component = renderer.create do ->
    <RouterView>Loading</RouterView>
  router.promise.then ->
    jest.spyOn(Math, 'random').mockImplementation () -> 0.1
    router.routes[1].onEnter = jest.fn ->
    router.go '/login'
    router.promise
  .then ->
    expect(router.views[0].name).toBeNull()
    expect(component.toJSON()).toMatchSnapshot()

test 'Reload the page and cancel it.', ->
  router.start()
  renderer.create do ->
    <RouterView>Loading</RouterView>
  router.promise.then ->
    onChangeStart = jest.fn (action, toState, fromState, cancel) ->
      expect(action).toBe historyActions.RELOAD
      cancel()
    onChangeError = jest.fn ->
    unsubscribeChangeStart = router.listen 'ChangeStart', onChangeStart
    unsubscribeChangeError = router.listen 'ChangeError', onChangeError
    router.reload()
    unsubscribeChangeStart()
    unsubscribeChangeError()
    expect(onChangeStart).toBeCalled()

test 'Reload the page.', ->
  router.start()
  renderer.create do ->
    <RouterView>Loading</RouterView>
  router.reload().then (result) ->
    expect(typeof(result[6].key)).toBe 'string'
    delete result[6].key
    expect(result).toMatchSnapshot()

test 'Render the error component when reload with error.', ->
  router.start()
  component = renderer.create do ->
    <RouterView>Loading</RouterView>
  router.promise.then ->
    jest.spyOn(Math, 'random').mockImplementation () -> 0.1
    router.routes[0].resolve =
      error: -> Promise.reject new Error()
    router.routes[0].onEnter = jest.fn ->
    router.reload()
    router.promise
  .then ->
    expect(router.views[0].name).toBeNull()
    expect(component.toJSON()).toMatchSnapshot()

test 'Get an error when reload the page.', ->
  onChangeError = jest.fn ->
  unsubscribe = router.listen 'ChangeError', onChangeError
  router.start()
  renderer.create do ->
    <RouterView>Loading</RouterView>
  router.flattenResolveData = jest.fn -> throw new Error()
  router.reload().catch ->
    unsubscribe()
    expect(router.flattenResolveData).toBeCalled()
    expect(onChangeError).toBeCalled()
