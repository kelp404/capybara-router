const classNames = require('classnames');
const React = require('react');
const {RouterView, Link, getRouter} = require('../../');

module.exports = class Base extends React.Component {
  state = {currentRouteName: null};

  constructor(props) {
    super(props);
    const router = getRouter();
    this.listens = [
      router.listen('ChangeSuccess', (action, toState) => {
        this.setState({currentRouteName: toState.name});
      })
    ];
  }

  componentWillUnmount() {
    this.listens.map(x => x());
  }

  render() {
    const {currentRouteName} = this.state;

    return (
      <>
        <nav className="navbar navbar-default">
          <div className="container">
            <div className="navbar-header">
              <button type="button" className="navbar-toggle collapsed" data-toggle="collapse" data-target="#bs-example-navbar-collapse-1">
                <span className="sr-only">Toggle navigation</span>
                <span className="icon-bar"/>
                <span className="icon-bar"/>
                <span className="icon-bar"/>
              </button>
              <Link className="navbar-brand" to="/capybara-router/">capybara-router</Link>
            </div>

            <div className="collapse navbar-collapse" id="bs-example-navbar-collapse-1">
              <ul className="nav navbar-nav">
                <li className={classNames({active: currentRouteName === 'web.home'})}>
                  <Link to="/capybara-router/">Home</Link>
                </li>
                <li className={classNames({active: ['web.users', 'web.user'].indexOf(currentRouteName) >= 0})}>
                  <Link to="/capybara-router/users">Users</Link>
                </li>
                <li><Link to="/capybara-router/404">404</Link></li>
                <li><Link to="/capybara-router/error">Error</Link></li>
              </ul>
            </div>
          </div>
        </nav>

        <div className="container">
          <div className="row">
            <div className="col-sm-12">
              <RouterView/>
            </div>
          </div>
        </div>
      </>
    );
  }
};
