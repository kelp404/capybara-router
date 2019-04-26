(function() {
  var singleInstance;

  singleInstance = require('./lib/single-instance');

  exports.Router = require('./lib/router');

  exports.Link = require('./lib/components/link');

  exports.RouterView = require('./lib/components/router-view');

  exports.getRouter = singleInstance.getRouter;

}).call(this);
