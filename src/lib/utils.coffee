queryString = require 'query-string'
Route = require './route'


module.exports = utils =
  generateRoute: (args, routes) ->
    ###
    Generate a route with exist routes.
    @param args {Object}
      isAbstract {Boolean}
      name {String}
      uri {String}
      onEnter {Function}
      resolve {Object}
        "resourceName": {Promise<response.data>}
      component {React.Component}
      loadComponent {Function}
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
    @param name {String}
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
    @returns {String}
    ###
    uri = route.uriTemplate
    query = {}
    for key, value of params
      if uri.indexOf("{#{key}}") >= 0
        uri = uri.replace "{#{key}}", value
      else if "?#{key}" in route.uriParamKeys
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
      "paramKey": {String}
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

  fetchResolveData: (route, params, reusableResolveData, history) ->
    ###
    Fetch data of the route.
    Note: When the user go to the other route before the promise was done, the old one will throw null.
    @param route {Route}
    @param params {Object} Params of the uri.
    @param reusableResolveData {Object}
      "route-name":
        "resolve-key": response
    @param history {history}
    @returns {Promise<Object>}
      "route-name":
        "resolve-key": response
    ###
    uri = "#{history.location.pathname}#{history.location.search}"
    routeChaining = route.parents.slice()
    routeChaining.push route
    taskInformation = []
    tasks = [
      if not route.component then route.loadComponent?() else null
      Promise.all(
        route.parents.map (parent) ->
          if not parent.component then parent.loadComponent?() else null
      )
    ]
    for route in routeChaining
      for key, value of route.resolve
        taskInformation.push
          routeName: route.name
          key: key
        if route.name of reusableResolveData and key of reusableResolveData[route.name]
          # use parent's data
          tasks.push reusableResolveData[route.name][key]
        else
          # fetch from the server
          tasks.push value(params)
    Promise.all(tasks).then ([component, parentComponents, responses...]) ->
      if uri isnt "#{history.location.pathname}#{history.location.search}"
        # The URL is changed.
        throw null

      # Lazy loading components.
      route.component = component.default or component if component
      route.parents.map (parent, index) ->
        if parentComponents[index]
          parent.component = parentComponents[index].default or parentComponents[index]

      result = {}
      for information, index in taskInformation
        result[information.routeName] ?= {}
        result[information.routeName][information.key] = responses[index]
      result
    .catch (error) ->
      if uri isnt "#{history.location.pathname}#{history.location.search}"
        # The URL is changed.
        throw null
      throw error

  flattenResolveData: (resolveData) ->
    ###
    Flatten resolve data.
    @param resolveData {Object}
    @returns {Object}
      "resolveResourceName": {Object}
    ###
    result = {}
    for routeName of resolveData
      for key, value of resolveData[routeName]
        result[key] = value
    result
