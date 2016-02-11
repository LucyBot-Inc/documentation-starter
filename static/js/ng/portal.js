var maybeAddExternalDocs = function(description, externalDocs) {
  if (!externalDocs || !externalDocs.url) return description;
  if (description) description += '\n\n';
  else description = '';
  var url = document.createElement('a');
  url.href = externalDocs.url;
  description += 'Read more at [' + url.hostname + '](' + url.href + ')';
  return description;
}

var maybeTruncateSummary = function(operation) {
  if (!operation.summary) return;
  if (operation.summary.length <= 120) return;
  if (operation.description) return;
  var firstSentence = operation.summary.split(/\.\s/)[0];
  if (firstSentence.length > 120) firstSentence = firstSentence.substring(0, 120) + '...';
  operation.description = operation.summary;
  operation.summary = firstSentence;
}

App.controller('Portal', function($scope, $location, spec) {
  $scope.MAX_HIGHLIGHT_LEN = 10000;
  var DEFAULT_PAGE = 'Documentation';
  $scope.isActive = function(page) {
    return ($location.path() || '/' + DEFAULT_PAGE).indexOf(page) === 1;
  }
  $scope.getRouteFromLocation = function() {
    var loc = $location.path();
    var match = loc.match(/^\/\w+\/(\w+)\/([^\/]*)/);
    if (!match) return;
    return {method: match[1], path: decodeURIComponent(match[2])};
  }
  $scope.stripHtml = function(str) {
    if (!str) return str;
    return str.replace(/<(?:.|\n)*?>/gm, '');
  }

  var PARSER_OPTS = {
    strictValidation: false,
    validateSchema: false
  }

  var initSecurity = function() {
    if ($scope.spec.securityDefinitions) {
      for (var label in $scope.spec.securityDefinitions) {
        def = $scope.spec.securityDefinitions[label];
        if (def.type === 'oauth2') {
          $scope.oauthDefinition = def;
          $scope.startOAuth = function() {
            $('#OAuth2').modal('show');
            mixpanel.track('prompt_oauth', {
              host: $scope.spec.host,
            });
          }
        }
      }
    }
  }

  var initRoutes = function() {
    for (path in $scope.spec.paths) {
      var pathParams = $scope.spec.paths[path].parameters || [];
      for (method in $scope.spec.paths[path]) {
        if (method === 'parameters') continue;
        var operation = $scope.spec.paths[path][method];
        operation.parameters = (operation.parameters || []).concat(pathParams);
        maybeTruncateSummary(operation);
        operation.description = maybeAddExternalDocs(operation.description, operation.externalDocs);
        operation.responses = operation.responses || {};
        var successResponse = operation.responses['200'] = operation.responses['200'] || {};
        if (successResponse.description === 'No response was specified') successResponse.description = '';
        if (!successResponse.description) successResponse.description = 'OK';
        var route = {path: path, method: method, operation: operation};
        route.visual = operation.responses['200'] && operation.responses['200']['x-lucy/view'];
        if (route.visual) $scope.hasVisualRoute = true;
        var joinSearchFields = function(fields) {
          return fields.filter(function(f) {return f}).join(' ').toLowerCase();
        }
        var searchFields = [
          route.path,
          route.method,
          route.operation.description,
          route.operation.summary,
        ];
        searchFields = searchFields.concat(route.operation.parameters.map(function(p) {
          var paramFields = [
            p.in,
            p.name,
            p.description,
          ];
          return joinSearchFields(paramFields);
        }));
        route.searchText = joinSearchFields(searchFields);
        $scope.routes.push(route);
      }
    }
    $scope.routes = $scope.routes.sort(SORT_ROUTES);
  }

  var initTags = function() {
    var uniqueTags = [];
    $scope.routes.forEach(function(route) {
      (route.operation.tags || []).forEach(function(t) {
        if (uniqueTags.indexOf(t) === -1) uniqueTags.push(t);
      })
    });
    $scope.spec.tags = $scope.spec.tags || [];
    uniqueTags.forEach(function(tag) {
      var needToAdd = true;
      $scope.spec.tags.forEach(function(existingTag) {
        if (tag === existingTag.name) needToAdd = false;
      })
      if (needToAdd) $scope.spec.tags.push({name: tag});
    })
    if ($scope.spec.tags.length) {
      $scope.routes.forEach(function(r) {
        r.operation.tags = r.operation.tags || ['default'];
      })
    }
  }

  spec.then(function(spec) {
    $scope.routes = [];
    $scope.setSpec = function(spec) {
      $scope.spec = spec;
      var info = $scope.spec.info = $scope.spec.info || {};
      info.description = maybeAddExternalDocs(info.description, $scope.spec.externalDocs);
      initRoutes();
      initTags();
      initSecurity();
    }
    var maybeHandleErr = function(err) {
      if (err) throw err;
    }
    var addBaseDefs = function(def, bases) {
      bases = bases || def.allOf || [];
      bases.forEach(function(base) {
        for (var propName in base.properties) {
          def.properties[propName] = base.properties[propName];
        }
        if (base.allOf) addBaseDefs(def, base.allOf);
      })
    }
    SwaggerParser.parse(spec.data, function(err, data) {
      if (maybeHandleErr(err)) return;
      SwaggerParser.dereference(data, function(err, data) {
        if (maybeHandleErr(err)) return;
        for (var name in data.definitions) {
          addBaseDefs(data.definitions[name]);
        }
        mixpanel.track('get_swagger', {
          host: data.host,
          url: SPEC_URL,
        });
        $scope.setSpec(data);
        $scope.$apply();
      });
    })

    $scope.setActiveTag = function(tag) {
      $scope.activeTag = tag;
      if ($location.path() === '/Documentation') {
        $('#Docs').scope().scrollTo(0);
      }
    }

    var promptedOAuth = false;
    $scope.openConsole = function(route) {
      var loc = '/Console';
      if (route) {
        $('#Console').scope().setActiveRoute(route);
        loc += '/' + route.method + '/' + encodeURIComponent(route.path);
      }
      if (!promptedOAuth && $scope.startOAuth) {
        promptedOAuth = true;
        $scope.startOAuth();
      }
      $location.path(loc);
    }

    $scope.openDocumentation = function(route) {
      var loc = '/Documentation';
      if (route) {
        $('#Docs').scope().query = '';
        loc += '/' + route.method + '/' + encodeURIComponent(route.path);
        setTimeout(function() {
          $('#Docs').scope().scrollToRoute(route);
        }, 800);
      }
      $location.path(loc);
    }

    $scope.openPage = function(page) {
      if (page === 'console') $scope.openConsole();
      else if (page === 'documentation') $scope.openDocumentation();
      $location.path('/' + page);
    }
  })
});
