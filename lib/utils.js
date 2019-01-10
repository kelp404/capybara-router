(function() {
  var queryString;

  queryString = require('query-string');

  module.exports = {
    findRouteByNameInRoutes: function(name, routes) {

      /*
      Find the route by the route name in routes.
      @param name {string}
      @param routes {Array<Route>}
      @returns {Route}
       */
      var i, len, route;
      for (i = 0, len = routes.length; i < len; i++) {
        route = routes[i];
        if (name === route.name) {
          return route;
        }
      }
      throw new Error("Not found the route called " + name + ".");
    },
    generateUri: function(route, params) {
      var key, query, uri, value;
      if (params == null) {
        params = {};
      }

      /*
      Generate the URI of the route with params.
      @param route {Route}
      @param params {Object}
      @returns {string}
       */
      uri = route.uriTemplate;
      query = {};
      for (key in params) {
        value = params[key];
        if (uri.indexOf("{" + key + "}") >= 0) {
          uri = uri.replace("{" + key + "}", value);
        } else {
          query[key] = value;
        }
      }
      if (Object.keys(query).length) {
        return uri + "?" + (queryString.stringify(query));
      } else {
        return uri;
      }
    },
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
