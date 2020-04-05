const React = require('react');

module.exports = class Home extends React.Component {
  shouldComponentUpdate() {
    return false;
  }

  render() {
    return <h2>Home</h2>;
  }
};
