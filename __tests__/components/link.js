const history = require('history');
const React = require('react');
const renderer = require('react-test-renderer');
const Route = require('../../lib/route');
const utils = require('../../lib/utils');
const {Router, Link} = require('../../');

let router;
beforeEach(() => {
  router = new Router({
    history: history.createMemoryHistory({initialEntries: ['/']}),
    routes: [
      {name: 'home', uri: '/'},
    ],
  });
});
afterEach(() => {
  jest.restoreAllMocks();
});

test('Link component render.', () => {
  const component = renderer.create(<Link to="https://github.com">GitHub</Link>);
  const tree = component.toJSON();
  expect(tree).toMatchSnapshot();
});

test('Link component render with object props.', () => {
  const route = new Route({
    name: 'web',
    uri: '/web?index',
  });
  jest.spyOn(utils, 'findRouteByNameInRoutes').mockImplementation(name => {
    expect(name).toBe('web');
    return route;
  });
  jest.spyOn(route, 'generateUri').mockImplementation(() => '/web?index=0');
  const component = renderer.create(
    <Link to={{name: 'web', params: {index: 0}}}>Web</Link>,
  );
  const tree = component.toJSON();
  expect(utils.findRouteByNameInRoutes).toBeCalled();
  expect(route.generateUri).toBeCalledWith({index: 0});
  expect(tree).toMatchSnapshot();
});

test('Link component calls router.go() when it was clicked.', () => {
  router.go = jest.fn(() => {});
  const component = renderer.create(<Link to="https://github.com">GitHub</Link>);
  const tree = component.toJSON();
  tree.props.onClick({preventDefault() {}});
  expect(router.go).toBeCalledWith('https://github.com');
});

test('Link component does not call router.go() when it was clicked with the meta key.', () => {
  router.go = jest.fn(() => {});
  const component = renderer.create(<Link to="https://github.com">GitHub</Link>);
  const tree = component.toJSON();
  tree.props.onClick({metaKey: true, preventDefault() {}});
  expect(router.go).not.toBeCalled();
});
