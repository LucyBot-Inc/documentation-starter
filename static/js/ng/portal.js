App.controller('Portal', function($scope) {
  $scope.routes = [];
  for (path in $scope.spec.paths) {
    var pathParams = $scope.spec.paths[path].parameters || [];
    for (method in $scope.spec.paths[path]) {
      if (method === 'parameters') continue;
      var operation = $scope.spec.paths[path][method];
      operation.parameters = (operation.parameters || []).concat(pathParams);
      var route = {path: path, method: method, operation: operation};
      route.visual = operation.responses['200'] && operation.responses['200']['x-lucy/view'];
      $scope.routes.push(route);
    }
  }
  $scope.routes = $scope.routes.sort(SORT_ROUTES);
});
