require 'es6-promise/auto'
axios = require 'axios'
history = require 'history'
React = require 'react'
ReactDOM = require 'react-dom'
reRouter = require '../'
Base = require './pages/base'
Home = require './pages/home'
NotFound = require './pages/not-found'
Users = require './pages/users'


reRouter.setup
  history: history.createBrowserHistory()
  routes: [
    {
      name: 'web'
      uri: '/re-router'
      component: Base
    }
    {
      name: 'web.home'
      uri: '/'
      component: Home
    }
    {
      name: 'web.users'
      uri: '/users'
      resolve:
        users: ->
          axios
            method: 'get'
            url: '/re-router/example/data/users.json'
          .then (response) ->
            response.data
      component: Users
    }
    {
      name: 'not-found'
      uri: '.*'
      component: NotFound
    }
  ]

ReactDOM.render do ->
  <reRouter.RouterView>
    <p className="text-center text-muted h3" style={padding: '20px 0'}>
      <i className="fa fa-spinner fa-pulse fa-fw"></i> Loading...
    </p>
  </reRouter.RouterView>
, document.getElementById 'root'
