const singleInstance = require('./single-instance');
const Route = require('./route');
const utils = require('./utils');
const errors = require('./errors');
const historyActions = require('./constants/history-actions');

module.exports = class Router {
  /**
   * @param {history} history - The history.
   * @param {React.Component|null} errorComponent - The error component.
   * @param {Array<{
   *    name: string,
   *    uri: string,
   *    isAbstract: (boolean|null),
   *    onEnter: (function|null),
   *    resolve: ({resourceName: Promise<Object>}|null),
   *    component: (React.Component|null),
   *    loadComponent: (function|null),
   *    dismissalDelay: (number|null)
   *  }>} routes - Routes settings.
   *
   * @property {history} history
   * @property {Array<Route>} routes
   * @property {React.Component|null} errorComponent
   * @property {Array<{name: (string|null), routerView: RouterView}>} views
   * @property {{
   *    changeStart: Array<{id: string, func: function(action: string, toState: {name: string, params: Object}, fromState: {name: string, params: Object}, next)}>,
   *    changeSuccess: Array<{id: string, func: function(action: string, toState: {name: string, params: Object}, fromState: {name: string, params: Object})}>,
   *    changeError: Array<{id: string, func: function(error)}>
   *  }} eventHandlers
   * @property {Route} currentRoute
   * @property {Object} currentParams
   * @property {{routeName: {resolveKey: Object}}} currentResolveData
   * @property {Promise<[history.action, previousRoute, previousParams, nextRoute, nextParams, props]>} promise
   */
  constructor({history, errorComponent, routes}) {
    singleInstance.setRouter(this);
    this.isStart = false;
    this.views = [];
    this.eventHandlers = {
      changeStart: [],
      changeSuccess: [],
      changeError: []
    };
    this.history = history;
    this.errorComponent = errorComponent;
    this.routes = [];
    routes.forEach(route => {
      this.routes.push(Route.fromOptionWithRoutes(route, this.routes));
    });
    this.history.listen(this.onHistoryChange);
  }

  onHistoryChange = (location, action) => {
    const isReloadNextHistoryChange = this.isReloadNextHistoryChange;
  };

  /**
   * Start dispatch routes.
   * @returns {undefined}
   */
  start = () => {
    if (this.isStart) {
      return;
    }

    const currentRoute = this.getCurrentRoute();
    const currentParams = utils.parseRouteParams(this.history.location, currentRoute);
    this.currentRoute = currentRoute;
    this.currentParams = currentParams;
    this.isStart = true;

    this.promise = this.broadcastStartEvent({
      action: historyActions.INITIAL,
      nextRoute: currentRoute,
      nextParams: currentParams
    })
      .then(() => {
        return utils.fetchResolveData(currentRoute, currentParams, {}, this.history);
      })
      .then(resolveData => {
        const props = {
          ...utils.flattenResolveData(resolveData),
          key: Math.random().toString(36).substr(2),
          params: currentParams
        };
        const routeChain = [...currentRoute.parents, currentRoute];
        this.currentResolveData = resolveData;

        this.views[0].routerView.dispatch({route: routeChain[0], props});
        if (routeChain.length === 1) {
          // The last one.
          this.broadcastSuccessEvent({
            action: historyActions.INITIAL,
            previousRoute: null,
            previousParams: null,
            nextRoute: currentRoute,
            nextParams: currentParams
          });
        }

        return Promise.all([
          historyActions.INITIAL,
          null,
          null,
          currentRoute,
          currentParams,
          props
        ]);
      })
      .catch(error => {
        if (error instanceof errors.URLChangedError) {
          return;
        }

        if (this.errorComponent) {
          this.views[0].name = null;
          this.views[0].routerView.dispatch({
            route: {component: this.errorComponent},
            props: {error}
          });
          this.broadcastErrorEvent(error);
        }
      });
  };

  /**
   * RouterView will call this method in the constructor.
   * @param {RouterView} routerView - The router view.
   * @returns {undefined}
   */
  registerRouterView = routerView => {
    const routeChain = this.currentRoute ? [...this.currentRoute.parents, this.currentRoute] : [];
    const viewsIndex = this.views.length;

    if (viewsIndex < routeChain.length) {
      this.views.push({routerView, name: routeChain[viewsIndex].name});
    } else {
      this.views.push({routerView, name: null});
    }

    if (!this.isStart) {
      this.start();
    } else if (this.promise) {
      this.promise
        .then(([action, previousRoute, previousParams, targetRoute, nextParams, props]) => {
          const routeChain = [...targetRoute.parents, targetRoute];
          routerView.dispatch({route: routeChain[viewsIndex], props});
          if (routeChain.length === viewsIndex + 1) {
            this.broadcastSuccessEvent({
              action,
              previousRoute,
              previousParams,
              nextRoute: targetRoute,
              nextParams
            });
          }

          return Promise.all([
            action,
            previousRoute,
            previousParams,
            targetRoute,
            nextParams,
            props
          ]);
        })
        .catch(error => {
          if (error instanceof errors.URLChangedError) {
            return;
          }

          if (this.errorComponent) {
            this.views.splice(1);
            this.views[0].name = null;
            this.views[0].routerView.dispatch({
              route: {component: this.errorComponent},
              props: {error}
            });
            this.broadcastErrorEvent(error);
          }
        });
    }
  };

  /**
   * @param {string} action - "PUSH|REPLACE|POP|RELOAD|INITIAL"
   * @param {Route|null} previousRoute - The previous route.
   * @param {Object|null} previousParams - Previous params.
   * @param {Route} nextRoute - The next route.
   * @param {Object} nextParams - Next params.
   * @returns {Promise<*>} - After all handler call next().
   */
  broadcastStartEvent = ({action, previousRoute, previousParams, nextRoute, nextParams}) => new Promise(resolve => {
    let nextCounts = 0;
    let fromState = null;
    const totalStartHandler = this.eventHandlers.changeStart.length;
    const toState = {
      name: nextRoute.name,
      params: nextParams
    };

    if (action !== historyActions.INITIAL) {
      fromState = {
        name: previousRoute.name,
        params: previousParams
      };
    }

    if (totalStartHandler > 0) {
      this.eventHandlers.changeStart.forEach(handler => {
        handler.func(action, toState, fromState, () => {
          nextCounts += 1;
          if (nextCounts === totalStartHandler) {
            resolve();
          }
        });
      });
    } else {
      resolve();
    }
  });

  /**
   * @param {string} action - "PUSH|REPLACE|POP|RELOAD|INITIAL"
   * @param {Route|null} previousRoute - The previous route.
   * @param {Object|null} previousParams - Previous params.
   * @param {Route} nextRoute - The next route.
   * @param {Object} nextParams - Next params.
   * @returns {undefined}
   */
  broadcastSuccessEvent = ({action, previousRoute, previousParams, nextRoute, nextParams}) => {
    let fromState = null;
    const toState = {
      name: nextRoute.name,
      params: nextParams
    };

    if (action !== historyActions.INITIAL) {
      fromState = {
        name: previousRoute.name,
        params: previousParams
      };
    }

    this.eventHandlers.changeSuccess.forEach(handler => {
      handler.func(action, toState, fromState);
    });
  };

  /**
   * @param {Error} error - The error information.
   * @returns {undefined}
   */
  broadcastErrorEvent = error => {
    this.eventHandlers.changeError.forEach(handler => {
      handler.func(error);
    });
  };

  /**
   * Listen the change event.
   * @param {string} event - "ChangeStart|ChangeSuccess|ChangeError"
   * @param {
   *    function(action: string, toState: ({name: string, params: Object}|null), fromState: {name: string, params: Object}, next: function)|
   *    function(action: string, toState: ({name: string, params: Object}|null), fromState: {name: string, params: Object})|
   *    function(error)
   *  } func - The handler.
   * @returns {function()} - The unsubscribe function.
   */
  listen = (event, func) => {
    const table = {
      ChangeStart: this.eventHandlers.changeStart,
      ChangeSuccess: this.eventHandlers.changeSuccess,
      ChangeError: this.eventHandlers.changeError
    };
    const handlers = table[event];
    const id = Math.random().toString(36).substr(2);

    if (handlers == null) {
      throw new Error('event type error');
    }

    handlers.push({id, func});
    return () => {
      const handlerIndex = handlers.findIndex(x => x.id === id);
      if (handlerIndex >= 0) {
        handlers.splice(handlerIndex, 1);
      }
    };
  };

  /**
   * Get the current route via @history and @routes.
   * @returns {Route} - The route.
   */
  getCurrentRoute = () => {
    return this.findRoute(this.history.location);
  };

  /**
   * @param {string} name - The route name.
   * @returns {Route} - The route.
   */
  findRouteByName = name => {
    return utils.findRouteByNameInRoutes(name, this.routes);
  };

  /**
   * Find the route at this.routes by the location.
   * @param {history.location} location - The history location.
   * @returns {Route} - The route.
   */
  findRoute = location => {
    for (let index = 0; index < this.routes.length; index += 1) {
      const route = this.routes[index];

      if (route.matchReg.test(location.pathname)) {
        if (route.isAbstract) {
          continue;
        }

        return route;
      }
    }

    throw new Error('Please define the not found page {uri: ".*"}.');
  };
};
