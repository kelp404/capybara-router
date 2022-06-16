const React = require('react');
const Route = require('../lib/route');

test('Initial Route without a parent.', () => {
  const route = new Route({
    name: 'web',
    uri: '/users/{userId:[\\w-]{20}}/projects?index',
    resolve: {
      user: ({userId}) => ({id: userId, name: 'User'}),
      projects: () => ([
        {id: 'AWgrmJp1SjjuUM2bzZXM', title: 'Project'},
      ]),
    },
    component: () => <div/>,
  });
  expect(route).toMatchSnapshot();
});

test('Initial Route with a parent.', () => {
  const parent = new Route({name: 'web', uri: '/'});
  const route = new Route({
    name: 'web.dashboard',
    uri: 'dashboard',
    parent,
  });
  expect(route).toMatchSnapshot();
});

test('Generate a route with the parent.', () => {
  const parent = new Route({
    name: 'web',
    uri: '/users/{userId:[\\w-]{20}}/projects?index?sort',
    resolve: {id: () => 'id'},
    onEnter() {},
    component() {},
  });
  const child = new Route({
    name: 'web.project',
    uri: '/users/{userId:[\\w-]{20}}/projects/{projectId:[\\w-]{20}}',
    resolve: {id: () => 'id'},
    onEnter() {},
    component() {},
    parent,
  });
  expect(parent).toMatchSnapshot();
  expect(child).toMatchSnapshot();
});

test('Get an error on generating a route with a resolve key called "key".', () => {
  const func = () => new Route({
    name: 'web',
    uri: '/',
    resolve: {key: () => null},
  });

  expect(func).toThrow(Error);
});
test('Get an error on generating a route with a resolve key called "params".', () => {
  const func = () => new Route({
    name: 'web',
    uri: '/',
    resolve: {params: () => null},
  });

  expect(func).toThrow(Error);
});

test('Generate the URI of the route with params', () => {
  const fakeRoute = new Route({
    name: 'web',
    uri: '/users/{userId:[\\w-]{20}}/projects?index?sort?nullValue?empty?array?undefinedValue',
    resolve: {
      user: ({userId}) => Promise.resolve({id: userId, name: 'User'}),
      projects: () => Promise.resolve([{id: 'AWgrmJp1SjjuUM2bzZXM', title: 'Project'}]),
    },
    component: () => <div/>,
  });
  const uri = fakeRoute.generateUri({
    userId: 'AWgrmJp1SjjuUM2bzZXM',
    index: 0,
    sort: 'asc',
    nullValue: null,
    empty: '',
    undefinedValue: undefined,
    array: ['a', 'b'],
  });
  expect(uri).toMatchSnapshot();
});
