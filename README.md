# capybara-router
[![npm version](https://badge.fury.io/js/capybara-router.svg)](https://www.npmjs.com/package/capybara-router)
[![Coverage Status](https://coveralls.io/repos/github/kelp404/capybara-router/badge.svg)](https://coveralls.io/github/kelp404/capybara-router)
[![CircleCI](https://circleci.com/gh/kelp404/capybara-router.svg?style=svg)](https://circleci.com/gh/kelp404/capybara-router)
  
This is a react router without flux and redux.  
We just want a simple way to build a Single Page Application.

<img src="_capybara.jpg" height="400px"/>

## Installation
```bash
npm install capybara-router --save
```


## Live demo
[https://kelp404.github.io/capybara-router/](https://kelp404.github.io/capybara-router/)


## Example
[/example](/example)
```js
const React = require('react');
const ReactDOM = require('react-dom');
const {Router, RouterView} = require('capybara-router');
const history = require('history');
const axios = require('axios');


const ErrorPage = props => {
  return <h2 className="text-center">{`${this.props.error}`}</h2>;
};
const Home = props => {
  return <h2>Home</h2>;
};

const router = new Router({
  history: history.createBrowserHistory(),
  routes: [
    {
      name: 'web',
      uri: '/',
      onEnter: (props) => {
        document.title = 'Home';
      },
      resolve: {
        data: (params) => {
          return axios({
            method: 'get',
            url: `/data/${params.id}.json`
          }).then((response) => {
            return response.data;
          });
        }
      },
      component: Home
    }
  ],
  errorComponent: ErrorPage
});
router.start();

const element = (
  <RouterView>
    <p className="text-center text-muted h3" style={padding: '20px 0'}>
      <i className="fa fa-spinner fa-pulse fa-fw"></i> Loading...
    </p>
  </RouterView>
);
ReactDOM.render(
  element,
  document.getElementById('root')
);
```


## Commands
+ `npm start`  
  Run the debug server on localhost.
+ `npm run build`  
  Build the source code, test scripts and the example app.
+ `npm test`  
  Build test scripts and run tests.


## Router
### constructor
```coffee
constructor: (args = {}) ->
  ###
  Setup the router.
  Note: Don't use 'key', 'params' as the key of the resolve.
  @param args {Object}
    history {history}
    routes {Array<routeConfig>}
      [
        name {string}
        uri {string}
        isAbstract {bool}
        onEnter {function}
        resolve {Object}
          "resourceName": {Promise<response.data>}
        component {React.Component}
      ]
    errorComponent {React.Component}
  @properties
    history {history}
    historyUnsubscription {function}
    routes {Array<Route>}
    errorComponent: {React.Component|null}
    views {Array<Object>}
      name: {string}
      routerView: {RouterView}
    eventHandlers {Object}
      changeStart: {Array<{id: {string}, func: function(action, toState, fromState, cancel)}>}
      changeSuccess: {Array<{id: {string}, func: function(action, toState, fromState)}>}
      changeError: {Array<{id: {string}, func: function(error)}>}
    currentRoute {Route}
    currentParams {Object}
    currentResolveData {Object}

    isSkipNextHistoryChange {bool}
    isReloadNextHistoryChange {bool}
    promise {Promise<['router-promise', history.action, previousRoute, previousParams, nextRoute, nextParams, props]>}
  ###
```

### start()
```coffee
router.start = ->
  ###
  Start dispatch routes.
  ###
```

### reload()
```coffee
router.reload = ->
  ###
  Reload root router view.
  ###
```

### go()
```coffee
router.go = (target, options = {}) ->
  ###
  Push/Replace a state to the history.
  If the new URI and the old one are same, it will reload the current page.
  @param target {string|Object}
    1. {string}:
      The target is the URI.
    2. {Object}:
      name {string}
      params {Object}
  @param options {Object}
    replace {bool}
    reload {bool}
  ###
```

### listen()
```coffee
router.listen = (event, func) ->
  ###
  @param event {string}  "ChangeStart|ChangeSuccess|ChangeError"
  @param func {function}
    ChangeStart: (action, toState, fromState, cancel) ->
    ChangeSuccess: (action, toState, fromState) ->
    ChangeError: (error) ->
  @returns {function}  Eval this function to stop listen.
  ###
```


## Components
### RouterView
The router will replace the loading view with the page component.
```coffee
render: ->
  <RouterView>
    <p className="text-center text-muted h3" style={padding: '20px 0'}>
      <i className="fa fa-spinner fa-pulse fa-fw"></i> Loading...
    </p>
  </RouterView>
```

### Link
Render a SPA link element.
```coffee
render: ->
  <Link to={"/users/#{user.id}"}>{user.id}</Link>
```
```coffee
render: ->
  <Link to={name: 'route-name', params: {paramKey: 'value'}}></Link>
```
