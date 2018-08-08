PropTypes = require 'prop-types'
React = require 'react'
{Link} = require '../../'


module.exports = class Users extends React.Component
  @propTypes =
    users: PropTypes.object.isRequired

  render: ->
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
          @props.users.items.map (user) ->
            <tr key={user.id}>
              <td>
                <Link href={"/capybara-router/users/#{user.id}"}>{user.id}</Link>
              </td>
              <td>{user.name}</td>
              <td>{user.email}</td>
            </tr>
        }
      </tbody>
    </table>
