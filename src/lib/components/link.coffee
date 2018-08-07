React = require 'react'
core = require '../core'


module.exports = class Link extends React.Component
  onClick: (event) =>
    event.preventDefault()
    if @props.href
      core.go
       href: @props.href

  render: ->
    <a onClick={@onClick} {...@props}/>
