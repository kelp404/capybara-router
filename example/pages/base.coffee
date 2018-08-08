classNames = require 'classnames'
React = require 'react'
{RouterView, Link, listen} = require '../../'


module.exports = class Base extends React.Component
  constructor: (props) ->
    super props
    @state =
      currentRouteName: ''
    @listens = [
      listen 'ChangeSuccess', (action, toState, fromState) =>
        @setState
          currentRouteName: toState.name
    ]
  componentWillUnmount: ->
    x() for x in @listens
  render: ->
    classTable =
      homeLink: classNames active: @state.currentRouteName is 'web.home'
      usersLink: classNames active: @state.currentRouteName is 'web.users'

    <div>
      <nav className="navbar navbar-default">
        <div className="container">
          <div className="navbar-header">
            <button type="button" className="navbar-toggle collapsed"
                    data-toggle="collapse" data-target="#bs-example-navbar-collapse-1">
              <span className="sr-only">Toggle navigation</span>
              <span className="icon-bar"></span>
              <span className="icon-bar"></span>
              <span className="icon-bar"></span>
            </button>
            <Link className="navbar-brand" href="/re-router/">re~router</Link>
          </div>

          <div className="collapse navbar-collapse" id="bs-example-navbar-collapse-1">
            <ul className="nav navbar-nav">
              <li className={classTable.homeLink}><Link href="/re-router/">Home</Link></li>
              <li className={classTable.usersLink}><Link href="/re-router/users">Users</Link></li>
              <li><Link href="/re-router/404">404</Link></li>
            </ul>
          </div>
        </div>
      </nav>

      <div className="container">
        <div className="row">
          <div className="col-sm-12">
            <RouterView/>
          </div>
        </div>
      </div>
    </div>
