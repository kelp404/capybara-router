history = require 'history'
React = require 'react'
Route = require '../lib/route'
utils = require '../lib/utils'


test 'Parse params from the location.', ->
  route = new Route
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
  memoryHistory = history.createMemoryHistory
    initialEntries: ['/users/AWgrmJp1SjjuUM2bzZXM/projects?index=0&sort=asc']
  params = utils.parseRouteParams memoryHistory.location, route
  expect(params).toMatchSnapshot()
