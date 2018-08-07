(function() {
  var core;

  core = {
    historyListener: null,
    history: null,
    routes: [],
    views: [],
    currentRoute: null,
    promise: null,
    generateRoute: function(args, routes) {
      var hrefTemplate, i, j, len, len1, match, parentRoute, ref, ref1, ref2, uriParamPattern, uriParamPatterns, uriPattern, uriQueryString;
      if (args == null) {
        args = {};
      }

      /*
      @param args {object}
        isAbstract {bool}
        name {string}
        uri {string}
        onEnter {function}
        resolve {object}
          "resourceName": {Promise<response.data>}
        component {React.Component}
      @returns {Route}
        uriParamKeys {list<string>}  ex: ['projectId', '?index']  (with parents)
        matchPattern {string}  ex: '/projects/([\w-]{20})'  (with parents)
        matchReg {RegExp} The regexp for .match()  ex: /^\/projects\/([\w-]{20})$/  (with parents)
        hrefTemplate {string} The template for generating href.  ex: '/projects/{projectId}'  (with parents)
        parents {list<route>}
       */
      if (args.resolve == null) {
        args.resolve = {};
      }
      if (args.name.indexOf('.') > 0) {
        parentRoute = core.findRouteByName(args.name.substr(0, args.name.lastIndexOf('.')), routes);
        args.uriParamKeys = parentRoute.uriParamKeys.slice();
        args.matchPattern = parentRoute.matchPattern;
        args.hrefTemplate = parentRoute.hrefTemplate;
        args.parents = parentRoute.parents.slice();
        args.parents.push(parentRoute);
      } else {
        args.uriParamKeys = [];
        args.matchPattern = '';
        args.hrefTemplate = '';
        args.parents = [];
      }
      uriPattern = args.uri;
      hrefTemplate = args.uri;
      uriParamPatterns = args.uri.match(/\{[\w]+:(?:(?!\/).)+/g);
      ref = uriParamPatterns != null ? uriParamPatterns : [];
      for (i = 0, len = ref.length; i < len; i++) {
        uriParamPattern = ref[i];
        match = uriParamPattern.match(/^\{([\w]+):((?:(?!\/).)*)\}$/);
        args.uriParamKeys.push(match[1]);
        uriPattern = uriPattern.replace(uriParamPattern, "(" + match[2] + ")");
        hrefTemplate = hrefTemplate.replace(uriParamPattern, "{" + match[1] + "}");
      }
      ref2 = (ref1 = args.uri.match(/\?[\w-]+/g)) != null ? ref1 : [];
      for (j = 0, len1 = ref2.length; j < len1; j++) {
        uriQueryString = ref2[j];
        uriPattern = uriPattern.replace(uriQueryString, '');
        hrefTemplate = hrefTemplate.replace(uriQueryString, '');
        args.uriParamKeys.push(uriQueryString);
      }
      args.matchPattern += uriPattern;
      args.matchReg = new RegExp("^" + args.matchPattern + "$");
      args.hrefTemplate += hrefTemplate;
      return args;
    },
    setup: function(args) {
      var i, key, keys, len, ref, resolveTable, route, routes, tasks, value;
      if (args == null) {
        args = {};
      }
      routes = [];
      ref = args.routes;
      for (i = 0, len = ref.length; i < len; i++) {
        route = ref[i];
        routes.push(core.generateRoute(route, routes));
      }
      core.history = args.history;
      core.routes = routes;
      core.views = [];
      if (typeof core.historyListener === "function") {
        core.historyListener();
      }
      core.historyListener = core.history.listen(function(location, action) {
        return console.log(action, location);
      });
      core.currentRoute = core.getCurrentRoute();
      resolveTable = core.mergeResolve(core.currentRoute);
      keys = [];
      tasks = [];
      for (key in resolveTable) {
        value = resolveTable[key];
        keys.push(key);
        tasks.push(value());
      }
      return core.promise = Promise.all(tasks).then(function(result) {
        var index, j, k, len1, props, ref1, ref2, routeChaining, view;
        props = {};
        for (index = j = 0, ref1 = result.length; j < ref1; index = j += 1) {
          props[keys[index]] = result[index];
        }
        routeChaining = core.currentRoute.parents.slice();
        routeChaining.push(core.currentRoute);
        ref2 = core.views;
        for (index = k = 0, len1 = ref2.length; k < len1; index = ++k) {
          view = ref2[index];
          view.routerView.dispatch({
            route: routeChaining[index],
            porps: props
          });
        }
        return Promise.all([core.currentRoute, props]);
      });
    },
    registerRouterView: function(routerView) {

      /*
      RouterView will call this method in `componentWillMount`.
      @param routerView {RouterView}
       */
      var routeChaining, viewsIndex;
      routeChaining = core.currentRoute.parents.slice();
      routeChaining.push(core.currentRoute);
      viewsIndex = core.views.length;
      core.views.push({
        name: routeChaining[viewsIndex].name,
        routerView: routerView
      });
      return core.promise.then(function(arg) {
        var props, targetRoute;
        targetRoute = arg[0], props = arg[1];
        routeChaining = targetRoute.parents.slice();
        routeChaining.push(targetRoute);
        routerView.dispatch({
          route: routeChaining[viewsIndex],
          props: props
        });
        return Promise.all([targetRoute, props]);
      });
    },
    go: function(args) {
      if (args == null) {
        args = {};
      }
      if (args.href) {
        return core.history.push(args.href);
      }
    },
    getCurrentRoute: function() {

      /*
      Get the current route via core.history and core.routes.
      @returns {Route}
       */
      return core.findRoute(core.history.location);
    },
    findRouteByName: function(name, routes) {

      /*
      @param name {string}
      @param routes {list<Route>}
      @returns {Route|null}
       */
      var i, len, route;
      for (i = 0, len = routes.length; i < len; i++) {
        route = routes[i];
        if (name === route.name) {
          return route;
        }
      }
      return null;
    },
    findRoute: function(location) {

      /*
      Find the route with location in core.routes.
      @param location {location}
      @returns {Route|null}
       */
      var i, len, ref, route;
      ref = core.routes;
      for (i = 0, len = ref.length; i < len; i++) {
        route = ref[i];
        if (route.matchReg.test(location.pathname)) {
          return route;
        }
      }
      return null;
    },
    mergeResolve: function(route) {

      /*
      @param route {Route}
      @returns {object}
       */
      var key, ref, result, value;
      result = {};
      ref = route.resolve;
      for (key in ref) {
        value = ref[key];
        result[key] = value;
      }
      route.parents.map(function(parent) {
        var ref1, results;
        ref1 = parent.resolve;
        results = [];
        for (key in ref1) {
          value = ref1[key];
          results.push(result[key] = value);
        }
        return results;
      });
      return result;
    }
  };

  module.exports = core;

}).call(this);
