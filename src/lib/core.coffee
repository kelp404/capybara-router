core =
  historyListener: null
  history: null
  routes: []
  views: []
  currentRoute: null
  promise: null  # fetch resolve data promise
  lastResolveData: null

  generateRoute: (args = {}, routes) ->
    ###
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
    ###
    args.resolve ?= {}
    if args.name.indexOf('.') > 0
      # there are parents of this route
      parentRoute = core.findRouteByName args.name.substr(0, args.name.lastIndexOf('.')), routes
      args.uriParamKeys = parentRoute.uriParamKeys.slice()
      args.matchPattern = parentRoute.matchPattern
      args.hrefTemplate = parentRoute.hrefTemplate
      args.parents = parentRoute.parents.slice()
      args.parents.push parentRoute
    else
      args.uriParamKeys = []
      args.matchPattern = ''
      args.hrefTemplate = ''
      args.parents = []

    uriPattern = args.uri
    hrefTemplate = args.uri
    uriParamPatterns = args.uri.match /\{[\w]+:(?:(?!\/).)+/g
    # args.uri: '/projects/{projectId:[\w-]{20}}'
    # uriParamPatterns: ['{projectId:[\w-]{20}}']
    for uriParamPattern in uriParamPatterns ? []
      # uriParamPattern: '{projectId:[\w-]{20}}'
      match = uriParamPattern.match /^\{([\w]+):((?:(?!\/).)*)\}$/
      # match: ['{projectId:[w-]{20}}', 'projectId', '[w-]{20}', ...]
      args.uriParamKeys.push match[1]
      uriPattern = uriPattern.replace uriParamPattern, "(#{match[2]})"
      # uriPattern: '/projects/([w-]{20})'
      hrefTemplate = hrefTemplate.replace uriParamPattern, "{#{match[1]}}"
      # hrefTemplate: '/projects/{projectId}'
    for uriQueryString in args.uri.match(/\?[\w-]+/g) ? []
      uriPattern = uriPattern.replace uriQueryString, ''
      hrefTemplate = hrefTemplate.replace uriQueryString, ''
      args.uriParamKeys.push uriQueryString
    args.matchPattern += uriPattern
    args.matchReg = new RegExp("^#{args.matchPattern}$")
    args.hrefTemplate += hrefTemplate
    args

  setup: (args = {}) ->
    routes = []
    for route in args.routes
      routes.push core.generateRoute(route, routes)
    core.history = args.history
    core.routes = routes
    core.views = []

    core.historyListener?()
    core.historyListener = core.history.listen (location, action) ->
      # todo: fetch data then update router view
      console.log action, location
      route = core.findRoute location

    # fetch resolve data
    core.currentRoute = currentRoute = core.getCurrentRoute()
    core.promise = core.fetchResolveData(currentRoute, '', core.lastResolveData).then (resolveData) ->
      core.lastResolveData = resolveData
      props = core.flattenResolveData resolveData
      routeChaining = currentRoute.parents.slice()
      routeChaining.push currentRoute
      for view, index in core.views
        view.routerView.dispatch
          route: routeChaining[index]
          props: props
      Promise.all [
        currentRoute
        props
      ]

  registerRouterView: (routerView) ->
    ###
    RouterView will call this method in `componentWillMount`.
    @param routerView {RouterView}
    ###
    routeChaining = core.currentRoute.parents.slice()
    routeChaining.push core.currentRoute
    viewsIndex = core.views.length
    core.views.push
      name: routeChaining[viewsIndex].name
      routerView: routerView

    core.promise.then ([targetRoute, props]) ->
      routeChaining = targetRoute.parents.slice()
      routeChaining.push targetRoute
      routerView.dispatch
        route: routeChaining[viewsIndex]
        props: props
      Promise.all [
        targetRoute
        props
      ]

  reload: ->
    ###
    Reload root router view.
    ###
    route = core.currentRoute
    core.promise = core.fetchResolveData(route, '', null).then (resolveData) ->
      core.lastResolveData = resolveData
      props = core.flattenResolveData resolveData
      routeChaining = route.parents.slice()
      routeChaining.push route
      core.views.splice 1
      for view, index in core.views
        view.routerView.dispatch
          route: routeChaining[index]
          props: props
      Promise.all [
        route
        props
      ]

  go: (args = {}) ->
    if args.href
      if "#{core.history.location.pathname}#{core.history.location.search}" is args.href
        core.reload()
      else
        core.history.push args.href

  getCurrentRoute: ->
    ###
    Get the current route via core.history and core.routes.
    @returns {Route}
    ###
    core.findRoute core.history.location

  fetchResolveData: (route, reloadFrom = '', lastResolveData = {}) ->
    ###
    @param route {Route}
    @param reloadFrom {string} Reload data from this route name.
    @param lastResolveData {object}
      "route-name":
        "resolve-key": response
    @returns {promise<object>}
      "route-name":
        "resolve-key": response
    ###
    routeChaining = core.currentRoute.parents.slice()
    routeChaining.push core.currentRoute
    taskKeys = []
    tasks = []
    for route in routeChaining
      if not reloadFrom or route.name.indexOf(reloadFrom) is 0
        # fetch from the server
        for key, value of route.resolve
          taskKeys.push JSON.stringify(routeName: route.name, key: key)
          tasks.push value()
      else
        # use cache data
        for key, value of route.resolve
          taskKeys.push JSON.stringify(routeName: route.name, key: key)
          if route.name of lastResolveData and key of lastResolveData[route.name]
            tasks.push lastResolveData[route.name][key]
          else
            tasks.push value()
    Promise.all(tasks).then (responses) ->
      result = {}
      for taskKey, index in taskKeys
        taskInfo = JSON.parse taskKey
        result[taskInfo.routeName] ?= {}
        result[taskInfo.routeName][taskInfo.key] = responses[index]
      result

  flattenResolveData: (resolveData) ->
    result =
      key: Math.random().toString(36).substr(2)
    for routeName of resolveData
      for key, value of resolveData
        result[key] = value
    result

  findRouteByName: (name, routes) ->
    ###
    @param name {string}
    @param routes {list<Route>}
    @returns {Route|null}
    ###
    for route in routes when name is route.name
      return route
    null

  findRoute: (location) ->
    ###
    Find the route with location in core.routes.
    @param location {location}
    @returns {Route|null}
    ###
    for route in core.routes when route.matchReg.test(location.pathname)
      return route
    null

  mergeResolve: (route) ->
    ###
    @param route {Route}
    @returns {object}
    ###
    result = {}
    for key, value of route.resolve
      result[key] = value
    route.parents.map (parent) ->
      for key, value of parent.resolve
        result[key] = value
    result

module.exports = core
