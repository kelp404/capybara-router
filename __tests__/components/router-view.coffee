React = require 'react'
renderer = require 'react-test-renderer'
{RouterView} = require '../../'
core = require '../../lib/core'


jest.mock '../../lib/core'

beforeEach ->
  core.registerRouterView.mockClear()

test 'RouterView component render.', ->
  component = renderer.create do ->
    <RouterView>Loading</RouterView>
  tree = component.toJSON()
  expect(tree).toMatchSnapshot()

test 'RouterView component render with a child component.', ->
  class Child extends React.Component
    render: ->
      <div class={@props.className}>child</div>
  routerView = null
  core.registerRouterView = jest.fn (view) -> routerView = view
  component = renderer.create do ->
    <RouterView>Loading</RouterView>
  routerView.dispatch
    route:
      component: Child
    props:
      className: 'head'
  tree = component.toJSON()
  expect(tree).toMatchSnapshot()

test 'RouterView component will call core.registerRouterView() on the mount event.', ->
  renderer.create do ->
    <RouterView>Loading</RouterView>
  expect(core.registerRouterView).toBeCalled()
