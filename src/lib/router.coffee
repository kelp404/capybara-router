singleInstance = require './single-instance'
historyActions = require './constants/history-actions'
utils = require './utils'


module.exports = class Router
  constructor: (args) ->
    ###
    Setup the router.
    Note: Don't use 'key', 'params' as the key of the resolve.
    @param args {Object}
      history {history}
      routes {Array<routeConfig>}
        [
          name {String}
          uri {String}
          isAbstract {Boolean}
          onEnter {Function}
          resolve {Object}
            "resourceName": {Promise<response.data>}
          component {React.Component}
        ]
      errorComponent {React.Component}
    @properties
      history {history}
      historyUnsubscription {Function}
      routes {Array<Route>}
      errorComponent: {React.Component|null}
      views {Array<Object>}
        name: {String}
        routerView: {RouterView}
      eventHandlers {Object}
        changeStart: {Array<{id: {String}, func: function(action, toState, fromState, cancel)}>}
        changeSuccess: {Array<{id: {String}, func: function(action, toState, fromState)}>}
        changeError: {Array<{id: {String}, func: function(error)}>}
      currentRoute {Route}
      currentParams {Object}
      currentResolveData {Object}

      isReloadNextHistoryChange {Boolean}
      promise {Promise<['router-promise', history.action, previousRoute, previousParams, nextRoute, nextParams, props]>}
    ###
    singleInstance.setRouter @
    routes = []
    for route in args.routes
      routes.push utils.generateRoute(route, routes)
    @history = args.history
    @historyUnsubscription = @history.listen @onHistoryChange
    @routes = routes
    @errorComponent = args.errorComponent
    @views = []
    @eventHandlers =
      changeStart: []
      changeSuccess: []
      changeError: []

  start: =>
    ###
    Start dispatch routes.
    ###
    @currentRoute = currentRoute = @getCurrentRoute()
    @currentParams = currentParams = utils.parseRouteParams @history.location, currentRoute
    isCancel = no
    @broadcastStartEvent
      cancel: -> isCancel = yes
      nextRoute: currentRoute
      nextParams: currentParams
    if isCancel
      return

    @promise = utils.fetchResolveData(currentRoute, currentParams, {}, @history).then (resolveData) =>
      @currentResolveData = resolveData
      props = utils.flattenResolveData resolveData
      props.key = Math.random().toString(36).substr(2)
      props.params = currentParams
      routeChaining = currentRoute.parents.slice()
      routeChaining.push currentRoute
      routeChaining[0].onEnter? props
      @views[0].routerView.dispatch
        route: routeChaining[0]
        props: props
      if routeChaining.length is 1
        # The last one.
        @broadcastSuccessEvent
          nextRoute: currentRoute
          nextParams: currentParams
      Promise.all [
        'router-promise'
        null
        null
        null
        currentRoute
        currentParams
        props
      ]
    .catch (error) =>
      return if not error
      if @errorComponent
        @views[0].name = null
        @views[0].routerView.dispatch
          route:
            component: @errorComponent
          props:
            error: error
      @broadcastErrorEvent error

  onHistoryChange: (location, action) =>
    ###
    The changing event handler of the history.
    @param location {history.location}
    @param action {constants.historyActions} PUSH, REPLACE, POP
      https://github.com/ReactTraining/history#listening
    ###
    isReloadNextHistoryChange = @isReloadNextHistoryChange
    if isReloadNextHistoryChange
      @isReloadNextHistoryChange = no
      return

    previousRoute = @currentRoute
    previousParams = @currentParams
    nextRoute = @findRoute location
    params = utils.parseRouteParams location, nextRoute
    nextRouteChaining = nextRoute.parents.slice()
    nextRouteChaining.push nextRoute
    isBackToParent = previousRoute.name.indexOf("#{nextRoute.name}.") is 0
    reusableResolveData = {}
    changeViewIndex = 0
    if @promise and not isReloadNextHistoryChange
      # If the first change start event was be canceled, the promise is null.
      for route, index in nextRouteChaining
        if route.name isnt @views[index].name
          changeViewIndex = index
          break
        else
          previousPartialUri = utils.generateUri utils.findRouteByNameInRoutes(@views[index].name, @routes), previousParams
          nextPartialUri = utils.generateUri route, params
          if previousPartialUri isnt nextPartialUri
            changeViewIndex = index
            break
        reusableResolveData[route.name] = @currentResolveData[route.name]
    if isBackToParent and not changeViewIndex
      changeViewIndex = nextRouteChaining.length
    else
      isBackToParent = no
    isCancel = no
    @broadcastStartEvent
      cancel: -> isCancel = yes
      action: action
      previousRoute: previousRoute
      previousParams: previousParams
      nextRoute: nextRoute
      nextParams: params
    if isCancel
      return

    @promise = utils.fetchResolveData(nextRoute, params, reusableResolveData, @history).then (resolveData) =>
      @currentRoute = nextRoute
      @currentParams = params
      @currentResolveData = resolveData
      props = utils.flattenResolveData resolveData
      props.key = Math.random().toString(36).substr(2)
      props.params = params
      @views.splice changeViewIndex + 1
      if isBackToParent
        # The changeViewIndex is the destroy target.
        nextRouteChaining[changeViewIndex - 1].onEnter? props
        @views[changeViewIndex].name = null
        @views[changeViewIndex].routerView.dispatch
          route: component: null
      else
        nextRouteChaining[changeViewIndex].onEnter? props
        @views[changeViewIndex].name = nextRouteChaining[changeViewIndex].name
        @views[changeViewIndex].routerView.dispatch
          route: nextRouteChaining[changeViewIndex]
          props: props
      if (nextRouteChaining.length is changeViewIndex + 1) or isBackToParent
        @broadcastSuccessEvent
          action: action
          previousRoute: previousRoute
          previousParams: previousParams
          nextRoute: nextRoute
          nextParams: params
      Promise.all [
        'router-promise'
        action
        previousRoute
        previousParams
        nextRoute
        params
        props
      ]
    .catch (error) =>
      return if not error
      if @errorComponent
        @views.splice 1
        @views[0].name = null
        @views[0].routerView.dispatch
          route:
            component: @errorComponent
          props:
            error: error
      @broadcastErrorEvent error

  registerRouterView: (routerView) =>
    ###
    RouterView will call this method in `componentWillMount`.
    @param routerView {RouterView}
    ###
    routeChaining = @currentRoute.parents.slice()
    routeChaining.push @currentRoute
    viewsIndex = @views.length
    if viewsIndex >= routeChaining.length
      @views.push
        name: null
        routerView: routerView
      return
    @views.push
      name: routeChaining[viewsIndex].name
      routerView: routerView

    @promise?.then ([tag, action, previousRoute, previousParams, targetRoute, nextParams, props]) =>
      return if tag isnt 'router-promise'
      routeChaining = targetRoute.parents.slice()
      routeChaining.push targetRoute
      routeChaining[viewsIndex].onEnter? props
      routerView.dispatch
        route: routeChaining[viewsIndex]
        props: props
      if routeChaining.length is viewsIndex + 1
        @broadcastSuccessEvent
          action: action
          previousRoute: previousRoute
          previousParams: previousParams
          nextRoute: targetRoute
          nextParams: nextParams
      Promise.all [
        tag
        action
        previousRoute
        previousParams
        targetRoute
        nextParams
        props
      ]
    .catch (error) =>
      return if not error
      if @errorComponent
        @views.splice 1
        @views[0].name = null
        @views[0].routerView.dispatch
          route:
            component: @errorComponent
          props:
            error: error
      @broadcastErrorEvent error

  reload: =>
    ###
    Reload root router view.
    ###
    route = @currentRoute
    params = utils.parseRouteParams @history.location, route
    isCancel = no
    @broadcastStartEvent
      cancel: -> isCancel = yes
      action: historyActions.RELOAD
      previousRoute: route
      previousParams: params
      nextRoute: route
      nextParams: params
    return if isCancel

    @promise = utils.fetchResolveData(route, params, {}, @history).then (resolveData) =>
      @currentResolveData = resolveData
      props = utils.flattenResolveData resolveData
      props.key = Math.random().toString(36).substr(2)
      props.params = params
      routeChaining = route.parents.slice()
      routeChaining.push route
      @views.splice 1
      for view, index in @views
        routeChaining[index].onEnter? props
        view.routerView.dispatch
          route: routeChaining[index]
          props: props
      Promise.all [
        'router-promise'
        historyActions.RELOAD
        route
        params
        route
        params
        props
      ]
    .catch (error) =>
      return if not error
      if @errorComponent
        @views.splice 1
        @views[0].name = null
        @views[0].routerView.dispatch
          route:
            component: @errorComponent
          props:
            error: error
      @broadcastErrorEvent error

  go: (target, options = {}) =>
    ###
    Push/Replace a state to the history.
    If the new URI and the old one are same, it will reload the current page.
    @param target {string|Object}
      1. {String}:
        The target is the URI.
      2. {Object}:
        name {String}
        params {Object}
    @param options {Object}
      replace {Boolean}
      reload {Boolean}
    ###
    @isReloadNextHistoryChange = yes if options.reload
    if typeof(target) is 'string'
      if "#{@history.location.pathname}#{@history.location.search}" is target
        @reload()
      else if options.replace
        @history.replace target
      else
        @history.push target
    else
      route = utils.findRouteByNameInRoutes target.name, @routes
      uri = utils.generateUri route, target.params
      if "#{@history.location.pathname}#{@history.location.search}" is uri
        @reload()
      else if options.replace
        @history.replace uri
      else
        @history.push uri

  renderError: (error) =>
    ###
    Render the error component.
    @param error {Error}
    ###
    return if not @errorComponent
    @views.splice 1
    @views[0].name = null
    @views[0].routerView.dispatch
      route:
        component: @errorComponent
      props:
        error: error

  broadcastStartEvent: (args) =>
    ###
    @param args {Object}
      action {constants.historyActions|null}  PUSH, REPLACE, POP, RELOAD, INITIAL (The default is INITIAL.)
      cancel {Function}  Eval this function to rollback history.
      previousRoute {Route}
      previousParams {Object|null}
      nextRoute {Route}
      nextParams {Object|null}
    ###
    args.action ?= historyActions.INITIAL
    if args.action is historyActions.INITIAL
      fromState = null
    else
      fromState =
        name: args.previousRoute.name
        params: args.previousParams ? {}
    toState =
      name: args.nextRoute.name
      params: args.nextParams ? {}
    for handler in @eventHandlers.changeStart
      handler.func args.action, toState, fromState, args.cancel
  broadcastSuccessEvent: (args) =>
    ###
    @param args {Object}
      action {constants.historyActions|null}  PUSH, REPLACE, POP, RELOAD, INITIAL (The default is INITIAL.)
      previousRoute {Route}
      previousParams {Object|null}
      nextRoute {Route}
      nextParams {Object|null}
    ###
    args.action ?= historyActions.INITIAL
    if args.action is historyActions.INITIAL
      fromState = null
    else
      fromState =
        name: args.previousRoute.name
        params: args.previousParams ? {}
    toState =
      name: args.nextRoute.name
      params: args.nextParams ? {}
    for handler in @eventHandlers.changeSuccess
      handler.func args.action, toState, fromState
  broadcastErrorEvent: (error) =>
    ###
    @param error {Error}
    ###
    for handler in @eventHandlers.changeError
      handler.func error

  listen: (event, func) =>
    ###
    Listen the change event.
    @param event {String}  "ChangeStart|ChangeSuccess|ChangeError"
    @param func {Function}
      ChangeStart: (action, toState, fromState, cancel) ->
      ChangeSuccess: (action, toState, fromState) ->
      ChangeError: (error) ->
    @returns {Function}  Eval this function to stop listen.
    ###
    table =
      ChangeStart: @eventHandlers.changeStart
      ChangeSuccess: @eventHandlers.changeSuccess
      ChangeError: @eventHandlers.changeError
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

  getCurrentRoute: =>
    ###
    Get the current route via @history and @routes.
    @returns {Route}
    ###
    @findRoute @history.location

  generateUri: utils.generateUri

  findRoute: (location) =>
    ###
    Find the route in @routes by the location.
    @param location {location}
    @returns {Route}
    ###
    for route in @routes when route.matchReg.test(location.pathname)
      continue if route.isAbstract
      return route
    throw new Error("Please define the not found page {uri: '.*'}.")
