const React = require('react');
const PropTypes = require('prop-types');
const singleInstance = require('../single-instance');

module.exports = class RouterView extends React.PureComponent {
  static get propTypes() {
    return {
      children: PropTypes.node
    };
  }

  static get defaultProps() {
    return {
      children: React.createElement('div')
    };
  }

  constructor(props) {
    super(props);
    // eslint-disable-next-line react/state-in-constructor
    this.state = {route: null, props: null};
    this.dispatch = this.dispatch.bind(this);
    singleInstance.getRouter().registerRouterView(this);
  }

  /**
   * Update the state to render.
   * @param {Route|null} route - The route.
   * @param {{key: string, params: Object}} props - Props of the page component.
   * @returns {undefined}
   */
  dispatch({route, props}) {
    if (route && typeof route.onEnter === 'function') {
      route.onEnter(props);
    }

    this.setState({route, props});
  }

  render() {
    const {children} = this.props;
    const {route, props} = this.state;

    if (route) {
      return React.createElement(route.component, props);
    }

    return children;
  }
};
