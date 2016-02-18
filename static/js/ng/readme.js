App.controller('README', function($scope) {
  $scope.README = $scope.spec.info['x-lucy/readme'] || $scope.spec.info.description;
  $scope.showSections = Array.isArray($scope.README);
  console.log('r', $scope.README, $scope.showSections);
})
