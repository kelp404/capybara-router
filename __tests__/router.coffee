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

test 'Go to a page and cancel it.', ->
  router.start()
  onChangeStart = jest.fn (action, toState, fromState, cancel) ->
    expect(action).toBe historyActions.PUSH
    cancel()
  unsubscribe = router.listen 'ChangeStart', onChangeStart
  renderer.create do ->
    <RouterView>Loading</RouterView>
  router.go '/login'
  unsubscribe()
  expect(onChangeStart).toBeCalled()

test 'Go to a page.', ->
  router.start()
  onChangeStart = jest.fn ->
  onChangeSuccess = jest.fn ->
  unsubscribeChangeStart = router.listen 'ChangeStart', onChangeStart
  unsubscribeChangeSuccess = router.listen 'ChangeSuccess', onChangeSuccess
  component = renderer.create do ->
    <RouterView>Loading</RouterView>
  router.go '/login'
  router.promise.then (result) ->
    unsubscribeChangeStart()
    unsubscribeChangeSuccess()
    expect(typeof(result[6].key)).toBe 'string'
    delete result[6].key
    expect(onChangeStart).toBeCalled()
    expect(onChangeSuccess).toBeCalled()
    expect(result).toMatchSnapshot()
    expect(component.toJSON()).toMatchSnapshot()

test 'Reload the page and cancel it.', ->
  router.start()
  onChangeStart = jest.fn (action, toState, fromState, cancel) ->
    expect(action).toBe historyActions.RELOAD
    cancel()
  unsubscribe = router.listen 'ChangeStart', onChangeStart
  router.reload()
  unsubscribe()
  expect(onChangeStart).toBeCalled()

test 'Reload the page.', ->
  router.start()
  router.reload().then (result) ->
    expect(typeof(result[6].key)).toBe 'string'
    delete result[6].key
    expect(result).toMatchSnapshot()

test 'Get an error when reload the page.', ->
  router.start()
  onChangeError = jest.fn ->
  unsubscribe = router.listen 'ChangeError', onChangeError
  router.flattenResolveData = jest.fn -> throw new Error()
  router.reload().catch ->
    unsubscribe()
    expect(router.flattenResolveData).toBeCalled()
    expect(onChangeError).toBeCalled()
