(function() {
  var Route;

  module.exports = Route = (function() {
    function Route(args, parent) {

      /*
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
       */
      var i, j, len, len1, match, ref, ref1, ref2, ref3, ref4, ref5, uriParamPattern, uriPattern, uriQueryString, uriTemplate;
      this.name = args.name;
      this.uri = args.uri;
      this.isAbstract = args.isAbstract;
      this.onEnter = args.onEnter;
      this.resolve = (ref = args.resolve) != null ? ref : {};
      this.component = args.component;
      if (parent) {
        this.uriParamKeys = ((ref1 = parent.uriParamKeys) != null ? ref1.slice() : void 0) || [];
        this.matchPattern = parent.matchPattern || '';
        this.uriTemplate = parent.uriTemplate || '';
        this.parents = parent.parents.slice();
        this.parents.push(parent);
      } else {
        this.uriParamKeys = [];
        this.matchPattern = '';
        this.uriTemplate = '';
        this.parents = [];
      }
      uriPattern = args.uri;
      uriTemplate = args.uri;
      ref3 = (ref2 = args.uri.match(/\{[\w]+:(?:(?!(\/|\?\w+)).)+/g)) != null ? ref2 : [];
      for (i = 0, len = ref3.length; i < len; i++) {
        uriParamPattern = ref3[i];
        match = uriParamPattern.match(/^\{([\w]+):((?:(?!\/).)*)\}$/);
        this.uriParamKeys.push(match[1]);
        uriPattern = uriPattern.replace(uriParamPattern, "(" + match[2] + ")");
        uriTemplate = uriTemplate.replace(uriParamPattern, "{" + match[1] + "}");
      }
      ref5 = (ref4 = args.uri.match(/\?[\w-]+/g)) != null ? ref4 : [];
      for (j = 0, len1 = ref5.length; j < len1; j++) {
        uriQueryString = ref5[j];
        uriPattern = uriPattern.replace(uriQueryString, '');
        uriTemplate = uriTemplate.replace(uriQueryString, '');
        this.uriParamKeys.push(uriQueryString);
      }
      this.matchPattern += uriPattern;
      this.matchReg = new RegExp("^" + this.matchPattern + "$");
      this.uriTemplate += uriTemplate;
    }

    return Route;

  })();

}).call(this);
