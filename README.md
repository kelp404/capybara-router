# capybara-router
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
const router = require('capybara-router');
const history = require('history');
const axios = require('axios');
const Home = require('./pages/home');
const ErrorPage = require('./pages/error-page');


router.setup({
  history: history.createBrowserHistory(),
  routes: [
    {
      name: 'web',
      uri: '/',
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
```


## API
### setup()
```coffee
setup = (args = {}) ->
  ###
  @param args {object}
    history {history}
    routes {list<route>}
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
    href {string}
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
