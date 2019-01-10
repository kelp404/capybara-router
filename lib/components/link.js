(function() {
  var Link, PropTypes, React, core, utils,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  React = require('react');

  PropTypes = require('prop-types');

  core = require('../core');

  utils = require('../utils');

  module.exports = Link = (function(superClass) {
    extend(Link, superClass);

    function Link() {
      this.onClick = bind(this.onClick, this);
      return Link.__super__.constructor.apply(this, arguments);
    }

    Link.propTypes = {
      to: PropTypes.any.isRequired
    };

    Link.prototype.onClick = function(event) {
      if (event.metaKey) {
        return;
      }
      event.preventDefault();
      return core.go(this.props.to);
    };

    Link.prototype.render = function() {
      var key, props, ref, route, value;
      props = {};
      ref = this.props;
      for (key in ref) {
        value = ref[key];
        props[key] = value;
      }
      delete props.to;
      if (typeof this.props.to === 'object') {
        route = core.findRouteByName(this.props.to.name, core.routes);
        props.href = utils.generateUri(route, this.props.to.params);
      } else {
        props.href = this.props.to;
      }
      return React.createElement("a", Object.assign({
        "onClick": this.onClick
      }, props));
    };

    return Link;

  })(React.Component);

}).call(this);
