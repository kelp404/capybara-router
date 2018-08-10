# capybara-router
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
const router = require('capybara-router');
const history = require('history');
const axios = require('axios');
const ErrorPage = require('./pages/error-page');


class Home extends React.Component {
  render() {
    return <h2>Home</h2>;
  }
}

router.setup({
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
          axios({
            method: 'get',
            url: "/data/#{params.id}.json"
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

const element = (
  <router.RouterView>
    <p className="text-center text-muted h3" style={padding: '20px 0'}>
      <i className="fa fa-spinner fa-pulse fa-fw"></i> Loading...
    </p>
  </router.RouterView>
);
ReactDOM.render(
  element,
  document.getElementById('root')
);
```


## API
### setup()
```coffee
setup = (args = {}) ->
  ###
  @param args {object}
    history {history}
    routes {list<route>}
      [
        name {string}
        uri {string}
        isAbstract {bool}
        onEnter {function}
        resolve {object}
          "resourceName": {Promise<response.data>}
        component {React.Component}
      ]
    errorComponent {React.Component}
  ###
```

### reload()
```coffee
reload = ->
  ###
  Reload root router view.
  ###
```

### go()
```coffee
go = (args = {}) ->
  ###
  @param args {object}
    1. use href:
      href {string}
    2. use route name with params:
      name {string}
      params {object}
  ###
```

### listen()
```coffee
listen = (event, func) ->
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
  <Link href={"/users/#{user.id}"}>{user.id}</Link>
```
