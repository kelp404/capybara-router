const React = require('react');

module.exports = class NotFound extends React.Component {
  shouldComponentUpdate() {
    return false;
  }

  render() {
    return <h2 className="text-center">Not Found</h2>;
  }
};
