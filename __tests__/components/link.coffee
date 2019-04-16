history = require 'history'
React = require 'react'
renderer = require 'react-test-renderer'
Route = require '../../lib/route'
utils = require '../../lib/utils'
{Router, Link} = require '../../'


router = null
beforeEach ->
  router = new Router
    history: history.createMemoryHistory
      initialEntries: ['/']
    routes: [
      name: 'home'
      uri: '/'
    ]
afterEach ->
  jest.restoreAllMocks()

test 'Link component render.', ->
  component = renderer.create do ->
    <Link to="https://github.com">GitHub</Link>
  tree = component.toJSON()
  expect(tree).toMatchSnapshot()

test 'Link component render with object props.', ->
  route = new Route
    name: 'web'
    uri: '/web?index'
  jest.spyOn(utils, 'findRouteByNameInRoutes').mockImplementation (name, routes) ->
    expect(name).toBe 'web'
    route
  jest.spyOn(utils, 'generateUri').mockImplementation -> '/web?index=0'
  component = renderer.create do ->
    <Link to={name: 'web', params: {index: 0}}>Web</Link>
  tree = component.toJSON()
  expect(utils.findRouteByNameInRoutes).toBeCalled()
  expect(utils.generateUri).toBeCalledWith route, index: 0
  expect(tree).toMatchSnapshot()

test 'Link component calls router.go() when it was clicked.', ->
  router.go = jest.fn ->
  component = renderer.create do ->
    <Link to="https://github.com">GitHub</Link>
  tree = component.toJSON()
  tree.props.onClick new Event('click')
  expect(router.go).toBeCalledWith('https://github.com')

test 'Link component does not call router.go() when it was clicked with the meta key.', ->
  router.go = jest.fn ->
  component = renderer.create do ->
    <Link to="https://github.com">GitHub</Link>
  tree = component.toJSON()
  event = new Event('click')
  event.metaKey = yes
  tree.props.onClick event
  expect(router.go).not.toBeCalled()
