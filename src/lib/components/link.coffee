React = require 'react'
core = require '../core'


module.exports = class Link extends React.Component
  onClick: (event) =>
    return if event.metaKey
    event.preventDefault()
    if @props.href
      core.go
       href: @props.href

  render: ->
    <a onClick={@onClick} {...@props}/>
