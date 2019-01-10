queryString = require 'query-string'


module.exports =
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
