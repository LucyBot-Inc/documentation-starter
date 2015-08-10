var maybeAddExternalDocs = function(description, externalDocs) {
  if (!externalDocs || !externalDocs.url) return description;
  if (description) description += '\n\n';
  else description = '';
  var url = document.createElement('a');
  url.href = externalDocs.url;
  description += 'Read more at [' + url.hostname + '](' + url.href + ')';
  return description;
}

App.controller('Portal', function($scope) {
  $scope.routes = [];
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
      $scope.routes.push(route);
    }
  }
  $scope.routes = $scope.routes.sort(SORT_ROUTES);

  $scope.setActiveTag = function(tag) {
    $scope.activeTag = tag;
  }
});
