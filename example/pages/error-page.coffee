React = require 'react'


module.exports = class ErrorPage extends React.Component
  render: ->
    <h2 className="text-center">{"#{@props.error}"}</h2>
