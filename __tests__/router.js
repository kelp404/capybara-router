const React = require('react');
const renderer = require('react-test-renderer');
const history = require('history');
const Router = require('../lib/router');
const Route = require('../lib/route');
const errors = require('../lib/errors');
const RouterView = require('../lib/components/router-view');
const historyActions = require('../lib/constants/history-actions');

let router;
beforeEach(() => {
  router = new Router({
    history: history.createMemoryHistory({initialEntries: ['/']}),
    routes: [
      {
        name: 'home',
        uri: '/',
        onEnter: () => {},
        component: () => <div>Home</div>
      },
      {
        name: 'login',
        uri: '/login',
        onEnter: () => {},
        component: () => <div>Login</div>
      },
      {
        name: 'projects',
        uri: '/users/{userId:[\\w-]{20}}/projects?index',
        onEnter: () => {},
        component: () => <div>Projects</div>
      },
      {
        isAbstract: true,
        name: 'settings',
        uri: '/settings',
        component: () => <div>Loading</div>
      },
      {
        name: 'settings.account',
        uri: '',
        component: () => <div>Account</div>
      }
    ],
    errorComponent: () => <div>Error</div>
  });
});
afterEach(() => jest.restoreAllMocks());

test('Going to a page with the URI will push the history state.', () => {
  router.history.push = jest.fn(() => {});
  router.go('/login');
  expect(router.history.push).toBeCalledWith('/login');
});

test('Replace a page with the URI.', () => {
  router.history.replace = jest.fn(() => {});
  router.go('/login', {replace: true});
  expect(router.history.replace).toBeCalledWith('/login');
});

test('Reload a page with the URI.', () => {
  router.reload = jest.fn(() => {});
  router.go('/');
  expect(router.reload).toBeCalled();
});

test('Going to a page with a route name will push the history state.', () => {
  router.history.push = jest.fn(() => {});
  router.go({
    name: 'projects',
    params: {userId: 'AWgrmJp1SjjuUM2bzZXM', index: 0}
  });
  expect(router.history.push).toBeCalledWith(
    '/users/AWgrmJp1SjjuUM2bzZXM/projects?index=0',
    {
      name: 'projects',
      params: {index: 0, userId: 'AWgrmJp1SjjuUM2bzZXM'}
    }
  );
});

test('Replace a page with a route name.', () => {
  router.history.replace = jest.fn(() => {});
  router.go(
    {name: 'projects', params: {userId: 'AWgrmJp1SjjuUM2bzZXM', index: 0}},
    {replace: true}
  );
  expect(router.history.replace).toBeCalledWith(
    '/users/AWgrmJp1SjjuUM2bzZXM/projects?index=0',
    {
      name: 'projects',
      params: {index: 0, userId: 'AWgrmJp1SjjuUM2bzZXM'}
    }
  );
});

test('Reload a page with a route name.', () => {
  router.reload = jest.fn(() => {});
  router.go({name: 'home'});
  expect(router.reload).toBeCalled();
});

test('Get the current route.', () => {
  const route = router.getCurrentRoute();
  expect(route).toMatchSnapshot();
});

test('Find the route by the location.', () => {
  const route = router.findRoute(router.history.location);
  expect(route).toMatchSnapshot();
});

test('Find the router belong a abstract router by the location.', () => {
  const fakeHistory = history.createMemoryHistory({initialEntries: ['/settings']});
  const route = router.findRoute(fakeHistory.location);
  expect(route).toMatchSnapshot();
});

test('Get an error on finding the route by the location.', () => {
  const func = () => {
    const fakeHistory = history.createMemoryHistory({initialEntries: ['/not-found']});
    router.findRoute(fakeHistory.location);
  };

  expect(func).toThrow(Error);
});

test('Get an error when listen with a failed event name.', () => {
  const func = () => router.listen('not-exist', () => {});
  expect(func).toThrow();
});

test('Listen change start events.', () => {
  const onChangeStart = () => {};
  const unsubscribe = router.listen('ChangeStart', onChangeStart);
  expect(router.eventHandlers.changeStart[0].func).toBe(onChangeStart);
  unsubscribe();
  expect(router.eventHandlers.changeStart).toEqual([]);
});

test('Listen change success events.', () => {
  const onChangeSuccess = () => {};
  const unsubscribe = router.listen('ChangeSuccess', onChangeSuccess);
  expect(router.eventHandlers.changeSuccess[0].func).toBe(onChangeSuccess);
  unsubscribe();
  expect(router.eventHandlers.changeSuccess).toEqual([]);
});

test('Listen change error events.', () => {
  const onChangeError = () => {};
  const unsubscribe = router.listen('ChangeError', onChangeError);
  expect(router.eventHandlers.changeError[0].func).toBe(onChangeError);
  unsubscribe();
  expect(router.eventHandlers.changeError).toEqual([]);
});

test('Broadcast a start event.', () => {
  const route = new Route({name: 'web', uri: '/'});
  const onChangeStart = jest.fn((action, toState, fromState, next) => {
    expect(action).toBe('PUSH');
    expect(toState).toMatchSnapshot();
    expect(fromState).toMatchSnapshot();
    expect(typeof next).toBe('function');
    next();
  });
  const unsubscribe = router.listen('ChangeStart', onChangeStart);
  return router.broadcastStartEvent({
    action: 'PUSH',
    previousRoute: route,
    previousParams: {id: 'old'},
    nextRoute: route,
    nextParams: {id: 'new'}
  })
    .then(() => {
      unsubscribe();
      expect(onChangeStart).toBeCalled();
    });
});

test('Broadcast a success event.', () => {
  const route = new Route({name: 'web', uri: '/'});
  const onChangeSuccess = jest.fn((action, toState, fromState) => {
    expect(action).toBe('PUSH');
    expect(toState).toMatchSnapshot();
    expect(fromState).toMatchSnapshot();
  });
  const unsubscribe = router.listen('ChangeSuccess', onChangeSuccess);
  router.broadcastSuccessEvent({
    action: 'PUSH',
    previousRoute: route,
    previousParams: {id: 'old'},
    nextRoute: route,
    nextParams: {id: 'new'}
  });
  unsubscribe();
  expect(onChangeSuccess).toBeCalled();
});

test('Broadcast an error event.', () => {
  const onChangeError = jest.fn(error => {
    expect(error.constructor).toBe(Error);
  });
  const unsubscribe = router.listen('ChangeError', onChangeError);
  router.broadcastErrorEvent(new Error('error'));
  unsubscribe();
  expect(onChangeError).toBeCalled();
});

test('Start dispatch routes and cancel it.', () => {
  const onChangeStart = jest.fn(action => {
    expect(action).toBe(historyActions.INITIAL);
  });
  const unsubscribe = router.listen('ChangeStart', onChangeStart);
  router.start();
  unsubscribe();
  expect(onChangeStart).toBeCalled();
});

test('Start dispatch routes.', () => {
  const onChangeStart = jest.fn((action, toState, fromState, next) => next());
  const onChangeSuccess = jest.fn(() => {});
  const onChangeError = jest.fn(() => {});
  const unsubscribeChangeStart = router.listen('ChangeStart', onChangeStart);
  const unsubscribeChangeSuccess = router.listen('ChangeSuccess', onChangeSuccess);
  const unsubscribeChangeError = router.listen('ChangeError', onChangeError);
  const component = renderer.create(<RouterView>Loading</RouterView>);
  return router.promise.then(result => {
    unsubscribeChangeStart();
    unsubscribeChangeSuccess();
    unsubscribeChangeError();
    expect(typeof result[5].key).toBe('string');
    delete result[5].key;
    expect(onChangeStart).toBeCalled();
    expect(onChangeSuccess).toBeCalled();
    expect(onChangeError).not.toBeCalled();
    expect(result).toMatchSnapshot();
    expect(component.toJSON()).toMatchSnapshot();
  });
});

test('Call onEnter() of the route when the router was started.', () => {
  jest.spyOn(Math, 'random').mockImplementation(() => 0.1);
  router.routes[0].onEnter = jest.fn(() => {});
  renderer.create(<RouterView>Loading</RouterView>);
  return router.promise.then(() => {
    expect(router.routes[0].onEnter).toBeCalledWith({
      key: 0.1.toString(36).substr(2),
      params: {}
    });
  });
});

test('Render the error component when the router was started with error.', () => {
  router.routes[0].resolve = {
    error: () => Promise.reject(new Error())
  };
  router.start();
  const component = renderer.create(<RouterView>Loading</RouterView>);
  return router.promise.then(() => {
    expect(router.views[0].name).toBeNull();
    expect(component.toJSON()).toMatchSnapshot();
  });
});

test('Go to a page and cancel it.', () => {
  router.start();
  const onChangeStart = jest.fn(action => {
    expect(action).toBe(historyActions.PUSH);
  });
  const onChangeError = jest.fn(() => {});
  const unsubscribeChangeStart = router.listen('ChangeStart', onChangeStart);
  const unsubscribeChangeError = router.listen('ChangeError', onChangeError);
  renderer.create(<RouterView>Loading</RouterView>);
  router.go('/login');
  unsubscribeChangeStart();
  unsubscribeChangeError();
  expect(onChangeStart).toBeCalled();
});

test('Go to a page.', () => {
  const onChangeStart = jest.fn((action, toState, fromState, next) => next());
  const onChangeSuccess = jest.fn(() => {});
  const onChangeError = jest.fn(() => {});
  const unsubscribeChangeStart = router.listen('ChangeStart', onChangeStart);
  const unsubscribeChangeSuccess = router.listen('ChangeSuccess', onChangeSuccess);
  const unsubscribeChangeError = router.listen('ChangeError', onChangeError);
  const component = renderer.create(<RouterView>Loading</RouterView>);
  return router.promise.then(() => {
    router.go('/login');
    router.promise.then(result => {
      unsubscribeChangeStart();
      unsubscribeChangeSuccess();
      unsubscribeChangeError();
      expect(typeof result[5].key).toBe('string');
      delete result[5].key;
      expect(onChangeStart).toBeCalled();
      expect(onChangeSuccess).toBeCalled();
      expect(onChangeError).not.toBeCalled();
      expect(result).toMatchSnapshot();
      expect(component.toJSON()).toMatchSnapshot();
    });
  });
});

test('Go to a page with reload.', () => {
  router.start();
  renderer.create(<RouterView>Loading</RouterView>);
  return router.promise.then(() => {
    router.go('/login', {reload: true});
    expect(router.isReloadNextHistoryChange).toBe(false);
  });
});

test('Call onEnter() of the route when the history was changed.', () => {
  router.start();
  renderer.create(<RouterView>Loading</RouterView>);
  return router.promise.then(() => {
    jest.spyOn(Math, 'random').mockImplementation(() => 0.1);
    router.routes[1].onEnter = jest.fn(() => {});
    router.go('/login');
    return router.promise;
  })
    .then(() => {
      expect(router.routes[1].onEnter).toBeCalledWith({
        key: 0.1.toString(36).substr(2),
        params: {}
      });
    });
});

test('Render the error component when the history was changed with error.', () => {
  router.routes[1].resolve = {error: () => Promise.reject(new Error())};
  router.start();
  const component = renderer.create(<RouterView>Loading</RouterView>);
  return router.promise.then(() => {
    jest.spyOn(Math, 'random').mockImplementation(() => 0.1);
    router.routes[1].onEnter = jest.fn(() => {});
    router.go('/login');
    return router.promise;
  })
    .then(() => {
      expect(router.views[0].name).toBeNull();
      expect(component.toJSON()).toMatchSnapshot();
    });
});

test('Reload the page and cancel it.', () => {
  router.start();
  renderer.create(<RouterView>Loading</RouterView>);
  return router.promise.then(() => {
    const onChangeStart = jest.fn(action => {
      expect(action).toBe(historyActions.RELOAD);
    });
    const onChangeStartB = jest.fn(() => {});
    const onChangeError = jest.fn(() => {});
    const unsubscribeChangeStart = router.listen('ChangeStart', onChangeStart);
    const unsubscribeChangeStartB = router.listen('ChangeStart', onChangeStartB);
    const unsubscribeChangeError = router.listen('ChangeError', onChangeError);
    unsubscribeChangeStartB();
    router.reload();
    unsubscribeChangeStart();
    unsubscribeChangeError();
    expect(onChangeStart).toBeCalled();
    expect(onChangeStartB).not.toBeCalled();
    expect(onChangeError).not.toBeCalled();
  });
});

test('Reload the page.', () => {
  router.start();
  renderer.create(<RouterView>Loading</RouterView>);
  router.reload();
  return router.promise.then(result => {
    expect(typeof result[5].key).toBe('string');
    delete result[5].key;
    expect(result).toMatchSnapshot();
  });
});

test('Render the error component when reload with error.', () => {
  router.start();
  const component = renderer.create(<RouterView>Loading</RouterView>);
  return router.promise.then(() => {
    jest.spyOn(Math, 'random').mockImplementation(() => 0.1);
    router.routes[0].resolve = {
      error: () => Promise.reject(new Error())
    };
    router.routes[0].onEnter = jest.fn(() => {});
    router.reload();
    return router.promise;
  })
    .then(() => {
      expect(router.views[0].name).toBeNull();
      expect(component.toJSON()).toMatchSnapshot();
    });
});

test('Get an error when reload the page.', () => {
  jest.spyOn(require('../lib/utils'), 'fetchResolveData')
    .mockImplementation(() => Promise.reject(new Error()));
  const onChangeError = jest.fn(() => {});
  const unsubscribe = router.listen('ChangeError', onChangeError);
  router.start();
  renderer.create(<RouterView>Loading</RouterView>);
  router.reload();
  return router.promise.finally(() => {
    unsubscribe();
    expect(onChangeError).toBeCalled();
  });
});

test('Get a null error when reload the page.', () => {
  jest.spyOn(require('../lib/utils'), 'fetchResolveData')
    .mockImplementation(() => Promise.reject(new errors.URLChangedError()));
  const onChangeError = jest.fn(() => {});
  const unsubscribe = router.listen('ChangeError', onChangeError);
  router.start();
  renderer.create(<RouterView>Loading</RouterView>);
  router.reload();
  return router.promise.finally(() => {
    unsubscribe();
    expect(onChangeError).not.toBeCalled();
  });
});

test('Render the error page.', () => {
  router.start();
  const component = renderer.create(<RouterView>Loading</RouterView>);
  return router.promise.then(() => {
    router.renderError(new Error('error'));
    expect(router.views[0].name).toBeNull();
    expect(component.toJSON()).toMatchSnapshot();
  });
});

test('Render the error page without the error component.', () => {
  delete router.errorComponent;
  router.start();
  const component = renderer.create(<RouterView>Loading</RouterView>);
  return router.promise.then(() => {
    router.renderError(new Error('error'));
    expect(router.views[0].name).toEqual('home');
    expect(component.toJSON()).toMatchSnapshot();
  });
});
