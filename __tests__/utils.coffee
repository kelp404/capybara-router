history = require 'history'
React = require 'react'
Route = require '../lib/route'
utils = require '../lib/utils'


generateFakeRoute = ->
  new Route
    name: 'web'
    uri: '/users/{userId:[\\w-]{20}}/projects?index?sort'
    resolve:
      user: (params) ->
        id: params.userId
        name: 'User'
      projects: ->
        [
          {
            id: 'AWgrmJp1SjjuUM2bzZXM'
            title: 'Project'
          }
        ]
    component: -> <div></div>

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
