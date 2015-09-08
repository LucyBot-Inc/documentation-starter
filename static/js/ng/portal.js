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
  var VISUAL_TAG = "Has Visual";
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
          var route = {path: path, method: method, operation: operation};
          route.visual = operation.responses['200'] && operation.responses['200']['x-lucy/view'];
          if (route.visual) {
            route.operation.tags = route.operation.tags || [];
            route.operation.tags.push(VISUAL_TAG);
            $scope.spec.tags = $scope.spec.tags || [];
            if ($scope.spec.tags.length === 0 || $scope.spec.tags[0].name !== VISUAL_TAG) {
              $scope.spec.tags.unshift({name: VISUAL_TAG});
            }
          }
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
      })
      $scope.setSpec(api);
      $scope.$apply();
    })

    $scope.setActiveTag = function(tag) {
      $scope.activeTag = tag;
    }
  })
});
