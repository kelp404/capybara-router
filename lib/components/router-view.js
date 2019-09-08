(function() {
  var React, RouterView, singleInstance,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  React = require('react');

  singleInstance = require('../single-instance');

  module.exports = RouterView = (function(superClass) {
    extend(RouterView, superClass);

    function RouterView(props) {
      RouterView.__super__.constructor.call(this, props);
      this.state = {
        component: null,
        props: null
      };
      singleInstance.getRouter().registerRouterView(this);
    }

    RouterView.prototype.dispatch = function(args) {

      /*
      Update the state to render.
      @param args {Object}
        route: {Route}
        props: {Object}
          {
            key: {String}
            params: {Object}
            ...
          }
       */
      return this.setState({
        component: args.route.component,
        props: args.props
      });
    };

    RouterView.prototype.render = function() {
      if (this.state.component) {
        return React.createElement(this.state.component, this.state.props);
      } else {
        return React.createElement("div", null, this.props.children);
      }
    };

    return RouterView;

  })(React.PureComponent);

}).call(this);
