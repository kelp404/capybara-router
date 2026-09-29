const React = require('react');
const renderer = require('react-test-renderer');
const history = require('history');
const Router = require('../lib/router');
const RouterView = require('../lib/components/router-view');

let router;
beforeEach(() => {
  global.location = {
    hash: '',
    host: 'localhost:8000',
    hostname: 'localhost',
    href: 'http://localhost:8000/base',
    origin: 'http://localhost:8000',
    pathname: '/base',
    port: '8000',
    protocol: 'http:',
    search: '',
  };
  router = new Router({
    history: history.createMemoryHistory({initialEntries: ['/base']}),
    routes: [
      {
        // This component renders no nested RouterView, so views[1] stays
        // unregistered. A concurrent root reaches the same state by deferring
        // the nested render past the navigation.
        name: 'base',
        uri: '/base',
        component: () => <div>Base</div>,
      },
      {
        name: 'base.child',
        uri: '/child',
        component: () => <div>Child</div>,
      },
    ],
    errorComponent: () => <div>Error</div>,
  });
});
afterEach(() => jest.restoreAllMocks());

test('Dispatch a route whose router view is not registered yet.', () => {
  const onChangeError = jest.fn(() => {});
  const onChangeSuccess = jest.fn(() => {});
  router.listen('ChangeError', onChangeError);
  router.listen('ChangeSuccess', onChangeSuccess);
  renderer.create(<RouterView>Loading</RouterView>);

  return router.promise
    .then(() => {
      // Drop the events of the initial navigation to "base".
      onChangeSuccess.mockClear();
      router.go({name: 'base.child'}, {replace: true});
      return router.promise;
    })
    .then(() => {
      expect(onChangeError).not.toHaveBeenCalled();
      expect(router.views.length).toBe(1);
      expect(onChangeSuccess).not.toHaveBeenCalled();
    });
});

test('Register the router view after the route was dispatched.', () => {
  const onChangeError = jest.fn(() => {});
  const onChangeSuccess = jest.fn(() => {});
  router.listen('ChangeError', onChangeError);
  router.listen('ChangeSuccess', onChangeSuccess);
  renderer.create(<RouterView>Loading</RouterView>);

  return router.promise
    .then(() => {
      // Drop the events of the initial navigation to "base".
      onChangeSuccess.mockClear();
      router.go({name: 'base.child'}, {replace: true});
      return router.promise;
    })
    .then(() => {
      // The nested view registers late and picks the pending route up.
      const nested = renderer.create(<RouterView>Nested loading</RouterView>);
      return router.promise.then(() => {
        expect(onChangeError).not.toHaveBeenCalled();
        expect(onChangeSuccess).toHaveBeenCalled();
        expect(router.views.length).toBe(2);
        expect(router.views[1].name).toBe('base.child');
        expect(nested.toJSON()).toMatchSnapshot();
      });
    });
});
