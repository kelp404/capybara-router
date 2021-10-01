const axios = require('axios');
const history = require('history');
const {Router} = require('../');

module.exports = new Router({
  history: history.createBrowserHistory(),
  routes: [
    {
      name: 'web',
      uri: '/capybara-router',
      component: require('./pages/base'),
    },
    {
      name: 'web.home',
      uri: '/',
      onEnter: () => {
        document.title = 'Home - capybara-router';
      },
      component: require('./pages/home'),
    },
    {
      name: 'web.users',
      uri: '/users',
      onEnter: () => {
        document.title = 'Users - capybara-router';
      },
      resolve: {
        users: () => axios({
          method: 'get',
          url: '/capybara-router/example/data/users.json',
        }).then(response => response.data),
      },
      component: require('./pages/users'),
    },
    {
      name: 'web.user',
      uri: '/users/{userId:[\\w-]{20}}',
      onEnter: ({user}) => {
        document.title = `${user.name} - Users - capybara-router`;
      },
      resolve: {
        user: params => axios({
          method: 'get',
          url: `/capybara-router/example/data/users/${params.userId}.json`,
        }).then(response => response.data),
      },
      component: require('./pages/user'),
    },
    {
      name: 'web.test-error',
      uri: '/error',
      resolve: {
        error: () => axios({
          method: 'get',
          url: 'https://github.com/404',
        }),
      },
      component: require('./pages/home'),
    },
    {
      name: 'not-found',
      uri: '.*',
      component: require('./pages/not-found'),
    },
  ],
  errorComponent: require('./pages/error-page'),
});
