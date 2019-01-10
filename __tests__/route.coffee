React = require 'react'
Route = require '../lib/route'


test 'Initial Route without parent.', ->
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
