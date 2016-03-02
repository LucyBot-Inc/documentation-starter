App.controller('README', function($scope) {
  $scope.README = $scope.spec.info['x-lucy/readme'] || $scope.spec.info.description;
  $scope.showSections = Array.isArray($scope.README);
  if ($scope.showSections) {
    $scope.menuItems = $scope.README.map(function(r, idx) {
      for (var i = 0; i < 10; ++i) r.contents += idx + r.contents + ' ';
      return {
        title: r.title,
        targetID: '#README' + idx,
      }
    })
  }
})
