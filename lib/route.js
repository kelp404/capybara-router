(function() {
  var Route;

  module.exports = Route = (function() {
    function Route(args, parent) {

      /*
      @param args {Object}
        name {String}
        uri {String}
        isAbstract {Boolean}
        onEnter {Function}
        resolve {Object}
          "resourceName": {Promise<response.data>}
        component {React.Component}
      @param parent {Route}
      @returns {Object}
        name {String}
        uri {String}
        isAbstract {Boolean}
        onEnter {Function}
        resolve {Object}
          "resourceName": {Promise<response.data>}
        component {React.Component}
        -----------------------------------------------------
        uriParamKeys {Array<string>}  ex: ['projectId', '?index']  (with parents)
        matchPattern {String}  ex: '/projects/([\w-]{20})'  (with parents)
        uriTemplate {String} The template for generating the uri.  ex: '/projects/{projectId}'  (with parents)
        matchReg {RegExp} The regexp for .match()  ex: /^\/projects\/([\w-]{20})$/  (with parents)
        parents {Array<Route>}
       */
      var i, j, len, len1, match, ref, ref1, ref2, ref3, ref4, ref5, ref6, uriParamPattern, uriPattern, uriQueryString, uriTemplate;
      this.name = args.name;
      this.uri = args.uri;
      this.isAbstract = (ref = args.isAbstract) != null ? ref : false;
      this.onEnter = args.onEnter;
      this.resolve = (ref1 = args.resolve) != null ? ref1 : {};
      this.component = args.component;
      if (parent) {
        this.uriParamKeys = ((ref2 = parent.uriParamKeys) != null ? ref2.slice() : void 0) || [];
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
      ref4 = (ref3 = args.uri.match(/\{[\w]+:(?:(?!(\/|\?\w+)).)+/g)) != null ? ref3 : [];
      for (i = 0, len = ref4.length; i < len; i++) {
        uriParamPattern = ref4[i];
        match = uriParamPattern.match(/^\{([\w]+):((?:(?!\/).)*)\}$/);
        this.uriParamKeys.push(match[1]);
        uriPattern = uriPattern.replace(uriParamPattern, "(" + match[2] + ")");
        uriTemplate = uriTemplate.replace(uriParamPattern, "{" + match[1] + "}");
      }
      ref6 = (ref5 = args.uri.match(/\?[\w-]+/g)) != null ? ref5 : [];
      for (j = 0, len1 = ref6.length; j < len1; j++) {
        uriQueryString = ref6[j];
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
