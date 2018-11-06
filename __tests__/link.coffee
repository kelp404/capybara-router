React = require 'react'
renderer = require 'react-test-renderer'
router = require '../'


test 'Link component render', ->
  component = renderer.create do ->
    <router.Link href="https://github.com">GitHub</router.Link>
  tree = component.toJSON()
  expect(tree).toMatchSnapshot()
