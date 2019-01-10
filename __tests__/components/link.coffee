history = require 'history'
React = require 'react'
renderer = require 'react-test-renderer'
core = require '../../lib/core'
Route = require '../../lib/route'
utils = require '../../lib/utils'
router = require '../../'


jest.mock '../../lib/core'
jest.mock '../../lib/utils'

beforeEach ->
  core.findRouteByName.mockClear()
  utils.generateUri.mockClear()
  router.go.mockClear()

test 'Link component render.', ->
  component = renderer.create do ->
    <router.Link to="https://github.com">GitHub</router.Link>
  tree = component.toJSON()
  expect(tree).toMatchSnapshot()

test 'Link component render with object props.', ->
  route = new Route
    name: 'web'
    uri: '/web?index'
  core.findRouteByName = jest.fn -> route
  utils.generateUri = jest.fn -> '/web?index=0'
  component = renderer.create do ->
    <router.Link to={name: 'web', params: {index: 0}}>Web</router.Link>
  tree = component.toJSON()
  expect(core.findRouteByName).toBeCalledWith 'web', []
  expect(utils.generateUri).toBeCalledWith route, index: 0
  expect(tree).toMatchSnapshot()

test 'Link component calls router.go() when it was clicked.', ->
  component = renderer.create do ->
    <router.Link to="https://github.com">GitHub</router.Link>
  tree = component.toJSON()
  tree.props.onClick new Event('click')
  expect(router.go).toBeCalledWith('https://github.com')

test 'Link component does not call router.go() when it was clicked with the meta key.', ->
  component = renderer.create do ->
    <router.Link to="https://github.com">GitHub</router.Link>
  tree = component.toJSON()
  event = new Event('click')
  event.metaKey = yes
  tree.props.onClick event
  expect(router.go).not.toBeCalled()
