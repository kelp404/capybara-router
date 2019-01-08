React = require 'react'
Route = require '../lib/route'


class FakeComponent extends React.Component
  render: ->
    <div></div>

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
          {
            id: 'AWgrmJp1SjjuUM2bzZXM'
            title: 'Project'
          }
        ]
    component: FakeComponent
  expect(route).toMatchSnapshot()
