var LOCAL_STORAGE_KEY = 'API_KEYS:' + window.location.href;
var DEFAULT_KEYS = {
  'api.gettyimages.com': ['Api-Key']
}
App.controller('Keys', function($scope) {
  var keys = localStorage.getItem(LOCAL_STORAGE_KEY) || '{}';
  $scope.keys = JSON.parse(keys) || {};
  $scope.checks = {
    saveKeys: true
  }
  $scope.changedKeys = Object.keys($scope.keys).length > 0;
  $scope.keyChanged = function() {
    $scope.changedKeys = true;
    $('#Console').scope().onAnswerChanged();
    if ($scope.checks.saveKeys) {
      var keys = JSON.stringify($scope.keys);
      localStorage.setItem(LOCAL_STORAGE_KEY, keys);
    }
  }
  $scope.saveChanged = function() {
    if (!$scope.checks.saveKeys) {
      localStorage.setItem(LOCAL_STORAGE_KEY, '{}');
    }
  }

  $scope.keyInputs = [];
  if ($scope.spec.securityDefinitions) {
    for (var label in $scope.spec.securityDefinitions) {
      def = $scope.spec.securityDefinitions[label];
      if (def.type === 'oauth2') {
        $('#OAuth2').scope().definition = def;
        $('#OAuth2').modal('show');
      }
      $scope.keyInputs.push({
        name: def.type === 'oauth2' ? 'oauth2' : def.name,
        label: label,
      });
      $scope.keys[name] = $scope.keys[name] || undefined;
    }
  }
  var defaultKeys = DEFAULT_KEYS[$scope.spec.host];
  (defaultKeys || []).forEach(function(def) {
    $scope.keys[def] = $scope.keys[def] || 'lucybot-key';
  })
});

App.controller('Parameter', function($scope) {
  if ($scope.keys && $scope.input.name in $scope.keys) {
    $scope.model = $scope.keys;
  } else {
    $scope.model = $scope.answers;
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
