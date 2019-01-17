React = require 'react'
Route = require '../lib/route'


test 'Initial Route without a parent.', ->
  route = new Route
    name: 'web'
    uri: '/users/{userId:[\\w-]{20}}/projects?index'
    resolve:
      user: (params) ->
        id: params.userId
        name: 'User'
      projects: ->
        [
          id: 'AWgrmJp1SjjuUM2bzZXM'
          title: 'Project'
        ]
    component: -> <div></div>
  expect(route).toMatchSnapshot()

test 'Initial Route with a parent.', ->
  parent = new Route
    name: 'web'
    uri: '/'
  args =
    name: 'web.dashboard'
    uri: 'dashboard'
  route = new Route(args, parent)
  expect(route).toMatchSnapshot()
