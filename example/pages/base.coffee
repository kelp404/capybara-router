React = require 'react'
{RouterView} = require '../../'


module.exports = class Base extends React.Component
  render: ->
    <div className="container">
      <div className="row">
        <div className="col-sm-12">
          <RouterView/>
        </div>
      </div>
    </div>
