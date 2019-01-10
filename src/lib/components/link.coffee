React = require 'react'
PropTypes = require 'prop-types'
core = require '../core'
utils = require '../utils'


module.exports = class Link extends React.Component
  @propTypes =
    to: PropTypes.any.isRequired

  onClick: (event) =>
    return if event.metaKey
    event.preventDefault()
    core.go @props.to

  render: ->
    props = {}
    for key, value of @props
      props[key] = value
    delete props.to
    if typeof(@props.to) is 'object'
      route = utils.findRouteByNameInRoutes @props.to.name, core.routes
      props.href = utils.generateUri route, @props.to.params
    else
      props.href = @props.to
    <a onClick={@onClick} {...props}/>
