const PropTypes = require('prop-types');
const React = require('react');

module.exports = class ErrorPage extends React.Component {
  static get propTypes() {
    return {error: PropTypes.any.isRequired};
  }

  shouldComponentUpdate() {
    return false;
  }

  render() {
    const {error} = this.props;

    return (
      <h2 className="text-center">{`${error}`}</h2>
    );
  }
};
