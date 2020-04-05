const history = require('history');
const React = require('react');
const Route = require('../lib/route');
const utils = require('../lib/utils');

const generateFakeRoute = () => {
  return new Route({
    name: 'web',
    uri: '/users/{userId:[\\w-]{20}}/projects?index?sort',
    resolve: {
      user: ({userId}) => Promise.resolve({id: userId, name: 'User'}),
      projects: () => Promise.resolve([{id: 'AWgrmJp1SjjuUM2bzZXM', title: 'Project'}])
    },
    component: () => <div/>
  });
};

test('Generate a route with the parent.', () => {
  const parent = new Route({
    name: 'web',
    uri: '/users/{userId:[\\w-]{20}}/projects?index?sort',
    resolve: {id: () => 'id'},
    onEnter: () => {},
    component: () => {}
  });
  const child = new Route({
    name: 'web.project',
    uri: '/users/{userId:[\\w-]{20}}/projects/{projectId:[\\w-]{20}}',
    resolve: {id: () => 'id'},
    onEnter: () => {},
    component: () => {},
    parent
  });
  expect(parent).toMatchSnapshot();
  expect(child).toMatchSnapshot();
});

test('Get an error on generating a route with a resolve key called "key".', () => {
  const func = () => {
    return new Route({
      name: 'web',
      uri: '/',
      resolve: {key: () => null}
    });
  };

  expect(func).toThrow(Error);
});
test('Get an error on generating a route with a resolve key called "params".', () => {
  const func = () => {
    return new Route({
      name: 'web',
      uri: '/',
      resolve: {params: () => null}
    });
  };

  expect(func).toThrow(Error);
});

test('Find the route by the name.', () => {
  const routes = [
    new Route({name: 'web', uri: '/'})
  ];
  const route = utils.findRouteByNameInRoutes('web', routes);
  expect(route).toMatchSnapshot();
});

test('Get an error on finding the route by the name.', () => {
  const routes = [
    new Route({name: 'web', uri: '/'})
  ];
  const func = () => utils.findRouteByNameInRoutes('not-found', routes);
  expect(func).toThrow(Error);
});

test('Generate the URI of the route with params', () => {
  const fakeRoute = generateFakeRoute();
  const uri = fakeRoute.generateUri({
    userId: 'AWgrmJp1SjjuUM2bzZXM',
    index: 0,
    sort: 'asc'
  });
  expect(uri).toMatchSnapshot();
});

test('Parse params from the location.', () => {
  const fakeRoute = generateFakeRoute();
  const fakeHistory = history.createMemoryHistory({
    initialEntries: ['/users/AWgrmJp1SjjuUM2bzZXM/projects?index=0&sort=asc']
  });
  const params = utils.parseRouteParams(fakeHistory.location, fakeRoute);
  expect(params).toMatchSnapshot();
});

test('Fetch resolve data.', () => {
  const fakeRoute = generateFakeRoute();
  const fakeHistory = history.createMemoryHistory({
    initialEntries: ['/users/AWgrmJp1SjjuUM2bzZXM/projects?index=0&sort=asc']
  });
  const params = utils.parseRouteParams(fakeHistory.location, fakeRoute);
  utils.fetchResolveData(fakeRoute, params, {}, fakeHistory)
    .then(result => expect(result).toMatchSnapshot());
});

test('Fetch resolve data with reusable resolve data.', () => {
  const fakeRoute = generateFakeRoute();
  const fakeHistory = history.createMemoryHistory({
    initialEntries: ['/users/AWgrmJp1SjjuUM2bzZXM/projects?index=0&sort=asc']
  });
  const params = utils.parseRouteParams(fakeHistory.location, fakeRoute);
  utils.fetchResolveData(fakeRoute, params, {web: {user: 'old user'}}, fakeHistory)
    .then(result => expect(result).toMatchSnapshot());
});

test('Fetch resolve data with error.', () => {
  const fakeRoute = new Route({
    name: 'web',
    uri: '/users/{userId:[\\w-]{20}}/projects?index?sort',
    resolve: {
      user: () => Promise.reject(new Error()),
      projects: () => Promise.resolve([
        {id: 'AWgrmJp1SjjuUM2bzZXM', title: 'Project'}
      ])
    },
    component: () => <div/>
  });
  const fakeHistory = history.createMemoryHistory({
    initialEntries: ['/users/AWgrmJp1SjjuUM2bzZXM/projects?index=0&sort=asc']
  });
  const params = utils.parseRouteParams(fakeHistory.location, fakeRoute);
  const resolve = jest.fn(() => {});
  const reject = jest.fn(() => {});
  utils.fetchResolveData(fakeRoute, params, {}, fakeHistory)
    .then(resolve)
    .catch(reject)
    .finally(() => {
      expect(resolve).not.toBeCalled();
      expect(reject).toBeCalled();
    });
});

test('Flatten resolve data.', () => {
  const result = utils.flattenResolveData({
    web: {user: {id: 'id', name: 'name'}}
  });
  expect(result).toMatchSnapshot();
});

test('Fetch resolve data with lazy loading.', () => {
  const parentRoute = new Route({
    name: 'web',
    uri: '/',
    loadComponent: () => Promise.resolve({default: <div>parent</div>})
  });
  const fakeRoute = new Route({
    name: 'web.user',
    uri: 'users/{userId:[\\w-]{20}}/projects?index?sort',
    loadComponent: () => Promise.resolve({default: <div>child</div>}),
    parent: parentRoute
  });
  const fakeHistory = history.createMemoryHistory({
    initialEntries: ['/users/AWgrmJp1SjjuUM2bzZXM/projects?index=0&sort=asc']
  });

  const params = utils.parseRouteParams(fakeHistory.location, fakeRoute);
  const resolve = jest.fn(() => {
    expect(parentRoute.component).toMatchSnapshot();
    expect(fakeRoute.component).toMatchSnapshot();
  });
  const reject = jest.fn(() => {});
  utils.fetchResolveData(fakeRoute, params, {}, fakeHistory)
    .then(resolve)
    .catch(reject)
    .finally(() => {
      expect(resolve).toBeCalled();
      expect(reject).not.toBeCalled();
    });
});
