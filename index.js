(function() {
  var core;

  core = require('./lib/core');

  exports.setup = core.setup;

  exports.reload = core.reload;

  exports.go = core.go;

  exports.Link = require('./lib/components/link');

  exports.RouterView = require('./lib/components/router-view');

}).call(this);
