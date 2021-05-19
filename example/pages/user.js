const PropTypes = require('prop-types');
const React = require('react');

module.exports = class Users extends React.PureComponent {
  static propTypes = {
    user: PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      email: PropTypes.string.isRequired
    }).isRequired
  }

  render() {
    const {user} = this.props;

    return (
      <>
        <div className="form-group">
          <label className="control-label">ID</label>
          <p className="form-control-static">{user.id}</p>
        </div>
        <div className="form-group">
          <label className="control-label">Name</label>
          <p className="form-control-static">{user.name}</p>
        </div>
        <div className="form-group">
          <label className="control-label">Email</label>
          <p className="form-control-static">{user.email}</p>
        </div>
      </>
    );
  }
};
