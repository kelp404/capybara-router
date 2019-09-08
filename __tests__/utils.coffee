history = require 'history'
React = require 'react'
Route = require '../lib/route'
utils = require '../lib/utils'


generateFakeRoute = ->
  new Route
    name: 'web'
    uri: '/users/{userId:[\\w-]{20}}/projects?index?sort'
    resolve:
      user: (params) -> new Promise (resolve) ->
        resolve
          id: params.userId
          name: 'User'
      projects: -> new Promise (resolve) ->
        resolve [
          id: 'AWgrmJp1SjjuUM2bzZXM'
          title: 'Project'
        ]
    component: -> <div></div>

test 'Generate a route with the parent.', ->
  parent = utils.generateRoute
    name: 'web'
    uri: '/users/{userId:[\\w-]{20}}/projects?index?sort'
    resolve:
      id: -> 'id'
    onEnter: ->
    component: ->
  child = utils.generateRoute
    name: 'web.project'
    uri: '/users/{userId:[\\w-]{20}}/projects/{projectId:[\\w-]{20}}'
    resolve:
      id: -> 'id'
    onEnter: ->
    component: ->
  , [parent]
  expect(parent).toMatchSnapshot()
  expect(child).toMatchSnapshot()

test 'Get an error on generating a route with a resolve key called "key".', ->
  func = ->
    utils.generateRoute
      name: 'web'
      uri: '/'
      resolve:
        key: -> null
  expect(func).toThrow Error
test 'Get an error on generating a route with a resolve key called "params".', ->
  func = ->
    utils.generateRoute
      name: 'web'
      uri: '/'
      resolve:
        params: -> null
  expect(func).toThrow Error

test 'Find the route by the name.', ->
  routes = [
    new Route
      name: 'web'
      uri: '/'
  ]
  route = utils.findRouteByNameInRoutes 'web', routes
  expect(route).toMatchSnapshot()

test 'Get an error on finding the route by the name.', ->
  routes = [
    new Route
      name: 'web'
      uri: '/'
  ]
  func = ->
    utils.findRouteByNameInRoutes 'not-found', routes
  expect(func).toThrow Error

test 'Generate the URI of the route with params', ->
  fakeRoute = generateFakeRoute()
  uri = utils.generateUri fakeRoute,
    userId: 'AWgrmJp1SjjuUM2bzZXM'
    index: 0
    sort: 'asc'
  expect(uri).toMatchSnapshot()

test 'Parse params from the location.', ->
  fakeRoute = generateFakeRoute()
  fakeHistory = history.createMemoryHistory
    initialEntries: ['/users/AWgrmJp1SjjuUM2bzZXM/projects?index=0&sort=asc']
  params = utils.parseRouteParams fakeHistory.location, fakeRoute
  expect(params).toMatchSnapshot()

test 'Fetch resolve data.', ->
  fakeRoute = generateFakeRoute()
  fakeHistory = history.createMemoryHistory
    initialEntries: ['/users/AWgrmJp1SjjuUM2bzZXM/projects?index=0&sort=asc']
  params = utils.parseRouteParams fakeHistory.location, fakeRoute
  utils.fetchResolveData(fakeRoute, params, {}, fakeHistory).then (result) ->
    expect(result).toMatchSnapshot()

test 'Fetch resolve data with reusable resolve data.', ->
  fakeRoute = generateFakeRoute()
  fakeHistory = history.createMemoryHistory
    initialEntries: ['/users/AWgrmJp1SjjuUM2bzZXM/projects?index=0&sort=asc']
  params = utils.parseRouteParams fakeHistory.location, fakeRoute
  utils.fetchResolveData(fakeRoute, params, {web: user: 'old user'}, fakeHistory).then (result) ->
    expect(result).toMatchSnapshot()

test 'Fetch resolve data with error.', ->
  fakeRoute = new Route
    name: 'web'
    uri: '/users/{userId:[\\w-]{20}}/projects?index?sort'
    resolve:
      user: (params) -> new Promise (resolve, reject) ->
        reject new Error()
      projects: -> new Promise (resolve) ->
        resolve [
          id: 'AWgrmJp1SjjuUM2bzZXM'
          title: 'Project'
        ]
    component: -> <div></div>
  fakeHistory = history.createMemoryHistory
    initialEntries: ['/users/AWgrmJp1SjjuUM2bzZXM/projects?index=0&sort=asc']
  params = utils.parseRouteParams fakeHistory.location, fakeRoute
  resolve = jest.fn ->
  reject = jest.fn ->
  utils.fetchResolveData fakeRoute, params, {}, fakeHistory
    .then resolve
    .catch reject
    .finally ->
      expect(resolve).not.toBeCalled()
      expect(reject).toBeCalled()

test 'Flatten resolve data.', ->
  result = utils.flattenResolveData
    web:
      user:
        id: 'id'
        name: 'name'
  expect(result).toMatchSnapshot()

test 'Fetch resolve data with lazy loading.', ->
  parentRoute = new Route
    name: 'web'
    uri: '/'
    loadComponent: ->
      default: <div>parent</div>
  fakeRoute = new Route
    name: 'web.user'
    uri: 'users/{userId:[\\w-]{20}}/projects?index?sort'
    loadComponent: ->
      default: <div>child</div>
  , parentRoute
  fakeHistory = history.createMemoryHistory
    initialEntries: ['/users/AWgrmJp1SjjuUM2bzZXM/projects?index=0&sort=asc']

  params = utils.parseRouteParams fakeHistory.location, fakeRoute
  resolve = jest.fn ->
    expect(parentRoute.component).toMatchSnapshot()
    expect(fakeRoute.component).toMatchSnapshot()
  reject = jest.fn ->
  utils.fetchResolveData fakeRoute, params, {}, fakeHistory
    .then resolve
    .catch reject
    .finally ->
      expect(resolve).toBeCalled()
      expect(reject).not.toBeCalled()
