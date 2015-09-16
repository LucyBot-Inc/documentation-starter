var maybeAddExternalDocs = function(description, externalDocs) {
  if (!externalDocs || !externalDocs.url) return description;
  if (description) description += '\n\n';
  else description = '';
  var url = document.createElement('a');
  url.href = externalDocs.url;
  description += 'Read more at [' + url.hostname + '](' + url.href + ')';
  return description;
}

App.controller('Portal', function($scope, spec) {
  $scope.activePage = 'documentation';
  $scope.$watch('activePage', function(page) {
    mixpanel.track('set_page_' + page, {
      url: SPEC_URL,
    })
  })
  $scope.stripHtml = function(str) {
    return str.replace(/<(?:.|\n)*?>/gm, '');
  }

  var PARSER_OPTS = {
    strictValidation: false,
    validateSchema: false
  }
  spec.then(function(spec) {
    $scope.routes = [];
    $scope.setSpec = function(spec) {
      $scope.spec = spec;
      var info = $scope.spec.info = $scope.spec.info || {};
      info.description = maybeAddExternalDocs(info.description, $scope.spec.externalDocs);
      for (path in $scope.spec.paths) {
        var pathParams = $scope.spec.paths[path].parameters || [];
        for (method in $scope.spec.paths[path]) {
          if (method === 'parameters') continue;
          var operation = $scope.spec.paths[path][method];
          operation.parameters = (operation.parameters || []).concat(pathParams);
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
    swagger.parser.parse(spec.data, PARSER_OPTS, function(err, api) {
      if (err) console.log(err);
      api = api || spec.data;
      mixpanel.track('get_swagger', {
        host: api.host,
        url: SPEC_URL,
      });
      $scope.setSpec(api);
      $scope.$apply();
    })

    $scope.setActiveTag = function(tag) {
      $scope.activeTag = tag;
      if ($scope.activePage === 'documentation') {
        $('#Docs').scope().scrollTo(0);
      }
    }

    $scope.openConsole = function(route) {
      if (route) $('#Console').scope().setActiveRoute(route);
      $scope.activePage = 'console';
    }

    $scope.openDocumentation = function(idx) {
      $scope.activePage = 'documentation';
      if (idx || idx === 0) {
        $('#Docs').scope().routesFiltered = $scope.routes;
        setTimeout(function() {
          $('#Docs').scope().scrollTo(idx);
        }, 800);
      }
    }
  })
});
