require 'es6-promise/auto'
axios = require 'axios'
history = require 'history'
nprogress = require 'nprogress'
React = require 'react'
ReactDOM = require 'react-dom'
capybaraRouter = require '../'
Base = require './pages/base'
ErrorPage = require './pages/error-page'
Home = require './pages/home'
NotFound = require './pages/not-found'
User = require './pages/user'
Users = require './pages/users'


nprogress.configure
  showSpinner: no

capybaraRouter.listen 'ChangeStart', -> nprogress.start()
capybaraRouter.listen 'ChangeSuccess', -> nprogress.done()
capybaraRouter.listen 'ChangeError', -> nprogress.done()

capybaraRouter.setup
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
      onEnter: ->
        document.title = 'Home - capybara-router'
      component: Home
    }
    {
      name: 'web.users'
      uri: '/users'
      onEnter: ->
        document.title = 'Users - capybara-router'
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
      onEnter: (props) ->
        document.title = "#{props.user.name} - Users - capybara-router"
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
  <capybaraRouter.RouterView>
    <p className="text-center text-muted h3" style={padding: '20px 0'}>
      <i className="fa fa-spinner fa-pulse fa-fw"></i> Loading...
    </p>
  </capybaraRouter.RouterView>
, document.getElementById 'root'
