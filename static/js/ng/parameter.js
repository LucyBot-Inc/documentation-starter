var COOKIE_TIMEOUT_MS = 900000;
var LOCAL_STORAGE_KEY = 'API_KEYS:' + window.location.pathname;
var DEFAULT_KEYS = {
  'api.gettyimages.com': ['Api-Key'],
  'api.datumbox.com': ['api_key'],
  'netlicensing.labs64.com': [{username: 'demo', password: 'demo'}]
}

var getKeys = function() {
  var stored = '{}';
  if (OPTIONS.credentialCookie) {
    var cookieKey = OPTIONS.credentialCookie;
    var cookies = document.cookie.split(';').map(function(c) {return c.trim()});
    var credCookie = cookies.filter(function(c) {
      return c.indexOf(cookieKey) === 0;
    })[0];
    if (credCookie) stored = credCookie.substring(cookieKey.length + 1);
  } else {
    stored = localStorage.getItem(LOCAL_STORAGE_KEY) || stored;
  }
  return JSON.parse(stored);
}

var setKeys = function(keys) {
  keys = JSON.stringify(keys);
  if (OPTIONS.credentialCookie) {
    var now = new Date();
    var expires = new Date(now.getTime() + COOKIE_TIMEOUT_MS);
    var cookie = OPTIONS.credentialCookie + '=' + keys + '; expires=' + expires.toUTCString() + '; Path=/';
    document.cookie = cookie;
  } else {
    localStorage.setItem(LOCAL_STORAGE_KEY, keys);
  }
}

App.controller('Keys', function($scope) {
  var refreshKeys = function(noApply) {
    $scope.keys = getKeys();
    if (!noApply) $scope.$apply();
    if (window.credentialFields) {
      var haveAll = true;
      window.credentialFields.forEach(function(f) {
        if (!$scope.keys[f]) haveAll = false;
      })
      if (!haveAll) setTimeout(refreshKeys, 1000);
    }
  }
  refreshKeys(true);
  $scope.checks = {
    saveKeys: true
  }
  $scope.changedKeys = Object.keys($scope.keys).length > 0;
  $scope.keyChanged = function() {
    $scope.changedKeys = true;
    $('#Console').scope().onAnswerChanged();
    if ($scope.checks.saveKeys) setKeys($scope.keys);
  }
  $scope.$watch('keys', $scope.keyChanged, true)
  $scope.saveChanged = function() {
    if (!$scope.checks.saveKeys) {
      localStorage.setItem(LOCAL_STORAGE_KEY, '{}');
    }
  }
  $scope.keyInputs = [];
  if ($scope.spec.securityDefinitions) {
    var addedOauth = false;
    for (var label in $scope.spec.securityDefinitions) {
      def = $scope.spec.securityDefinitions[label];
      if (def.type === 'apiKey') {
        $scope.keyInputs.push({
          name: def.name,
          label: label,
        });
      } else if (def.type === 'oauth2' && !addedOauth) {
        addedOauth = true;
        $scope.keyInputs.push({
          name: 'oauth2',
          label: 'OAuth2 Token',
        });
      } else if (def.type === 'basic') {
        $scope.keyInputs.push({
          name: 'username',
          label: 'Username',
        });
        $scope.keyInputs.push({
          name: 'password',
          label: 'Password',
        });
      }
    }
  }
  var defaultKeys = DEFAULT_KEYS[$scope.spec.host];
  (defaultKeys || []).forEach(function(def) {
    if (typeof def === 'string') {
      $scope.keys[def] = $scope.keys[def] || 'lucybot-key';
    } else {
      for (keyName in def) {
        $scope.keys[keyName] = $scope.keys[keyName] || def[keyName];
      }
    }
  })
});

App.controller('Parameter', function($scope) {
  if ($scope.keys && $scope.parameter.name in $scope.keys) {
    $scope.model = $scope.keys;
  } else {
    $scope.model = $scope.answers;
  }
  $scope.inputType = 'text';
  var type = $scope.parameter.type;
  if ($scope.parameter.in === 'body') {
    $scope.inputType = 'body';
  } else if (type === 'array') {
    if ($scope.parameter.enum) {
      $scope.inputType = 'checkboxes';
    } else {
      $scope.inputType = 'dynamicArray';
    }
  } else if ($scope.parameter.enum) {
    $scope.inputType = 'dropdown';
  } else if (type === 'number' || type === 'integer') {
    $scope.inputType = 'number';
  }

  $scope.isFirstParameterOfGroup = function() {
    var match = $scope.parameter.name.match(/^(\w+)\[/);
    if (!match) return false;
    $scope.groupName = match[1];
    if ($scope.$index === 0) return true;
    var prevParam = $scope.activeRoute.operation.parameters[$scope.$index - 1];
    console.log('prev', prevParam.name, $scope.groupName)
    if (prevParam.name.indexOf($scope.groupName) === 0) return false;
    return true;
  }
});

App.controller('Checkboxes', function($scope) {
  $scope.chosen = {};
  var defaults = $scope.model[$scope.parameter.name];
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
    $scope.model[$scope.parameter.name] = values;
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
    $scope.model[$scope.parameter.name] = $scope.items.map(function(item) {return item.value});
    outerChanged();
  }
});

App.controller('BodyInput', function($scope) {
  $scope.body = {};
  var outerChanged = $scope.onAnswerChanged;
  var errTimeout = null;
  $scope.onAnswerChanged = function() {
    $scope.bodyParseError = '';
    if (errTimeout) {
      clearTimeout(errTimeout);
      errTimeout = null;
    }
    var bodyObj = JSON.parse(JSON.stringify($scope.body));
    for (key in $scope.parameter.schema.properties) {
      var schema = $scope.parameter.schema.properties[key];
      if (schema.type !== 'string' && bodyObj[key]) {
        try {
          bodyObj[key] = JSON.parse(bodyObj[key]);
        } catch (e) {
          if (errTimeout) clearTimeout(errTimeout);
          var msg = 'Error parsing JSON field ' + key;
          errTimeout = setTimeout(function() {
            $scope.bodyParseError = msg;
          }, 1000);
        }
      }
    }
    $scope.model[$scope.parameter.name] = JSON.stringify(bodyObj);
    outerChanged();
  }
})
