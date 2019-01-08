(function() {
  var queryString;

  queryString = require('query-string');

  module.exports = {
    parseRouteParams: function(location, route) {

      /*
      Parse params from the uri (path and query string).
      @param location {history.location}
      @param route {Route}
      @returns {Object}
        "paramKey": {string}
       */
      var i, len, match, paramKey, parsedSearch, ref, result, uriParamsIndex;
      result = {};
      match = location.pathname.match(route.matchReg);
      parsedSearch = queryString.parse(location.search);
      uriParamsIndex = 0;
      ref = route.uriParamKeys;
      for (i = 0, len = ref.length; i < len; i++) {
        paramKey = ref[i];
        if (paramKey.indexOf('?') === 0) {
          paramKey = paramKey.substr(1);
          result[paramKey] = parsedSearch[paramKey];
        } else {
          result[paramKey] = match[++uriParamsIndex];
        }
      }
      return result;
    }
  };

}).call(this);
