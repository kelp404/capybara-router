(function() {
  var Router, historyActions, singleInstance, utils,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  singleInstance = require('./single-instance');

  historyActions = require('./constants/history-actions');

  utils = require('./utils');

  module.exports = Router = (function() {
    function Router(args) {
      var i, len, ref, route, routes;
      if (args == null) {
        args = {};
      }
      this.findRoute = bind(this.findRoute, this);
      this.getCurrentRoute = bind(this.getCurrentRoute, this);
      this.listen = bind(this.listen, this);
      this.broadcastErrorEvent = bind(this.broadcastErrorEvent, this);
      this.broadcastSuccessEvent = bind(this.broadcastSuccessEvent, this);
      this.broadcastStartEvent = bind(this.broadcastStartEvent, this);
      this.go = bind(this.go, this);
      this.reload = bind(this.reload, this);
      this.registerRouterView = bind(this.registerRouterView, this);
      this.onHistoryChange = bind(this.onHistoryChange, this);
      this.start = bind(this.start, this);

      /*
      Setup the router.
      Note: Don't use 'key', 'params' as the key of the resolve.
      @param args {Object}
        history {history}
        routes {Array<routeConfig>}
          [
            name {string}
            uri {string}
            isAbstract {bool}
            onEnter {function}
            resolve {Object}
              "resourceName": {Promise<response.data>}
            component {React.Component}
          ]
        errorComponent {React.Component}
      @properties
        history {history}
        historyUnsubscription {function}
        routes {Array<Route>}
        errorComponent: {React.Component|null}
        views {Array<Object>}
          name: {string}
          routerView: {RouterView}
        eventHandlers {Object}
          changeStart: {Array<{id: {string}, func: function(action, toState, fromState, cancel)}>}
          changeSuccess: {Array<{id: {string}, func: function(action, toState, fromState)}>}
          changeError: {Array<{id: {string}, func: function(error)}>}
        currentRoute {Route}
        currentParams {Object}
        currentResolveData {Object}
      
        isSkipNextHistoryChange {bool}
        isReloadNextHistoryChange {bool}
        promise {Promise<['router-promise', history.action, previousRoute, previousParams, nextRoute, nextParams, props]>}
       */
      singleInstance.setRouter(this);
      routes = [];
      ref = args.routes;
      for (i = 0, len = ref.length; i < len; i++) {
        route = ref[i];
        routes.push(utils.generateRoute(route, routes));
      }
      this.history = args.history;
      this.historyUnsubscription = this.history.listen(this.onHistoryChange);
      this.routes = routes;
      this.errorComponent = args.errorComponent;
      this.views = [];
      this.eventHandlers = {
        changeStart: [],
        changeSuccess: [],
        changeError: []
      };
    }

    Router.prototype.start = function() {

      /*
      Start dispatch routes.
       */
      var currentParams, currentRoute, isCancel;
      this.currentRoute = currentRoute = this.getCurrentRoute();
      this.currentParams = currentParams = utils.parseRouteParams(this.history.location, currentRoute);
      isCancel = false;
      this.broadcastStartEvent({
        cancel: function() {
          return isCancel = true;
        },
        nextRoute: currentRoute,
        nextParams: currentParams
      });
      if (isCancel) {
        return;
      }
      return this.promise = utils.fetchResolveData(currentRoute, currentParams, '', this.currentResolveData, this.history).then((function(_this) {
        return function(resolveData) {
          var base, props, routeChaining;
          _this.currentResolveData = resolveData;
          props = utils.flattenResolveData(resolveData);
          props.key = Math.random().toString(36).substr(2);
          props.params = currentParams;
          routeChaining = currentRoute.parents.slice();
          routeChaining.push(currentRoute);
          if (typeof (base = routeChaining[0]).onEnter === "function") {
            base.onEnter(props);
          }
          _this.views[0].routerView.dispatch({
            route: routeChaining[0],
            props: props
          });
          if (routeChaining.length === 1) {
            _this.broadcastSuccessEvent({
              nextRoute: currentRoute,
              nextParams: currentParams
            });
          }
          return Promise.all(['router-promise', null, null, null, currentRoute, currentParams, props]);
        };
      })(this))["catch"]((function(_this) {
        return function(error) {
          if (!error) {
            return;
          }
          if (_this.errorComponent) {
            _this.views[0].name = null;
            _this.views[0].routerView.dispatch({
              route: {
                component: _this.errorComponent
              },
              props: {
                error: error
              }
            });
          }
          return _this.broadcastErrorEvent(error);
        };
      })(this));
    };

    Router.prototype.onHistoryChange = function(location, action) {

      /*
      The changing event handler of the history.
      @param location {history.location}
      @param action {constants.historyActions} PUSH, REPLACE, POP
        https://github.com/ReactTraining/history#listening
       */
      var changeViewIndex, i, index, isCancel, isReloadNextHistoryChange, len, nextRoute, nextRouteChaining, params, previousParams, previousRoute, ref, route;
      isReloadNextHistoryChange = this.isReloadNextHistoryChange;
      if (isReloadNextHistoryChange) {
        this.isReloadNextHistoryChange = false;
      }
      if (this.isSkipNextHistoryChange) {
        this.isSkipNextHistoryChange = false;
        return;
      }
      previousRoute = this.currentRoute;
      previousParams = this.currentParams;
      nextRoute = this.findRoute(location);
      params = utils.parseRouteParams(location, nextRoute);
      nextRouteChaining = nextRoute.parents.slice();
      nextRouteChaining.push(nextRoute);
      changeViewIndex = 0;
      if (this.promise && !isReloadNextHistoryChange) {
        for (index = i = 0, len = nextRouteChaining.length; i < len; index = ++i) {
          route = nextRouteChaining[index];
          if (!(route.name !== this.views[index].name)) {
            continue;
          }
          changeViewIndex = index;
          break;
        }
      }
      isCancel = false;
      this.broadcastStartEvent({
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
        this.isSkipNextHistoryChange = true;
        return;
      }
      return this.promise = utils.fetchResolveData(nextRoute, params, (ref = this.views[changeViewIndex]) != null ? ref.name : void 0, this.currentResolveData, this.history).then((function(_this) {
        return function(resolveData) {
          var base, props;
          _this.currentRoute = nextRoute;
          _this.currentResolveData = resolveData;
          props = utils.flattenResolveData(resolveData);
          props.key = Math.random().toString(36).substr(2);
          props.params = params;
          if (typeof (base = nextRouteChaining[changeViewIndex]).onEnter === "function") {
            base.onEnter(props);
          }
          _this.views.splice(changeViewIndex + 1);
          _this.views[changeViewIndex].name = nextRouteChaining[changeViewIndex].name;
          _this.views[changeViewIndex].routerView.dispatch({
            route: nextRouteChaining[changeViewIndex],
            props: props
          });
          if (nextRouteChaining.length === changeViewIndex + 1) {
            _this.broadcastSuccessEvent({
              action: action,
              previousRoute: previousRoute,
              previousParams: previousParams,
              nextRoute: nextRoute,
              nextParams: params
            });
          }
          return Promise.all(['router-promise', action, previousRoute, previousParams, nextRoute, params, props]);
        };
      })(this))["catch"]((function(_this) {
        return function(error) {
          if (!error) {
            return;
          }
          if (_this.errorComponent) {
            _this.views.splice(1);
            _this.views[0].name = null;
            _this.views[0].routerView.dispatch({
              route: {
                component: _this.errorComponent
              },
              props: {
                error: error
              }
            });
          }
          return _this.broadcastErrorEvent(error);
        };
      })(this));
    };

    Router.prototype.registerRouterView = function(routerView) {

      /*
      RouterView will call this method in `componentWillMount`.
      @param routerView {RouterView}
       */
      var ref, routeChaining, viewsIndex;
      routeChaining = this.currentRoute.parents.slice();
      routeChaining.push(this.currentRoute);
      viewsIndex = this.views.length;
      if (viewsIndex >= routeChaining.length) {
        return;
      }
      this.views.push({
        name: routeChaining[viewsIndex].name,
        routerView: routerView
      });
      return (ref = this.promise) != null ? ref.then((function(_this) {
        return function(arg) {
          var action, base, nextParams, previousParams, previousRoute, props, tag, targetRoute;
          tag = arg[0], action = arg[1], previousRoute = arg[2], previousParams = arg[3], targetRoute = arg[4], nextParams = arg[5], props = arg[6];
          if (tag !== 'router-promise') {
            return;
          }
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
            _this.broadcastSuccessEvent({
              action: action,
              previousRoute: previousRoute,
              previousParams: previousParams,
              nextRoute: targetRoute,
              nextParams: nextParams
            });
          }
          return Promise.all([tag, action, previousRoute, previousParams, targetRoute, nextParams, props]);
        };
      })(this))["catch"]((function(_this) {
        return function(error) {
          if (!error) {
            return;
          }
          if (_this.errorComponent) {
            _this.views.splice(1);
            _this.views[0].name = null;
            _this.views[0].routerView.dispatch({
              route: {
                component: _this.errorComponent
              },
              props: {
                error: error
              }
            });
          }
          return _this.broadcastErrorEvent(error);
        };
      })(this)) : void 0;
    };

    Router.prototype.reload = function() {

      /*
      Reload root router view.
       */
      var isCancel, params, route;
      route = this.currentRoute;
      params = utils.parseRouteParams(this.history.location, route);
      isCancel = false;
      this.broadcastStartEvent({
        cancel: function() {
          return isCancel = true;
        },
        action: historyActions.RELOAD,
        previousRoute: route,
        previousParams: params,
        nextRoute: route,
        nextParams: params
      });
      if (isCancel) {
        return;
      }
      return this.promise = utils.fetchResolveData(route, params, '', {}, this.history).then((function(_this) {
        return function(resolveData) {
          var base, i, index, len, props, ref, routeChaining, view;
          _this.currentResolveData = resolveData;
          props = utils.flattenResolveData(resolveData);
          props.key = Math.random().toString(36).substr(2);
          props.params = params;
          routeChaining = route.parents.slice();
          routeChaining.push(route);
          _this.views.splice(1);
          ref = _this.views;
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
          return Promise.all(['router-promise', historyActions.RELOAD, route, params, route, params, props]);
        };
      })(this))["catch"]((function(_this) {
        return function(error) {
          if (!error) {
            return;
          }
          if (_this.errorComponent) {
            _this.views.splice(1);
            _this.iews[0].name = null;
            _this.views[0].routerView.dispatch({
              route: {
                component: _this.errorComponent
              },
              props: {
                error: error
              }
            });
          }
          return _this.broadcastErrorEvent(error);
        };
      })(this));
    };

    Router.prototype.go = function(target, options) {
      var route, uri;
      if (options == null) {
        options = {};
      }

      /*
      Push/Replace a state to the history.
      If the new URI and the old one are same, it will reload the current page.
      @param target {string|Object}
        1. {string}:
          The target is the URI.
        2. {Object}:
          name {string}
          params {Object}
      @param options {Object}
        replace {bool}
        reload {bool}
       */
      if (options.reload) {
        this.isReloadNextHistoryChange = true;
      }
      if (typeof target === 'string') {
        if (("" + this.history.location.pathname + this.history.location.search) === target) {
          return this.reload();
        } else if (options.replace) {
          return this.history.replace(target);
        } else {
          return this.history.push(target);
        }
      } else {
        route = utils.findRouteByNameInRoutes(target.name, this.routes);
        uri = utils.generateUri(route, target.params);
        if (("" + this.history.location.pathname + this.history.location.search) === uri) {
          return this.reload();
        } else if (options.replace) {
          return this.history.replace(uri);
        } else {
          return this.history.push(uri);
        }
      }
    };

    Router.prototype.broadcastStartEvent = function(args) {
      var fromState, handler, i, len, ref, ref1, ref2, results, toState;
      if (args == null) {
        args = {};
      }

      /*
      @param args {Object}
        action {constants.historyActions|null}  PUSH, REPLACE, POP, RELOAD, INITIAL (The default is INITIAL.)
        cancel {function}  Eval this function to rollback history.
        previousRoute {Route}
        previousParams {Object|null}
        nextRoute {Route}
        nextParams {Object|null}
       */
      if (args.action == null) {
        args.action = historyActions.INITIAL;
      }
      if (args.action === historyActions.INITIAL) {
        fromState = null;
      } else {
        fromState = {
          name: args.previousRoute.name,
          params: (ref = args.previousParams) != null ? ref : {}
        };
      }
      toState = {
        name: args.nextRoute.name,
        params: (ref1 = args.nextParams) != null ? ref1 : {}
      };
      ref2 = this.eventHandlers.changeStart;
      results = [];
      for (i = 0, len = ref2.length; i < len; i++) {
        handler = ref2[i];
        results.push(handler.func(args.action, toState, fromState, args.cancel));
      }
      return results;
    };

    Router.prototype.broadcastSuccessEvent = function(args) {
      var fromState, handler, i, len, ref, ref1, ref2, results, toState;
      if (args == null) {
        args = {};
      }

      /*
      @param args {Object}
        action {constants.historyActions|null}  PUSH, REPLACE, POP, RELOAD, INITIAL (The default is INITIAL.)
        previousRoute {Route}
        previousParams {Object|null}
        nextRoute {Route}
        nextParams {Object|null}
       */
      if (args.action == null) {
        args.action = historyActions.INITIAL;
      }
      if (args.action === historyActions.INITIAL) {
        fromState = null;
      } else {
        fromState = {
          name: args.previousRoute.name,
          params: (ref = args.previousParams) != null ? ref : {}
        };
      }
      toState = {
        name: args.nextRoute.name,
        params: (ref1 = args.nextParams) != null ? ref1 : {}
      };
      ref2 = this.eventHandlers.changeSuccess;
      results = [];
      for (i = 0, len = ref2.length; i < len; i++) {
        handler = ref2[i];
        results.push(handler.func(args.action, toState, fromState));
      }
      return results;
    };

    Router.prototype.broadcastErrorEvent = function(error) {

      /*
      @param error {Error}
       */
      var handler, i, len, ref, results;
      ref = this.eventHandlers.changeError;
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        handler = ref[i];
        results.push(handler.func(error));
      }
      return results;
    };

    Router.prototype.listen = function(event, func) {

      /*
      Listen the change event.
      @param event {string}  "ChangeStart|ChangeSuccess|ChangeError"
      @param func {function}
        ChangeStart: (action, toState, fromState, cancel) ->
        ChangeSuccess: (action, toState, fromState) ->
        ChangeError: (error) ->
      @returns {function}  Eval this function to stop listen.
       */
      var handlers, id, table;
      table = {
        ChangeStart: this.eventHandlers.changeStart,
        ChangeSuccess: this.eventHandlers.changeSuccess,
        ChangeError: this.eventHandlers.changeError
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
    };

    Router.prototype.getCurrentRoute = function() {

      /*
      Get the current route via @history and @routes.
      @returns {Route}
       */
      return this.findRoute(this.history.location);
    };

    Router.prototype.findRoute = function(location) {

      /*
      Find the route in @routes by the location.
      @param location {location}
      @returns {Route}
       */
      var i, len, ref, route;
      ref = this.routes;
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
      throw new Error("Please define the not found page {uri: '.*'}.");
    };

    return Router;

  })();

}).call(this);