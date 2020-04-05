const history = require('history');
const React = require('react');
const renderer = require('react-test-renderer');
const {Router, RouterView} = require('../../');

let router;
beforeEach(() => {
  router = new Router({
    history: history.createMemoryHistory({initialEntries: ['/']}),
    routes: [
      {name: 'home', uri: '/'}
    ]
  });
  router.start();
});

test('RouterView component render.', () => {
  const component = renderer.create(<RouterView>Loading</RouterView>);
  const tree = component.toJSON();
  expect(tree).toMatchSnapshot();
});

test('RouterView component render with a child component.', () => {
  class Child extends React.Component {
    render() {
      // eslint-disable-next-line react/prop-types
      return <div className={this.props.className}>child</div>;
    }
  }

  let routerView;
  router.registerRouterView = jest.fn(view => {
    routerView = view;
  });
  const component = renderer.create(<RouterView>Loading</RouterView>);
  routerView.dispatch({
    route: {component: Child},
    props: {className: 'head'}
  });
  const tree = component.toJSON();
  expect(tree).toMatchSnapshot();
});

test('RouterView component will call router.registerRouterView() on the mount event.', () => {
  router.registerRouterView = jest.fn(() => {});
  renderer.create(<RouterView>Loading</RouterView>);
  expect(router.registerRouterView).toBeCalled();
});
