const React = require('react');
const Route = require('../lib/route');

test('Initial Route without a parent.', () => {
  const route = new Route({
    name: 'web',
    uri: '/users/{userId:[\\w-]{20}}/projects?index',
    resolve: {
      user: ({userId}) => ({id: userId, name: 'User'}),
      projects: () => ([
        {id: 'AWgrmJp1SjjuUM2bzZXM', title: 'Project'}
      ])
    },
    component: () => <div/>
  });
  expect(route).toMatchSnapshot();
});

test('Initial Route with a parent.', () => {
  const parent = new Route({name: 'web', uri: '/'});
  const route = new Route({
    name: 'web.dashboard',
    uri: 'dashboard',
    parent
  });
  expect(route).toMatchSnapshot();
});
