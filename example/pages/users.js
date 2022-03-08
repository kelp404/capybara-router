const PropTypes = require('prop-types');
const React = require('react');
const {Link} = require('../../');

module.exports = class Users extends React.Component {
  static propTypes = {
    users: PropTypes.shape({
      total: PropTypes.number.isRequired,
      items: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        email: PropTypes.string.isRequired,
      }).isRequired).isRequired,
    }).isRequired,
  };

  render() {
    const {users} = this.props;

    return (
      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
          </tr>
        </thead>
        <tbody>
          {
            users.items.map(user => (
              <tr key={user.id}>
                <td>
                  <Link to={`/capybara-router/users/${user.id}`}>{user.id}</Link>
                </td>
                <td>{user.name}</td>
                <td>{user.email}</td>
              </tr>
            ))
          }
        </tbody>
      </table>
    );
  }
};
