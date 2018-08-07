(function() {
  var core;

  core = require('./lib/core');

  exports.setup = core.setup;

  exports.RouterView = require('./lib/components/router-view');

}).call(this);
