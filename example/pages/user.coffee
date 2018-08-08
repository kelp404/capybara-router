PropTypes = require 'prop-types'
React = require 'react'


module.exports = class Users extends React.Component
  @propTypes =
    user: PropTypes.object.isRequired

  render: ->
    <div>
      <div className="form-group">
        <label className="control-label">ID</label>
        <p className="form-control-static">{@props.user.id}</p>
      </div>
      <div className="form-group">
        <label className="control-label">Name</label>
        <p className="form-control-static">{@props.user.name}</p>
      </div>
      <div className="form-group">
        <label className="control-label">Email</label>
        <p className="form-control-static">{@props.user.email}</p>
      </div>
    </div>
