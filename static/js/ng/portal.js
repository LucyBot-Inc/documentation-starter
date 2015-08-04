App.controller('Portal', function($scope) {
  $scope.flatRoutes = [];
  for (path in $scope.spec.paths) {
    var pathParams = $scope.spec.paths[path].parameters || [];
    for (method in $scope.spec.paths[path]) {
      if (method === 'parameters') continue;
      route = $scope.spec.paths[path][method];
      route.parameters = (route.parameters || []).concat(pathParams);
      var flat = {path: path, method: method, route: route};
      flat.visual = route.responses['200'] && route.responses['200']['x-lucy/view'];
      $scope.flatRoutes.push(flat);
    }
  }
  $scope.flatRoutes = $scope.flatRoutes.sort(SORT_ROUTES);
});
