App.controller('README', function($scope) {
  $scope.README = $scope.spec.info['x-lucy/readme'] || $scope.spec.info.description;
  $scope.showSections = Array.isArray($scope.README);
  if ($scope.showSections) {
    $scope.menuItems = $scope.README.map(function(r, idx) {
      return {
        title: r.title,
        target: '#ScrollTarget' + idx,
      }
    })
  }
})
