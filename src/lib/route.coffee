module.exports = class Route
  constructor: (args , parent) ->
    ###
    @params args {Object}
      name {string}
      uri {string}
      isAbstract {bool}
      onEnter {function}
      resolve {Object}
        "resourceName": {Promise<response.data>}
      component {React.Component}
    @param parent {Route}
    @returns {Object}
      name {string}
      uri {string}
      isAbstract {bool}
      onEnter {function}
      resolve {Object}
        "resourceName": {Promise<response.data>}
      component {React.Component}
      -----------------------------------------------------
      uriParamKeys {Array<string>}  ex: ['projectId', '?index']  (with parents)
      matchPattern {string}  ex: '/projects/([\w-]{20})'  (with parents)
      uriTemplate {string} The template for generating the uri.  ex: '/projects/{projectId}'  (with parents)
      matchReg {RegExp} The regexp for .match()  ex: /^\/projects\/([\w-]{20})$/  (with parents)
      parents {Array<Route>}
    ###
    @name = args.name
    @uri = args.uri
    @isAbstract = args.isAbstract ? false
    @onEnter = args.onEnter
    @resolve = args.resolve ? {}
    @component = args.component

    if parent
      @uriParamKeys = parent.uriParamKeys?.slice() or []
      @matchPattern = parent.matchPattern or ''
      @uriTemplate = parent.uriTemplate or ''
      @parents = parent.parents.slice()
      @parents.push parent
    else
      @uriParamKeys = []
      @matchPattern = ''
      @uriTemplate = ''
      @parents = []

    uriPattern = args.uri
    uriTemplate = args.uri
    # args.uri: '/projects/{projectId:[\w-]{20}}'
    for uriParamPattern in args.uri.match(/\{[\w]+:(?:(?!(\/|\?\w+)).)+/g) ? []
      # uriParamPattern: '{projectId:[\w-]{20}}'
      match = uriParamPattern.match /^\{([\w]+):((?:(?!\/).)*)\}$/
      # match: ['{projectId:[w-]{20}}', 'projectId', '[w-]{20}', ...]
      @uriParamKeys.push match[1]
      uriPattern = uriPattern.replace uriParamPattern, "(#{match[2]})"
      # uriPattern: '/projects/([w-]{20})'
      uriTemplate = uriTemplate.replace uriParamPattern, "{#{match[1]}}"
      # uriTemplate: '/projects/{projectId}'
    for uriQueryString in args.uri.match(/\?[\w-]+/g) ? []
      uriPattern = uriPattern.replace uriQueryString, ''
      uriTemplate = uriTemplate.replace uriQueryString, ''
      @uriParamKeys.push uriQueryString
    @matchPattern += uriPattern
    @matchReg = new RegExp("^#{@matchPattern}$")
    @uriTemplate += uriTemplate
