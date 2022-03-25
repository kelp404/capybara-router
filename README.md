# capybara-router
[![npm version](https://badge.fury.io/js/capybara-router.svg)](https://www.npmjs.com/package/capybara-router)
[![Coverage Status](https://coveralls.io/repos/github/kelp404/capybara-router/badge.svg)](https://coveralls.io/github/kelp404/capybara-router)
[![Actions Status](https://github.com/kelp404/capybara-router/workflows/test/badge.svg)](https://github.com/kelp404/capybara-router/actions)
  
This is a react router without flux and redux.  
We just want a simple way to build a Single Page Application.  
Define rules that include the component and how to fetch data of the each page in a router.

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
  return <h2 className="text-center">{`${props.error}`}</h2>;
};
const Home = props => {
  console.log(props.data);
  return <h2>Home</h2>;
};

const router = new Router({
  history: history.createBrowserHistory(),
  routes: [
    {
      name: 'web',
      uri: '/',
      onEnter: props => {
        document.title = 'Home';
      },
      resolve: {
        data: params => axios({
          method: 'get',
          url: `/data/${params.id}.json`
        }).then(response => response.data)
      },
      component: Home
    }
  ],
  errorComponent: ErrorPage
});

const element = (
  <RouterView>
    <div className="text-center text-muted py-5">
      <div className="spinner-border">
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  </RouterView>
);
ReactDOM.render(element, document.getElementById('root'));
```


## Commands
+ `npm start`  
  Run the debug server on localhost:8000/capybara-router.
+ `npm run build`  
  Build the example app.
+ `npm test`  
  Build test scripts and run tests.


## Router
### constructor
Generate a instance of Router with your config.  
Just allow single instance in your application.
```js
const {Router} = require('capybara-router');
const axios = require('axios');
const history = require('history');

const router = new Router({
  history: history.createBrowserHistory(),
  routes: [
    {
      name: 'web',
      uri: '/',
      isAbstract: false,
      onEnter: props => {
        document.title = 'Web';
      },
      resolve: {
        data: axios({
          method: 'get',
          url: '/data.json'
        }).then(response => response.data)
      },
      component: props => (<p>{JSON.stringify(props.data)}</p>)
    }
  ],
  errorComponent: props => (<h2>Error</h2>)
});
```
#### Parameter `options.history`
Type: `Object`  
Required: `required`  
Please provide [history](https://github.com/ReactTraining/history) object.

#### Parameter `options.errorComponent`
Type: `Object`  
Required: `required`  
The React component for the error page.

#### Parameter `options.routes`
Type: `Array<Object>`  
Required: `required`

##### Parameter `options.routes[].name`
Type: `String`  
Required: `required`  
The name of this route.  
Use `.` to make the child route.  
Such as `web`, `web.project`, `web.project.members`.

##### Parameter `options.routes[].uri`
Type: `String`  
Required: `required`  
The URI of this route.  
It support the regular expression.  
`/users/{userId:[\\w-]{20}}` will parse the user id from URL.  
`.*` will match all URL. Use it to define the 404 page.  

##### Parameter `options.routes[].isAbstract`
Type: `Boolean`  
Default: `false`  
The URI of this route.  
An abstract state can have child states but cannot get activated itself.
An 'abstract' state is simply a state that can't be transitioned to.  

##### Parameter `options.routes[].onEnter`
Type: `Function` `(props) => {}`  
Required: `optional`  
capybara-route will call this function before the component.  

##### Parameter `options.routes[].resolve`
Type: `Object`  
Required: `optional`  
Define how to fetch data.

##### Parameter `options.routes[].component`
Type: `Object`  
Required: `optional`  
The React component.

##### Parameter `options.routes[].loadComponent`
Type: `Function`  
Required: `optional`  
The lazy loading function.  
Run the lazy loading function when the `.component` is null.
```js
{
  name: 'web',
  uri: '/path',
  loadComponent: () => import(
    /* webpackChunkName: "chunk-name" */
    './path/component'
  )
}
```

---

### reload()
Reload the root router view.

---

### go(target, options = {})
Push a state to the history or Replace a state of the history.  
If the new URI and the old one are same, it will reload the current page.

#### Parameter `target`
Type: `String|Object`  
Required: `required`  
The destination.  
`String`: The target is the URI.  
`Object`:
```
{
  name: {String},  // The route name.
  params: {Object} // The parameter of the route.
}
``` 

#### Parameter `options`
Type: `Object`  
Required: `optional`  

#### Parameter `options.replace`
Type: `Boolean`  
Default: `false`    
Replace the current state with the new one.

#### Parameter `options.reload`
Type: `Boolean`  
Default: `false`    
Reload the root router view.

---

### listen(event, callback)
Listen the change event.

#### Parameter `event`
Type: `String`  
The event type.  
`ChangeStart`, `ChangeSuccess`, `ChangeError`

#### Parameter `callback`
Type: `Function`  
The callback function.  
`ChangeStart`: (action, toState, fromState, next) => {}  
`ChangeSuccess`: (action, toState, fromState) => {}  
`ChangeError`: (error) => {}

#### Return
Type: `Function`  
Call this function to stop the listen.

---

### renderError(error)
Render the error component.

#### Parameter `error`
Type: `Object`  
The Error object.

---

### getCurrentRoute()
Get the current route via router.history and router.routes.

#### Return
Type: `Route`

---

### findRouteByName(name)
Find the route by the route name.

#### Parameter `name`
Type: `String`  
The route name.

#### Return
Type: `Route`


## getRouter()
When the instance of Router was created.  
This function returns the instance.
```js
const {getRouter} = require('capybara-router');
// new Router({ ... });
const router = getRouter();
```


## Components
### RouterView
The router will replace the loading view with the page component.
```js
const {RouterView} = require('capybara-router');
```
```js
<RouterView>
  <p className="text-center text-muted h3" style={{padding: '20px 0'}}>
    <i className="fa fa-spinner fa-pulse fa-fw"></i> Loading...
  </p>
</RouterView>
```

### Link
Render a SPA link element.
```js
const {Link} = require('capybara-router');
```
```js
<Link to={`/users/${user.id}`}>{user.id}</Link>
<Link to={{name: 'route-name', params: {paramKey: 'value'}}}>link</Link>
```



## Which sites are using capybara-router?
- **Meetpet** [https://meetpet.org/](https://meetpet.org/)
