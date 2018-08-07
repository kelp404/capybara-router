React = require 'react'
core = require '../core'

module.exports = class RouterView extends React.Component
  constructor: (props) ->
    super props
    @state =
      component: null
      props: null
  componentWillMount: ->
    core.registerRouterView @
  dispatch: (args = {}) ->
    @setState
      component: args.route.component
      props: args.props

  render: ->
    if @state.component
      React.createElement @state.component, @state.props
    else
      <div>{@props.children}</div>
