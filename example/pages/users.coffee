PropTypes = require 'prop-types'
React = require 'react'


module.exports = class Users extends React.Component
  @propTypes =
    users: PropTypes.object.isRequired

  render: ->
    <h2>Users</h2>
