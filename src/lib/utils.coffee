queryString = require 'query-string'
Route = require './route'


module.exports = utils =
  generateRoute: (args = {}, routes) ->
    ###
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
    ###
    reservedWords = ['key', 'params']
    for key in Object.keys(args.resolve ? {}) when key in reservedWords
      throw new Error("Don't use #{reservedWords.join(', ')} as the key of the resolve.")
    if args.name.indexOf('.') > 0
      # there are parents of this route
      parentRoute = utils.findRouteByNameInRoutes args.name.substr(0, args.name.lastIndexOf('.')), routes
      new Route(args, parentRoute)
    else
      new Route(args)

  findRouteByNameInRoutes: (name, routes) ->
    ###
    Find the route by the route name in routes.
    @param name {string}
    @param routes {Array<Route>}
    @returns {Route}
    ###
    for route in routes when name is route.name
      return route
    throw new Error("Not found the route called #{name}.")

  generateUri: (route, params = {}) ->
    ###
    Generate the URI of the route with params.
    @param route {Route}
    @param params {Object}
    @returns {string}
    ###
    uri = route.uriTemplate
    query = {}
    for key, value of params
      if uri.indexOf("{#{key}}") >= 0
        uri = uri.replace "{#{key}}", value
      else
        query[key] = value
    if Object.keys(query).length
      "#{uri}?#{queryString.stringify(query)}"
    else
      uri

  parseRouteParams: (location, route) ->
    ###
    Parse params from the uri (path and query string).
    @param location {history.location}
    @param route {Route}
    @returns {Object}
      "paramKey": {string}
    ###
    result = {}
    match = location.pathname.match route.matchReg
    parsedSearch = queryString.parse location.search
    uriParamsIndex = 0
    for paramKey in route.uriParamKeys
      if paramKey.indexOf('?') is 0
        # From query string.
        paramKey = paramKey.substr 1
        result[paramKey] = parsedSearch[paramKey]
      else
        # In uri path.
        result[paramKey] = match[++uriParamsIndex]
    result
