utils = require './utils'
Route = require './route'


core =
  ###
  The browser history.
  ###
  history: null
  historyListener: null

  ###
  The router rules.
  {Array<Route>}
  ###
  routes: []

  ###
  The react component for the error page.
  ###
  errorComponent: null

  ###
  The display views. The first is the root view.
  ###
  views: []

  currentRoute: null
  isSkipNextHistoryChange: no
  isReloadNextHistoryChange: no

  ###
  Fetch resolve data promise.
  {Promise<[history.action, previousRoute, previousParams, nextRoute, nextParams, props]>}
  ###
  promise: null
  lastParams: null
  lastResolveData: null
  eventHandlers:
    changeStart: []
    changeSuccess: []
    changeError: []

  generateRoute: (args = {}, routes) ->
    ###
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
      parentRoute = core.findRouteByName args.name.substr(0, args.name.lastIndexOf('.')), routes
      new Route(args, parentRoute)
    else
      new Route(args)

  setup: (args = {}) ->
    ###
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
    params = utils.parseRouteParams core.history.location, currentRoute
    isCancel = no
    core.broadcastStartEvent
      cancel: -> isCancel = yes
      nextRoute: currentRoute
      nextParams: params
    if isCancel
      return

    core.promise = core.fetchResolveData(currentRoute, params, '', core.lastResolveData, core.history).then (resolveData) ->
      core.lastResolveData = resolveData
      props = core.flattenResolveData resolveData
      props.params = params
      routeChaining = currentRoute.parents.slice()
      routeChaining.push currentRoute
      routeChaining[0].onEnter? props
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
      return if not error
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
    isReloadNextHistoryChange = core.isReloadNextHistoryChange
    if isReloadNextHistoryChange
      core.isReloadNextHistoryChange = no
    if core.isSkipNextHistoryChange
      core.isSkipNextHistoryChange = no
      return

    previousRoute = core.currentRoute
    previousParams = core.lastParams
    nextRoute = core.findRoute location
    params = utils.parseRouteParams location, nextRoute
    nextRouteChaining = nextRoute.parents.slice()
    nextRouteChaining.push nextRoute
    changeViewIndex = 0
    if core.promise and not isReloadNextHistoryChange
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
      return

    core.promise = core.fetchResolveData(nextRoute, params, core.views[changeViewIndex]?.name, core.lastResolveData, core.history).then (resolveData) ->
      core.currentRoute = nextRoute
      core.lastResolveData = resolveData
      props = core.flattenResolveData resolveData
      props.params = params
      nextRouteChaining[changeViewIndex].onEnter? props
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
      return if not error
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
    if viewsIndex >= routeChaining.length
      # The template use <RouterView> but not register in the routes.
      return
    core.views.push
      name: routeChaining[viewsIndex].name
      routerView: routerView

    core.promise?.then ([action, previousRoute, previousParams, targetRoute, nextParams, props]) ->
      routeChaining = targetRoute.parents.slice()
      routeChaining.push targetRoute
      routeChaining[viewsIndex].onEnter? props
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
    params = utils.parseRouteParams core.history.location, route
    isCancel = no
    core.broadcastStartEvent
      cancel: -> isCancel = yes
      action: 'RELOAD'
      previousRoute: route
      previousParams: params
      nextRoute: route
      nextParams: params
    return if isCancel

    core.promise = core.fetchResolveData(route, params, '', {}, core.history).then (resolveData) ->
      core.lastResolveData = resolveData
      props = core.flattenResolveData resolveData
      props.params = params
      routeChaining = route.parents.slice()
      routeChaining.push route
      core.views.splice 1
      for view, index in core.views
        routeChaining[index].onEnter? props
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
      return if not error
      if core.errorComponent
        core.views.splice 1
        core.views[0].name = null
        core.views[0].routerView.dispatch
          route:
            component: core.errorComponent
          props:
            error: error
      core.broadcastErrorEvent error

  go: (target, options = {}) ->
    ###
    @param target {string|Object}
      1. {string}:
        The target is the URI.
      2. {Object}:
        name {string}
        params {Object}
    @param options {Object}
      replace {bool}
      reload {bool}
    ###
    core.isReloadNextHistoryChange = yes if options.reload
    if typeof(target) is 'string'
      if "#{core.history.location.pathname}#{core.history.location.search}" is target
        core.reload()
      else if options.replace
        core.history.replace target
      else
        core.history.push target
    else
      route = core.findRouteByName target.name, core.routes
      uri = utils.generateUri route, target.params
      if "#{core.history.location.pathname}#{core.history.location.search}" is uri
        core.reload()
      else if options.replace
        core.history.replace uri
      else
        core.history.push uri

  broadcastStartEvent: (args = {}) ->
    ###
    @params args {Object}
      action {string}  PUSH, REPLACE, POP, RELOAD, INITIAL
      cancel {function}  Eval this function to rollback history.
      previousRoute {Route}
      previousParams {Object|null}
      nextRoute {Route}
      nextParams {Object|null}
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
    @params args {Object}
      action {string}  PUSH, REPLACE, POP, RELOAD, INITIAL
      previousRoute {Route}
      previousParams {Object|null}
      nextRoute {Route}
      nextParams {Object|null}
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
    Listen the change event.
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

  fetchResolveData: (route, params, reloadFrom = '', lastResolveData, history) ->
    ###
    Fetch data of the route.
    Note: When the user go to the other route before the promise was done, the old one will throw null.
    @param route {Route}
    @param params {Object} Params of the uri.
    @param reloadFrom {string} Reload data from this route name.
    @param lastResolveData {Object}
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
    tasks = []
    for route in routeChaining
      if not reloadFrom or route.name.indexOf(reloadFrom) is 0
        # fetch from the server
        for key, value of route.resolve
          taskInformation.push
            routeName: route.name
            key: key
          tasks.push value(params)
      else
        # use cache data
        for key, value of route.resolve
          taskInformation.push
            routeName: route.name
            key: key
          if route.name of lastResolveData and key of lastResolveData[route.name]
            tasks.push lastResolveData[route.name][key]
          else
            tasks.push value(params)
    Promise.all(tasks).then (responses) ->
      if uri isnt "#{history.location.pathname}#{history.location.search}"
        # The URL is changed.
        throw null
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
    Flatten resolve data and append a random key for the react component.
    @params resolveData {Object}
    @returns {Object}
      "key": {string}
      "resolveResourceName": {Object}
    ###
    result =
      key: Math.random().toString(36).substr(2)
    for routeName of resolveData
      for key, value of resolveData[routeName]
        result[key] = value
    result

  findRouteByName: (name, routes) ->
    ###
    Find the route in routes by the route name.
    @param name {string}
    @param routes {Array<Route>}
    @returns {Route}
    ###
    for route in routes when name is route.name
      return route
    throw new Error("Not found the route called #{name}.")

  findRoute: (location) ->
    ###
    Find the route in core.routes by the location.
    @param location {location}
    @returns {Route}
    ###
    for route in core.routes when route.matchReg.test(location.pathname)
      continue if route.isAbstract
      return route
    throw new Error("Please define the not found page {uri: '.*'}.")

module.exports = core
