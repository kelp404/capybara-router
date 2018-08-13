(function() {
  var core, queryString;

  queryString = require('query-string');

  core = {
    historyListener: null,
    history: null,
    routes: [],
    errorComponent: null,
    views: [],
    currentRoute: null,
    isSkipNextHistoryChange: false,
    isReloadNextHistoryChange: false,
    promise: null,
    lastParams: null,
    lastResolveData: null,
    eventHandlers: {
      changeStart: [],
      changeSuccess: [],
      changeError: []
    },
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
      var currentRoute, i, len, params, ref, route, routes;
      if (args == null) {
        args = {};
      }

      /*
      @param args {object}
        history {history}
        routes {list<route>}
          [
            name {string}
            uri {string}
            isAbstract {bool}
            onEnter {function}
            resolve {object}
              "resourceName": {Promise<response.data>}
            component {React.Component}
          ]
        errorComponent {React.Component}
       */
      routes = [];
      ref = args.routes;
      for (i = 0, len = ref.length; i < len; i++) {
        route = ref[i];
        routes.push(core.generateRoute(route, routes));
      }
      core.history = args.history;
      core.routes = routes;
      core.errorComponent = args.errorComponent;
      core.views = [];
      if (typeof core.historyListener === "function") {
        core.historyListener();
      }
      core.historyListener = core.history.listen(core.onHistoryChange);
      core.currentRoute = currentRoute = core.getCurrentRoute();
      params = core.parseRouteParams(core.history.location, currentRoute);
      core.broadcastStartEvent({
        nextRoute: currentRoute,
        nextParams: params
      });
      return core.promise = core.fetchResolveData(currentRoute, params, '', core.lastResolveData).then(function(resolveData) {
        var base, props, routeChaining;
        core.lastResolveData = resolveData;
        props = core.flattenResolveData(resolveData);
        props.params = params;
        routeChaining = currentRoute.parents.slice();
        routeChaining.push(currentRoute);
        if (typeof (base = routeChaining[0]).onEnter === "function") {
          base.onEnter(props);
        }
        core.views[0].routerView.dispatch({
          route: routeChaining[0],
          props: props
        });
        if (routeChaining.length === 1) {
          core.broadcastSuccessEvent({
            nextRoute: currentRoute,
            nextParams: params
          });
        }
        return Promise.all([null, null, null, currentRoute, params, props]);
      })["catch"](function(error) {
        if (core.errorComponent) {
          core.views[0].name = null;
          core.views[0].routerView.dispatch({
            route: {
              component: core.errorComponent
            },
            props: {
              error: error
            }
          });
        }
        return core.broadcastErrorEvent(error);
      });
    },
    onHistoryChange: function(location, action) {

      /*
      @param location {history.location}
      @param action {string|null} PUSH, REPLACE, POP, RELOAD, INITIAL
       */
      var changeViewIndex, i, index, isCancel, isReloadNextHistoryChange, len, nextRoute, nextRouteChaining, params, previousParams, previousRoute, route;
      isReloadNextHistoryChange = core.isReloadNextHistoryChange;
      if (isReloadNextHistoryChange) {
        core.isReloadNextHistoryChange = false;
      }
      if (core.isSkipNextHistoryChange) {
        core.isSkipNextHistoryChange = false;
        return;
      }
      previousRoute = core.currentRoute;
      previousParams = core.lastParams;
      nextRoute = core.findRoute(location);
      params = core.parseRouteParams(location, nextRoute);
      nextRouteChaining = nextRoute.parents.slice();
      nextRouteChaining.push(nextRoute);
      changeViewIndex = 0;
      if (!isReloadNextHistoryChange) {
        for (index = i = 0, len = nextRouteChaining.length; i < len; index = ++i) {
          route = nextRouteChaining[index];
          if (!(route.name !== core.views[index].name)) {
            continue;
          }
          changeViewIndex = index;
          break;
        }
      }
      isCancel = false;
      core.broadcastStartEvent({
        cancel: function() {
          return isCancel = true;
        },
        action: action,
        previousRoute: previousRoute,
        previousParams: previousParams,
        nextRoute: nextRoute,
        nextParams: params
      });
      if (isCancel) {
        core.isSkipNextHistoryChange = true;
        history.back();
        return;
      }
      return core.promise = core.fetchResolveData(nextRoute, params, core.views[changeViewIndex].name, core.lastResolveData).then(function(resolveData) {
        var base, props;
        core.currentRoute = nextRoute;
        core.lastResolveData = resolveData;
        props = core.flattenResolveData(resolveData);
        props.params = params;
        if (typeof (base = nextRouteChaining[changeViewIndex]).onEnter === "function") {
          base.onEnter(props);
        }
        core.views.splice(changeViewIndex + 1);
        core.views[changeViewIndex].name = nextRouteChaining[changeViewIndex].name;
        core.views[changeViewIndex].routerView.dispatch({
          route: nextRouteChaining[changeViewIndex],
          props: props
        });
        if (nextRouteChaining.length === changeViewIndex + 1) {
          core.broadcastSuccessEvent({
            action: action,
            previousRoute: previousRoute,
            previousParams: previousParams,
            nextRoute: nextRoute,
            nextParams: params
          });
        }
        return Promise.all([action, previousRoute, previousParams, nextRoute, params, props]);
      })["catch"](function(error) {
        if (core.errorComponent) {
          core.views.splice(1);
          core.views[0].name = null;
          core.views[0].routerView.dispatch({
            route: {
              component: core.errorComponent
            },
            props: {
              error: error
            }
          });
        }
        return core.broadcastErrorEvent(error);
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
        var action, base, nextParams, previousParams, previousRoute, props, targetRoute;
        action = arg[0], previousRoute = arg[1], previousParams = arg[2], targetRoute = arg[3], nextParams = arg[4], props = arg[5];
        routeChaining = targetRoute.parents.slice();
        routeChaining.push(targetRoute);
        if (typeof (base = routeChaining[viewsIndex]).onEnter === "function") {
          base.onEnter(props);
        }
        routerView.dispatch({
          route: routeChaining[viewsIndex],
          props: props
        });
        if (routeChaining.length === viewsIndex + 1) {
          core.broadcastSuccessEvent({
            action: action,
            previousRoute: previousRoute,
            previousParams: previousParams,
            nextRoute: targetRoute,
            nextParams: nextParams
          });
        }
        return Promise.all([action, previousRoute, previousParams, targetRoute, nextParams, props]);
      })["catch"](function(error) {
        if (core.errorComponent) {
          core.views.splice(1);
          core.views[0].name = null;
          core.views[0].routerView.dispatch({
            route: {
              component: core.errorComponent
            },
            props: {
              error: error
            }
          });
        }
        return core.broadcastErrorEvent(error);
      });
    },
    reload: function() {

      /*
      Reload root router view.
       */
      var isCancel, params, route;
      route = core.currentRoute;
      params = core.parseRouteParams(core.history.location, route);
      isCancel = false;
      core.broadcastStartEvent({
        cancel: function() {
          return isCancel = true;
        },
        action: 'RELOAD',
        previousRoute: route,
        previousParams: params,
        nextRoute: route,
        nextParams: params
      });
      if (isCancel) {
        return;
      }
      return core.promise = core.fetchResolveData(route, params, '', null).then(function(resolveData) {
        var base, i, index, len, props, ref, routeChaining, view;
        core.lastResolveData = resolveData;
        props = core.flattenResolveData(resolveData);
        props.params = params;
        routeChaining = route.parents.slice();
        routeChaining.push(route);
        core.views.splice(1);
        ref = core.views;
        for (index = i = 0, len = ref.length; i < len; index = ++i) {
          view = ref[index];
          if (typeof (base = routeChaining[index]).onEnter === "function") {
            base.onEnter(props);
          }
          view.routerView.dispatch({
            route: routeChaining[index],
            props: props
          });
        }
        return Promise.all(['RELOAD', route, params, route, params, props]);
      })["catch"](function(error) {
        if (core.errorComponent) {
          core.views.splice(1);
          core.views[0].name = null;
          core.views[0].routerView.dispatch({
            route: {
              component: core.errorComponent
            },
            props: {
              error: error
            }
          });
        }
        return core.broadcastErrorEvent(error);
      });
    },
    go: function(args) {
      var href, route;
      if (args == null) {
        args = {};
      }

      /*
      @param args {object}
        1. use href:
          href {string}
          replace {bool}
          reload {bool}
        2. use route name with params:
          name {string}
          params {object}
          replace {bool}
          reload {bool}
       */
      if (args.reload) {
        core.isReloadNextHistoryChange = true;
      }
      if (args.href) {
        if (("" + core.history.location.pathname + core.history.location.search) === args.href) {
          return core.reload();
        } else if (args.replace) {
          return core.history.replace(args.href);
        } else {
          return core.history.push(args.href);
        }
      } else {
        route = core.findRouteByName(args.name, core.routes);
        href = core.generateHref(route, args.params);
        if (("" + core.history.location.pathname + core.history.location.search) === href) {
          return core.reload();
        } else if (args.replace) {
          return core.history.replace(href);
        } else {
          return core.history.push(href);
        }
      }
    },
    broadcastStartEvent: function(args) {
      var fromState, handler, i, len, ref, ref1, ref2, results, toState;
      if (args == null) {
        args = {};
      }

      /*
      @params args {object}
        action {string}  PUSH, REPLACE, POP, RELOAD, INITIAL
        cancel {function}  Eval this function to rollback history.
        previousRoute {Route}
        previousParams {object|null}
        nextRoute {Route}
        nextParams {object|null}
       */
      if (args.action != null) {
        fromState = {
          name: args.previousRoute.name,
          params: (ref = args.previousParams) != null ? ref : {}
        };
      } else {
        args.action = 'INITIAL';
        fromState = null;
      }
      toState = {
        name: args.nextRoute.name,
        params: (ref1 = args.nextParams) != null ? ref1 : {}
      };
      ref2 = core.eventHandlers.changeStart;
      results = [];
      for (i = 0, len = ref2.length; i < len; i++) {
        handler = ref2[i];
        results.push(handler.func(args.action, toState, fromState, args.cancel));
      }
      return results;
    },
    broadcastSuccessEvent: function(args) {
      var fromState, handler, i, len, ref, ref1, ref2, results, toState;
      if (args == null) {
        args = {};
      }

      /*
      @params args {object}
        action {string}  PUSH, REPLACE, POP, RELOAD, INITIAL
        previousRoute {Route}
        previousParams {object|null}
        nextRoute {Route}
        nextParams {object|null}
       */
      if (args.action != null) {
        fromState = {
          name: args.previousRoute.name,
          params: (ref = args.previousParams) != null ? ref : {}
        };
      } else {
        args.action = 'INITIAL';
        fromState = null;
      }
      toState = {
        name: args.nextRoute.name,
        params: (ref1 = args.nextParams) != null ? ref1 : {}
      };
      ref2 = core.eventHandlers.changeSuccess;
      results = [];
      for (i = 0, len = ref2.length; i < len; i++) {
        handler = ref2[i];
        results.push(handler.func(args.action, toState, fromState));
      }
      return results;
    },
    broadcastErrorEvent: function(error) {

      /*
      @params error {Error}
       */
      var handler, i, len, ref, results;
      ref = core.eventHandlers.changeError;
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        handler = ref[i];
        results.push(handler.func(error));
      }
      return results;
    },
    listen: function(event, func) {

      /*
      @param event {string}  "ChangeStart|ChangeSuccess|ChangeError"
      @param func {function}
        ChangeStart: (action, toState, fromState, cancel) ->
        ChangeSuccess: (action, toState, fromState) ->
        ChangeError: (error) ->
      @returns {function}  Eval this function to stop listen.
       */
      var handlers, id, table;
      table = {
        ChangeStart: core.eventHandlers.changeStart,
        ChangeSuccess: core.eventHandlers.changeSuccess,
        ChangeError: core.eventHandlers.changeError
      };
      handlers = table[event];
      if (handlers == null) {
        throw new Error('event type error');
      }
      id = Math.random().toString(36).substr(2);
      handlers.push({
        id: id,
        func: func
      });
      return function() {
        var handler, i, index, len, results;
        results = [];
        for (index = i = 0, len = handlers.length; i < len; index = ++i) {
          handler = handlers[index];
          if (!(handler.id === id)) {
            continue;
          }
          handlers.splice(index, 1);
          break;
        }
        return results;
      };
    },
    getCurrentRoute: function() {

      /*
      Get the current route via core.history and core.routes.
      @returns {Route}
       */
      return core.findRoute(core.history.location);
    },
    fetchResolveData: function(route, params, reloadFrom, lastResolveData) {
      var i, key, len, ref, ref1, routeChaining, taskKeys, tasks, value;
      if (reloadFrom == null) {
        reloadFrom = '';
      }
      if (lastResolveData == null) {
        lastResolveData = {};
      }

      /*
      @param route {Route}
      @param params {object}
      @param reloadFrom {string} Reload data from this route name.
      @param lastResolveData {object}
        "route-name":
          "resolve-key": response
      @returns {promise<object>}
        "route-name":
          "resolve-key": response
       */
      routeChaining = route.parents.slice();
      routeChaining.push(route);
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
            tasks.push(value(params));
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
              tasks.push(value(params));
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
      var key, ref, result, routeName, value;
      result = {
        key: Math.random().toString(36).substr(2)
      };
      for (routeName in resolveData) {
        ref = resolveData[routeName];
        for (key in ref) {
          value = ref[key];
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
        if (!(route.matchReg.test(location.pathname))) {
          continue;
        }
        if (route.isAbstract) {
          continue;
        }
        return route;
      }
      return null;
    },
    generateHref: function(route, params) {
      var href, key, query, value;
      if (params == null) {
        params = {};
      }

      /*
      @param route {Route}
      @param params {object}
      @returns {string}
       */
      href = route.hrefTemplate;
      query = {};
      for (key in params) {
        value = params[key];
        if (href.indexOf("{" + key + "}") >= 0) {
          href = href.replace("{" + key + "}", value);
        } else {
          query[key] = value;
        }
      }
      if (Object.keys(query).length) {
        return href + "?" + (queryString.stringify(query));
      } else {
        return href;
      }
    },
    parseRouteParams: function(location, route) {

      /*
      @param location {history.location}
      @param route {Route}
       */
      var i, len, match, paramKey, parsedSearch, ref, result, uriParamsIndex;
      result = {};
      match = location.pathname.match(new RegExp("^" + route.matchPattern));
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
