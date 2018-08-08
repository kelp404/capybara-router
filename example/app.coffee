require 'es6-promise/auto'
axios = require 'axios'
history = require 'history'
nprogress = require 'nprogress'
React = require 'react'
ReactDOM = require 'react-dom'
reRouter = require '../'
Base = require './pages/base'
ErrorPage = require './pages/error-page'
Home = require './pages/home'
NotFound = require './pages/not-found'
User = require './pages/user'
Users = require './pages/users'


nprogress.configure
  showSpinner: no

reRouter.listen 'ChangeStart', -> nprogress.start()
reRouter.listen 'ChangeSuccess', -> nprogress.done()
reRouter.listen 'ChangeError', -> nprogress.done()

reRouter.setup
  history: history.createBrowserHistory()
  routes: [
    {
      name: 'web'
      uri: '/capybara-router'
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
            url: '/capybara-router/example/data/users.json'
          .then (response) ->
            response.data
      component: Users
    }
    {
      name: 'web.user'
      uri: '/users/{userId:[\\w-]{20}}'
      resolve:
        user: (params) ->
          axios
            method: 'get'
            url: "/capybara-router/example/data/users/#{params.userId}.json"
          .then (response) ->
            response.data
      component: User
    }
    {
      name: 'web.test-error'
      uri: '/error'
      resolve:
        error: ->
          axios
            method: 'get'
            url: '/capybara-router/not-exist-resource'
    }
    {
      name: 'not-found'
      uri: '.*'
      component: NotFound
    }
  ]
  errorComponent: ErrorPage

ReactDOM.render do ->
  <reRouter.RouterView>
    <p className="text-center text-muted h3" style={padding: '20px 0'}>
      <i className="fa fa-spinner fa-pulse fa-fw"></i> Loading...
    </p>
  </reRouter.RouterView>
, document.getElementById 'root'
