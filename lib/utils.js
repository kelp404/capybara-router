(function() {
  var Route, queryString, utils,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  queryString = require('query-string');

  Route = require('./route');

  module.exports = utils = {
    generateRoute: function(args, routes) {
      var i, key, len, parentRoute, ref, ref1, reservedWords;
      if (args == null) {
        args = {};
      }

      /*
      Generate a route with exist routes.
      @param args {Object}
        isAbstract {bool}
        name {string}
        uri {string}
        onEnter {function}
        resolve {Object}
          "resourceName": {Promise<response.data>}
        component {React.Component}
      @param routes {Array<Route>}
      @returns {Route}
       */
      reservedWords = ['key', 'params'];
      ref1 = Object.keys((ref = args.resolve) != null ? ref : {});
      for (i = 0, len = ref1.length; i < len; i++) {
        key = ref1[i];
        if (indexOf.call(reservedWords, key) >= 0) {
          throw new Error("Don't use " + (reservedWords.join(', ')) + " as the key of the resolve.");
        }
      }
      if (args.name.indexOf('.') > 0) {
        parentRoute = utils.findRouteByNameInRoutes(args.name.substr(0, args.name.lastIndexOf('.')), routes);
        return new Route(args, parentRoute);
      } else {
        return new Route(args);
      }
    },
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
    },
    fetchResolveData: function(route, params, reloadFrom, lastResolveData, history) {
      var i, key, len, ref, ref1, routeChaining, taskInformation, tasks, uri, value;
      if (reloadFrom == null) {
        reloadFrom = '';
      }

      /*
      Fetch data of the route.
      Note: When the user go to the other route before the promise was done, the old one will throw null.
      @param route {Route}
      @param params {Object} Params of the uri.
      @param reloadFrom {string} Reload data from this route name.
      @param lastResolveData {Object}
        "route-name":
          "resolve-key": response
      @param history {history}
      @returns {Promise<Object>}
        "route-name":
          "resolve-key": response
       */
      uri = "" + history.location.pathname + history.location.search;
      routeChaining = route.parents.slice();
      routeChaining.push(route);
      taskInformation = [];
      tasks = [];
      for (i = 0, len = routeChaining.length; i < len; i++) {
        route = routeChaining[i];
        if (!reloadFrom || route.name.indexOf(reloadFrom) === 0) {
          ref = route.resolve;
          for (key in ref) {
            value = ref[key];
            taskInformation.push({
              routeName: route.name,
              key: key
            });
            tasks.push(value(params));
          }
        } else {
          ref1 = route.resolve;
          for (key in ref1) {
            value = ref1[key];
            taskInformation.push({
              routeName: route.name,
              key: key
            });
            if (route.name in lastResolveData && key in lastResolveData[route.name]) {
              tasks.push(lastResolveData[route.name][key]);
            } else {
              tasks.push(value(params));
            }
          }
        }
      }
      return Promise.all(tasks).then(function(responses) {
        var index, information, j, len1, name1, result;
        if (uri !== ("" + history.location.pathname + history.location.search)) {
          throw null;
        }
        result = {};
        for (index = j = 0, len1 = taskInformation.length; j < len1; index = ++j) {
          information = taskInformation[index];
          if (result[name1 = information.routeName] == null) {
            result[name1] = {};
          }
          result[information.routeName][information.key] = responses[index];
        }
        return result;
      })["catch"](function(error) {
        if (uri !== ("" + history.location.pathname + history.location.search)) {
          throw null;
        }
        throw error;
      });
    },
    flattenResolveData: function(resolveData) {

      /*
      Flatten resolve data.
      @param resolveData {Object}
      @returns {Object}
        "resolveResourceName": {Object}
       */
      var key, ref, result, routeName, value;
      result = {};
      for (routeName in resolveData) {
        ref = resolveData[routeName];
        for (key in ref) {
          value = ref[key];
          result[key] = value;
        }
      }
      return result;
    }
  };

}).call(this);
