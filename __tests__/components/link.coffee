React = require 'react'
renderer = require 'react-test-renderer'
router = require '../../'


jest.mock '../../lib/core'

beforeEach ->
  router.go.mockClear()

test 'Link component render.', ->
  component = renderer.create do ->
    <router.Link href="https://github.com">GitHub</router.Link>
  tree = component.toJSON()
  expect(tree).toMatchSnapshot()

test 'Link component calls router.go() when it was clicked.', ->
  component = renderer.create do ->
    <router.Link href="https://github.com">GitHub</router.Link>
  tree = component.toJSON()
  tree.props.onClick new Event('click')
  expect(router.go).toBeCalledWith
    href: 'https://github.com'

test 'Link component didn\'t call router.go() when it was clicked with the meta key.', ->
  component = renderer.create do ->
    <router.Link href="https://github.com">GitHub</router.Link>
  tree = component.toJSON()
  event = new Event('click')
  event.metaKey = yes
  tree.props.onClick event
  expect(router.go).not.toBeCalled()
