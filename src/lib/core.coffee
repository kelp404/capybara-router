queryString = require 'query-string'


core =
  historyListener: null
  history: null
  routes: []
  errorComponent: null
  views: []
  currentRoute: null
  isSkipNextHistoryChange: no
  promise: null  # fetch resolve data promise [history.action, previousRoute, previousParams, nextRoute, nextParams, props]
  lastParams: null
  lastResolveData: null
  eventHandlers:
    changeStart: []
    changeSuccess: []
    changeError: []

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
    ###
    @param args {object}
      history {history}
      routes {list<route>}
      errorComponent {React.Component}
    ###
    routes = []
    for route in args.routes
      routes.push core.generateRoute(route, routes)
    core.history = args.history
    core.routes = routes
    core.errorComponent = args.errorComponent
    core.views = []

    core.historyListener?()
    core.historyListener = core.history.listen core.onHistoryChange

    # fetch resolve data
    core.currentRoute = currentRoute = core.getCurrentRoute()
    params = core.parseRouteParams core.history.location, currentRoute
    core.broadcastStartEvent
      nextRoute: currentRoute
      nextParams: params

    core.promise = core.fetchResolveData(currentRoute, params, '', core.lastResolveData).then (resolveData) ->
      core.lastResolveData = resolveData
      props = core.flattenResolveData resolveData
      props.params = params
      routeChaining = currentRoute.parents.slice()
      routeChaining.push currentRoute
      core.views[0].routerView.dispatch
        route: routeChaining[0]
        props: props
      if routeChaining.length is 1
        core.broadcastSuccessEvent
          nextRoute: currentRoute
          nextParams: params
      Promise.all [
        null
        null
        null
        currentRoute
        params
        props
      ]
    .catch (error) ->
      if core.errorComponent
        core.views[0].name = null
        core.views[0].routerView.dispatch
          route:
            component: core.errorComponent
          props:
            error: error
      core.broadcastErrorEvent error

  onHistoryChange: (location, action) ->
    ###
    @param location {history.location}
    @param action {string|null} PUSH, REPLACE, POP, RELOAD, INITIAL
    ###
    if core.isSkipNextHistoryChange
      core.isSkipNextHistoryChange = no
      return

    previousRoute = core.currentRoute
    previousParams = core.lastParams
    nextRoute = core.findRoute location
    params = core.parseRouteParams location, nextRoute
    nextRouteChaining = nextRoute.parents.slice()
    nextRouteChaining.push nextRoute
    changeViewIndex = 0
    for route, index in nextRouteChaining when route.name isnt core.views[index].name
      changeViewIndex = index
      break
    isCancel = no
    core.broadcastStartEvent
      cancel: -> isCancel = yes
      action: action
      previousRoute: previousRoute
      previousParams: previousParams
      nextRoute: nextRoute
      nextParams: params
    if isCancel
      core.isSkipNextHistoryChange = yes
      history.back()
      return

    core.promise = core.fetchResolveData(nextRoute, params, core.views[changeViewIndex].name, core.lastResolveData).then (resolveData) ->
      core.currentRoute = nextRoute
      core.lastResolveData = resolveData
      props = core.flattenResolveData resolveData
      props.params = params
      core.views.splice changeViewIndex + 1
      core.views[changeViewIndex].name = nextRouteChaining[changeViewIndex].name
      core.views[changeViewIndex].routerView.dispatch
        route: nextRouteChaining[changeViewIndex]
        props: props
      if nextRouteChaining.length is changeViewIndex + 1
        core.broadcastSuccessEvent
          action: action
          previousRoute: previousRoute
          previousParams: previousParams
          nextRoute: nextRoute
          nextParams: params
      Promise.all [
        action
        previousRoute
        previousParams
        nextRoute
        params
        props
      ]
    .catch (error) ->
      if core.errorComponent
        core.views.splice 1
        core.views[0].name = null
        core.views[0].routerView.dispatch
          route:
            component: core.errorComponent
          props:
            error: error
      core.broadcastErrorEvent error

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

    core.promise.then ([action, previousRoute, previousParams, targetRoute, nextParams, props]) ->
      routeChaining = targetRoute.parents.slice()
      routeChaining.push targetRoute
      routerView.dispatch
        route: routeChaining[viewsIndex]
        props: props
      if routeChaining.length is viewsIndex + 1
        core.broadcastSuccessEvent
          action: action
          previousRoute: previousRoute
          previousParams: previousParams
          nextRoute: targetRoute
          nextParams: nextParams
      Promise.all [
        action
        previousRoute
        previousParams
        targetRoute
        nextParams
        props
      ]
    .catch (error) ->
      if core.errorComponent
        core.views.splice 1
        core.views[0].name = null
        core.views[0].routerView.dispatch
          route:
            component: core.errorComponent
          props:
            error: error
      core.broadcastErrorEvent error

  reload: ->
    ###
    Reload root router view.
    ###
    route = core.currentRoute
    params = core.parseRouteParams core.history.location, route
    isCancel = no
    core.broadcastStartEvent
      cancel: -> isCancel = yes
      action: 'RELOAD'
      previousRoute: route
      previousParams: params
      nextRoute: route
      nextParams: params
    return if isCancel

    core.promise = core.fetchResolveData(route, params, '', null).then (resolveData) ->
      core.lastResolveData = resolveData
      props = core.flattenResolveData resolveData
      props.params = params
      routeChaining = route.parents.slice()
      routeChaining.push route
      core.views.splice 1
      for view, index in core.views
        view.routerView.dispatch
          route: routeChaining[index]
          props: props
      Promise.all [
        'RELOAD'
        route
        params
        route
        params
        props
      ]
    .catch (error) ->
      if core.errorComponent
        core.views.splice 1
        core.views[0].name = null
        core.views[0].routerView.dispatch
          route:
            component: core.errorComponent
          props:
            error: error
      core.broadcastErrorEvent error

  go: (args = {}) ->
    ###
    @param args {object}
      1. use href:
        href {string}
      2. use route name with params:
        name {string}
        params {object}
    ###
    if args.href
      if "#{core.history.location.pathname}#{core.history.location.search}" is args.href
        core.reload()
      else
        core.history.push args.href
    else
      route = core.findRouteByName args.name, core.routes
      href = core.generateHref route, args.params
      if "#{core.history.location.pathname}#{core.history.location.search}" is href
        core.reload()
      else
        core.history.push href

  broadcastStartEvent: (args = {}) ->
    ###
    @params args {object}
      action {string}  PUSH, REPLACE, POP, RELOAD, INITIAL
      cancel {function}  Eval this function to rollback history.
      previousRoute {Route}
      previousParams {object|null}
      nextRoute {Route}
      nextParams {object|null}
    ###
    if args.action?
      fromState =
        name: args.previousRoute.name
        params: args.previousParams ? {}
    else
      args.action = 'INITIAL'
      fromState = null
    toState =
      name: args.nextRoute.name
      params: args.nextParams ? {}
    for handler in core.eventHandlers.changeStart
      handler.func args.action, toState, fromState, args.cancel
  broadcastSuccessEvent: (args = {}) ->
    ###
    @params args {object}
      action {string}  PUSH, REPLACE, POP, RELOAD, INITIAL
      previousRoute {Route}
      previousParams {object|null}
      nextRoute {Route}
      nextParams {object|null}
    ###
    if args.action?
      fromState =
        name: args.previousRoute.name
        params: args.previousParams ? {}
    else
      args.action = 'INITIAL'
      fromState = null
    toState =
      name: args.nextRoute.name
      params: args.nextParams ? {}
    for handler in core.eventHandlers.changeSuccess
      handler.func args.action, toState, fromState
  broadcastErrorEvent: (error) ->
    ###
    @params error {Error}
    ###
    for handler in core.eventHandlers.changeError
      handler.func error

  listen: (event, func) ->
    ###
    @param event {string}  "ChangeStart|ChangeSuccess|ChangeError"
    @param func {function}
      ChangeStart: (action, toState, fromState, cancel) ->
      ChangeSuccess: (action, toState, fromState) ->
      ChangeError: (error) ->
    @returns {function}  Eval this function to stop listen.
    ###
    table =
      ChangeStart: core.eventHandlers.changeStart
      ChangeSuccess: core.eventHandlers.changeSuccess
      ChangeError: core.eventHandlers.changeError
    handlers = table[event]
    if not handlers?
      throw new Error('event type error')
    id = Math.random().toString(36).substr(2)
    handlers.push
      id: id
      func: func
    ->
      for handler, index in handlers when handler.id is id
        handlers.splice index, 1
        break

  getCurrentRoute: ->
    ###
    Get the current route via core.history and core.routes.
    @returns {Route}
    ###
    core.findRoute core.history.location

  fetchResolveData: (route, params, reloadFrom = '', lastResolveData = {}) ->
    ###
    @param route {Route}
    @param params {object}
    @param reloadFrom {string} Reload data from this route name.
    @param lastResolveData {object}
      "route-name":
        "resolve-key": response
    @returns {promise<object>}
      "route-name":
        "resolve-key": response
    ###
    routeChaining = route.parents.slice()
    routeChaining.push route
    taskKeys = []
    tasks = []
    for route in routeChaining
      if not reloadFrom or route.name.indexOf(reloadFrom) is 0
        # fetch from the server
        for key, value of route.resolve
          taskKeys.push JSON.stringify(routeName: route.name, key: key)
          tasks.push value(params)
      else
        # use cache data
        for key, value of route.resolve
          taskKeys.push JSON.stringify(routeName: route.name, key: key)
          if route.name of lastResolveData and key of lastResolveData[route.name]
            tasks.push lastResolveData[route.name][key]
          else
            tasks.push value(params)
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
      for key, value of resolveData[routeName]
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

  generateHref: (route, params = {}) ->
    ###
    @param route {Route}
    @param params {object}
    @returns {string}
    ###
    href = route.hrefTemplate
    query = {}
    for key, value of params
      if href.indexOf("{#{key}}") >= 0
        href = href.replace "{#{key}}", value
      else
        query[key] = value
    if Object.keys(query).length
      "#{href}?#{queryString.stringify(query)}"
    else
      href

  parseRouteParams: (location, route) ->
    ###
    @param location {history.location}
    @param route {Route}
    ###
    result = {}
    match = location.pathname.match new RegExp("^#{route.matchPattern}")
    parsedSearch = queryString.parse location.search
    uriParamsIndex = 0
    for paramKey in route.uriParamKeys
      if paramKey.indexOf('?') is 0
        paramKey = paramKey.substr 1
        result[paramKey] = parsedSearch[paramKey]
      else
        result[paramKey] = match[++uriParamsIndex]
    result

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
