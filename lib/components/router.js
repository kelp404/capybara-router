(function() {
  var React, Router, core,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  React = require('react');

  core = require('../core');

  module.exports = Router = (function(superClass) {
    extend(Router, superClass);

    function Router(props) {
      var currentRoute;
      Router.__super__.constructor.call(this, props);
      currentRoute = core.getCurrentRoute();
      this.state = {
        component: null
      };
    }

    Router.prototype.componentWillMount = function() {
      return console.log('router componentWillMount');
    };

    Router.prototype.componentDidMount = function() {
      return console.log('componentDidMount');
    };

    Router.prototype.render = function() {
      if (this.state.component) {
        return React.createElement(this.state.component);
      } else {
        return React.createElement("div", null, this.props.children);
      }
    };

    return Router;

  })(React.Component);

}).call(this);
