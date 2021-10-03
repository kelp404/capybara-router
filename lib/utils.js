const queryString = require('query-string');
const errors = require('./errors');

module.exports = {
  /**
   * Find the route by the route name in routes.
   * @param {string} name - The route name.
   * @param {Array<Route>} routes - Routes.
   * @returns {Route} - The route.
   */
  findRouteByNameInRoutes: (name, routes) => {
    const route = routes.find(x => x.name === name);
    if (route) {
      return route;
    }

    throw new Error(`Not found the route called ${name}.`);
  },
  /**
   * Parse params from the uri (path and query string).
   * @param {history.location} location - The history location.
   * @param {Route} route - The Route.
   * @returns {Object} - Params.
   */
  parseRouteParams: (location, route) => {
    const result = {};
    const match = location.pathname.match(route.matchReg);
    const parsedSearch = queryString.parse(location.search);
    let uriParamsIndex = 0;

    route.uriParamKeys.forEach(paramKey => {
      if (paramKey.indexOf('?') === 0) {
        // From query string.
        result[paramKey.substr(1)] = parsedSearch[paramKey.substr(1)];
      } else {
        // In uri path.
        result[paramKey] = match[++uriParamsIndex];
      }
    });
    return result;
  },
  /**
   * Flatten resolve data.
   * @param {Object} resolveData - The resolve data.
   * @returns {Object} - Flatted data.
   */
  flattenResolveData: resolveData => {
    const result = {};
    Object.keys(resolveData).forEach(routeName => {
      Object.keys(resolveData[routeName]).forEach(key => {
        result[key] = resolveData[routeName][key];
      });
    });
    return result;
  },
  /**
   * Fetch data of the route.
   * Note: When the user go to the other route before the promise was done, the old one will throw null.
   * @param {Route} route - The route.
   * @param {Object} params - Params.
   * @param {{routeName: {resolveKey: Object}}} reusableResolveData - Reusable resolve data.
   * @param {history} history - history.
   * @returns {Promise<{routeName: {resolveKey: Object}}>} - Results.
   */
  fetchResolveData: (route, params, reusableResolveData, history) => {
    const uri = `${history.location.pathname}${history.location.search}`;
    const routeChain = [...route.parents, route];
    const tasks = [
      Promise.all([
        route.component
          ? route.component
          : route.loadComponent().then(component => {
            route.component = component.default || component;
            return route.component;
          }),
        ...route.parents.map(parent => {
          if (parent.component) {
            return parent.component;
          }

          return parent.loadComponent().then(component => {
            parent.component = component.default || component;
            return parent.component;
          });
        }),
      ]),
    ];

    routeChain.forEach(route => {
      Object.keys(route.resolve).forEach(key => {
        const value = route.resolve[key];
        if (route.name in reusableResolveData && key in reusableResolveData[route.name]) {
          // Use parent's data.
          tasks.push({
            name: route.name,
            key,
            result: reusableResolveData[route.name][key],
          });
        } else {
          // Fetch from the server.
          tasks.push(value(params).then(result => ({name: route.name, key, result})));
        }
      });
    });

    return Promise.all(tasks).then(([_, ...results]) => {
      if (uri !== `${history.location.pathname}${history.location.search}`) {
        // The URL was changed.
        throw new errors.URLChangedError();
      }

      const result = {};
      results.forEach(item => {
        result[item.name] = result[item.name] || {};
        result[item.name][item.key] = item.result;
      });
      return result;
    })
      .catch(error => {
        if (uri !== `${history.location.pathname}${history.location.search}`) {
          // The URL was changed.
          throw new errors.URLChangedError();
        }

        throw error;
      });
  },
};
