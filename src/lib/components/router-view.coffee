React = require 'react'
singleInstance = require '../single-instance'


module.exports = class RouterView extends React.PureComponent
  constructor: (props) ->
    super props
    @state =
      component: null
      props: null
    singleInstance.getRouter().registerRouterView @

  dispatch: (args = {}) ->
    @setState
      component: args.route.component
      props: args.props

  render: ->
    if @state.component
      React.createElement @state.component, @state.props
    else
      <div>{@props.children}</div>
