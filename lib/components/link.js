(function() {
  var Link, React, core,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  React = require('react');

  core = require('../core');

  module.exports = Link = (function(superClass) {
    extend(Link, superClass);

    function Link() {
      this.onClick = bind(this.onClick, this);
      return Link.__super__.constructor.apply(this, arguments);
    }

    Link.prototype.onClick = function(event) {
      if (event.metaKey) {
        return;
      }
      event.preventDefault();
      if (this.props.href) {
        return core.go({
          href: this.props.href
        });
      }
    };

    Link.prototype.render = function() {
      return React.createElement("a", Object.assign({
        "onClick": this.onClick
      }, this.props));
    };

    return Link;

  })(React.Component);

}).call(this);
