App.controller('Input', function($scope) {
  if ($scope.keys && $scope.input.name in $scope.keys) {
    $scope.model = $scope.keys;
  } else {
    $scope.model = $scope.answers;
  }
})

App.controller('Checkboxes', function($scope) {
  $scope.chosen = {};
  var defaults = $scope.model[$scope.input.name];
  if (defaults) {
    defaults.forEach(function(d) {
      $scope.chosen[d] = true;
    })
  }
  var outerChanged = $scope.onAnswerChanged;
  $scope.onAnswerChanged = function() {
    var values = Object.keys($scope.chosen).filter(
      function(k) {return $scope.chosen[k]}
    );
    $scope.model[$scope.input.name] = values;
    outerChanged();
  }
})

App.controller('DynamicArray', function($scope) {
  $scope.items = [];
  $scope.addItem = function() {
    $scope.items.push({});
  };
  $scope.removeItem = function(index) {
    $scope.items = $scope.items.filter(function(item, i) { return i !== index })
    $scope.onAnswerChanged();
  }

  var outerChanged = $scope.onAnswerChanged;
  $scope.onAnswerChanged = function() {
    $scope.model[$scope.input.name] = $scope.items.map(function(item) {return item.value});
    outerChanged();
  }
})
