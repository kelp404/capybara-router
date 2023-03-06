const React = require('react');
const PropTypes = require('prop-types');
const singleInstance = require('../single-instance');

module.exports = class Link extends React.PureComponent {
  static propTypes = {
    to: PropTypes.oneOfType([
      PropTypes.string.isRequired,
      PropTypes.shape({
        name: PropTypes.string.isRequired,
        params: PropTypes.object,
      }).isRequired,
    ]).isRequired,
  };

  constructor(props) {
    super(props);
    this.onClick = this.onClick.bind(this);
  }

  onClick(event) {
    if (event.metaKey) {
      return;
    }

    event.preventDefault();
    singleInstance.getRouter().go(this.props.to);
  }

  render() {
    const router = singleInstance.getRouter();
    const props = {
      ...this.props,
      to: undefined,
      href: typeof this.props.to === 'string'
        ? this.props.to
        : router.findRouteByName(this.props.to.name).generateUri(this.props.to.params || {}),
    };

    return React.createElement('a', {onClick: this.onClick, ...props});
  }
};
