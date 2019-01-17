require 'babel-polyfill'
nprogress = require 'nprogress'
React = require 'react'
ReactDOM = require 'react-dom'
{RouterView} = require '../'
router = require './router'


nprogress.configure
  showSpinner: no

router.listen 'ChangeStart', (action, toState, fromState, cancel) ->
  nprogress.start()
  if toState.name is 'web'
    cancel()
    router.go name: 'web.home',
      replace: yes
router.listen 'ChangeSuccess', -> nprogress.done()
router.listen 'ChangeError', -> nprogress.done()
router.start()

ReactDOM.render do ->
  <RouterView>
    <p className="text-center text-muted h3" style={padding: '20px 0'}>
      <i className="fa fa-spinner fa-pulse fa-fw"></i> Loading...
    </p>
  </RouterView>
, document.getElementById 'root'
