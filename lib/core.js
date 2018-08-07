(function() {
  var core;

  core = {
    historyListener: null,
    history: null,
    routes: [],
    views: [],
    currentRoute: null,
    promise: null,
    lastResolveData: null,
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
      var currentRoute, i, len, ref, route, routes;
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
        console.log(action, location);
        return route = core.findRoute(location);
      });
      core.currentRoute = currentRoute = core.getCurrentRoute();
      return core.promise = core.fetchResolveData(currentRoute, '', core.lastResolveData).then(function(resolveData) {
        var index, j, len1, props, ref1, routeChaining, view;
        core.lastResolveData = resolveData;
        props = core.flattenResolveData(resolveData);
        routeChaining = currentRoute.parents.slice();
        routeChaining.push(currentRoute);
        ref1 = core.views;
        for (index = j = 0, len1 = ref1.length; j < len1; index = ++j) {
          view = ref1[index];
          view.routerView.dispatch({
            route: routeChaining[index],
            props: props
          });
        }
        return Promise.all([currentRoute, props]);
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
    reload: function() {

      /*
      Reload root router view.
       */
      var route;
      route = core.currentRoute;
      return core.promise = core.fetchResolveData(route, '', null).then(function(resolveData) {
        var i, index, len, props, ref, routeChaining, view;
        core.lastResolveData = resolveData;
        props = core.flattenResolveData(resolveData);
        routeChaining = route.parents.slice();
        routeChaining.push(route);
        core.views.splice(1);
        ref = core.views;
        for (index = i = 0, len = ref.length; i < len; index = ++i) {
          view = ref[index];
          view.routerView.dispatch({
            route: routeChaining[index],
            props: props
          });
        }
        return Promise.all([route, props]);
      });
    },
    go: function(args) {
      if (args == null) {
        args = {};
      }
      if (args.href) {
        if (("" + core.history.location.pathname + core.history.location.search) === args.href) {
          return core.reload();
        } else {
          return core.history.push(args.href);
        }
      }
    },
    getCurrentRoute: function() {

      /*
      Get the current route via core.history and core.routes.
      @returns {Route}
       */
      return core.findRoute(core.history.location);
    },
    fetchResolveData: function(route, reloadFrom, lastResolveData) {
      var i, key, len, ref, ref1, routeChaining, taskKeys, tasks, value;
      if (reloadFrom == null) {
        reloadFrom = '';
      }
      if (lastResolveData == null) {
        lastResolveData = {};
      }

      /*
      @param route {Route}
      @param reloadFrom {string} Reload data from this route name.
      @param lastResolveData {object}
        "route-name":
          "resolve-key": response
      @returns {promise<object>}
        "route-name":
          "resolve-key": response
       */
      routeChaining = core.currentRoute.parents.slice();
      routeChaining.push(core.currentRoute);
      taskKeys = [];
      tasks = [];
      for (i = 0, len = routeChaining.length; i < len; i++) {
        route = routeChaining[i];
        if (!reloadFrom || route.name.indexOf(reloadFrom) === 0) {
          ref = route.resolve;
          for (key in ref) {
            value = ref[key];
            taskKeys.push(JSON.stringify({
              routeName: route.name,
              key: key
            }));
            tasks.push(value());
          }
        } else {
          ref1 = route.resolve;
          for (key in ref1) {
            value = ref1[key];
            taskKeys.push(JSON.stringify({
              routeName: route.name,
              key: key
            }));
            if (route.name in lastResolveData && key in lastResolveData[route.name]) {
              tasks.push(lastResolveData[route.name][key]);
            } else {
              tasks.push(value());
            }
          }
        }
      }
      return Promise.all(tasks).then(function(responses) {
        var index, j, len1, name1, result, taskInfo, taskKey;
        result = {};
        for (index = j = 0, len1 = taskKeys.length; j < len1; index = ++j) {
          taskKey = taskKeys[index];
          taskInfo = JSON.parse(taskKey);
          if (result[name1 = taskInfo.routeName] == null) {
            result[name1] = {};
          }
          result[taskInfo.routeName][taskInfo.key] = responses[index];
        }
        return result;
      });
    },
    flattenResolveData: function(resolveData) {
      var key, result, routeName, value;
      result = {
        key: Math.random().toString(36).substr(2)
      };
      for (routeName in resolveData) {
        for (key in resolveData) {
          value = resolveData[key];
          result[key] = value;
        }
      }
      return result;
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
