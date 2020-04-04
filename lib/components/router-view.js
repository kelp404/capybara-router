const React = require('react');
const singleInstance = require('../single-instance');

module.exports = class RouterView extends React.PureComponent {
  state = {route: null, props: null};

  constructor(props) {
    super(props);
    singleInstance.getRouter().registerRouterView(this);
  }

  /**
   * Update the state to render.
   * @param {Route|null} route - The route.
   * @param {Object} props
   *  {
   *    key: string,
   *    params: Object
   *  }
   * @returns {undefined}
   */
  dispatch = ({route, props}) => {
    if (route && typeof route.onEnter === 'function') {
      route.onEnter(props);
    }

    this.setState({route, props});
  };

  render() {
    const {route, props} = this.state;

    if (route) {
      return React.createElement(route.component, props);
    }

    return <div>{props.children}</div>;
  }
};
