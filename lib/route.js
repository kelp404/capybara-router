const queryString = require('query-string');
const utils = require('./utils');

module.exports = class Route {
  /**
   * @param {string} name - The route name.
   * @param {string} uri - The route path.
   * @param {boolean|null} isAbstract - Is abstract route?
   * @param {function|null} onEnter - On enter hook.
   * @param {{resourceName: Promise<Object>}|null} resolve - Data
   * @param {React.Component|null} component - The react component.
   * @param {function|null} loadComponent - The dynamic import function.
   * @param {number|null} dismissalDelay - The component remove delay in millisecond.
   * @param {Route|null} parent - The parent route.
   *
   * @property {string} name
   * @property {string} uri
   * @property {boolean} isAbstract
   * @property {function} onEnter
   * @property {Object} resolve
   * @property {React.Component|null} component
   * @property {function|null} loadComponent
   * @property {Array<string>} uriParamKeys - ex: ['projectId', '?index']  (with parents)
   * @property {string} matchPattern - ex: '/projects/([\w-]{20})'  (with parents)
   * @property {string} uriTemplate - The template for generating the uri.  ex: '/projects/{projectId}'  (with parents)
   * @property {RegExp} matchReg - The regexp for .match()  ex: /^\/projects\/([\w-]{20})$/  (with parents)
   * @property {Array<Route>} parents
   */
  constructor({name, uri, isAbstract, onEnter, resolve, component, loadComponent, dismissalDelay, parent}) {
    this.name = name;
    this.uri = uri;
    this.isAbstract = isAbstract == null ? false : isAbstract;
    this.onEnter = onEnter;
    this.resolve = resolve || {};
    this.component = component;
    this.loadComponent = loadComponent;
    this.dismissalDelay = dismissalDelay;

    const reservedWords = ['key', 'params'];
    reservedWords.forEach(reservedWord => {
      if (reservedWord in this.resolve) {
        throw new Error(`Don't use ${reservedWords.join(', ')} as the key of the resolve.`);
      }
    });

    if (parent) {
      this.uriParamKeys = parent.uriParamKeys == null ? [] : [...parent.uriParamKeys];
      this.matchPattern = parent.matchPattern || '';
      this.uriTemplate = parent.uriTemplate || '';
      this.parents = [...parent.parents];
      this.parents.push(parent);
    } else {
      this.uriParamKeys = [];
      this.matchPattern = '';
      this.uriTemplate = '';
      this.parents = [];
    }

    let uriPattern = this.uri;
    let uriTemplate = this.uri;

    // The uri is like '/projects/{projectId:[\w-]{20}}'.
    (this.uri.match(/{[\w]+:(?:(?!(\/|\?\w+)).)+/g) || []).forEach(uriParamPattern => {
      // The uriParamPattern is like '{projectId:[\w-]{20}}'.
      const match = uriParamPattern.match(/^{([\w]+):((?:(?!\/).)*)}$/);
      // The match is like ['{projectId:[w-]{20}}', 'projectId', '[w-]{20}', ...].
      this.uriParamKeys.push(match[1]);
      uriPattern = uriPattern.replace(uriParamPattern, `(${match[2]})`);
      uriTemplate = uriTemplate.replace(uriParamPattern, `{${match[1]}`);
    });
    (this.uri.match(/\?[\w-]+/g) || []).forEach(uriQueryString => {
      uriPattern = uriPattern.replace(uriQueryString, '');
      uriTemplate = uriTemplate.replace(uriQueryString, '');
      this.uriParamKeys.push(uriQueryString);
    });

    this.matchPattern += uriPattern;
    this.matchReg = new RegExp(`^${this.matchPattern}$`);
    this.uriTemplate += uriTemplate;
  }

  static fromOptionWithRoutes(options, routes) {
    if (options.name.indexOf('.') > 0) {
      // There are parents of this route.
      const parentRoute = utils.findRouteByNameInRoutes(options.name.substr(0, options.name.lastIndexOf('.')), routes);
      return new Route({...options, parent: parentRoute});
    }

    return new Route(options);
  }

  /**
   * Generate the URI of the route with params.
   * @param {Object} params - Params of the route.
   * @returns {string} - The URI.
   */
  generateUri(params) {
    let uri = this.uriTemplate;
    const query = {};

    Object.keys(params).forEach(key => {
      const value = params[key];
      if (uri.indexOf(`{${key}`) >= 0) {
        uri = uri.replace(`{${key}`, value);
      } else if (this.uriParamKeys.indexOf(`?${key}`) >= 0 && (value || value === 0)) {
        query[key] = value;
      }
    });

    if (Object.keys(query).length) {
      return `${uri}?${queryString.stringify(query)}`;
    }

    return uri;
  }
};
