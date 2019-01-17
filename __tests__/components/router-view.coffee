history = require 'history'
React = require 'react'
renderer = require 'react-test-renderer'
{Router, RouterView} = require '../../'


router = null
beforeEach ->
  router = new Router
    history: history.createMemoryHistory
      initialEntries: ['/']
    routes: [
      name: 'home'
      uri: '/'
    ]
  router.start()

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
  router.registerRouterView = jest.fn (view) ->
    routerView = view
  component = renderer.create do ->
    <RouterView>Loading</RouterView>
  routerView.dispatch
    route:
      component: Child
    props:
      className: 'head'
  tree = component.toJSON()
  expect(tree).toMatchSnapshot()

test 'RouterView component will call router.registerRouterView() on the mount event.', ->
  router.registerRouterView = jest.fn ->
  renderer.create do ->
    <RouterView>Loading</RouterView>
  expect(router.registerRouterView).toBeCalled()
