var PROXY_HOST = 'https://api.lucybot.com'
var getSeparatorFromFormat = function(format) {
  if (!format || format === 'csv' || format === 'multi') {
    return ',';
  } else if (format === 'tsv') {
    return '\t';
  } else if (format === 'ssv') {
    return ' ';
  } else if (format === 'pipes') {
    return '|';
  }
}

var oauthIsImplicit = function(defns) {
  for (def in defns) {
    var obj = defns[def];
    if (obj.type === 'oauth2' && obj.flow === 'implicit') return true;
  }
  return false;
}

App.controller('Console', function($scope) {
  $scope.callOnChange = [];
  $scope.onAnswerChanged = function() {
    $scope.callOnChange.forEach(function(fn) {
      fn();
    })
  }

  $scope.setActiveRoute = function(route) {
    $scope.answers = {}
    route.operation.parameters.forEach(function(parameter) {
      if (parameter['x-consoleDefault']) {
        $scope.answers[parameter.name] = parameter['x-consoleDefault'];
      }
    })
    $scope.activeRoute = route;
    $scope.onAnswerChanged();
  }

  $scope.goToBestRoute = function() {
    var taggedRoutes= $scope.routes
        .filter(function(r) {
          console.log('rtags', r.tags, $scope.activeTag)
          return !$scope.activeTag || (r.operation.tags && r.operation.tags.indexOf($scope.activeTag.name) !== -1)
        })
    console.log('r', taggedRoutes);
    var startRoute = taggedRoutes.filter(function(r) {return r.visual})[0];
    startRoute = startRoute || taggedRoutes[0] || $scope.routes[0];
    $scope.setActiveRoute(startRoute);
  }
  $scope.goToBestRoute();

  $scope.getRequestParameters = function() {
    var protocol = $scope.spec.schemes.indexOf('https') !== -1 ? 'https' : 'http';
    var params = {
      protocol: protocol,
      domain: $scope.spec.host,
      method: $scope.activeRoute.method,
      returns: 'json'
    };
    var basePath = $scope.spec.basePath || '';
    if (basePath.lastIndexOf('/') === basePath.length - 1) {
      basePath = basePath.substring(0, basePath.length - 1);
    }
    params.path = basePath + $scope.activeRoute.path;
    var keys = $('#Keys').scope().keys;
    for (key in keys) {
      console.log('key', key, keys[key]);
      if (key === 'oauth2' && keys[key]) {
        if (oauthIsImplicit($scope.spec.securityDefinitions)) {
          params.query = {'access_token': keys[key]};
        } else {
          params.headers = {'Authorization': 'Bearer ' + keys[key]};
        }
      } else if (!$scope.answers[key]){
        $scope.answers[key] = keys[key];
      }
    }
    $scope.activeRoute.operation.parameters.forEach(function(parameter) {
      if (typeof $scope.answers[parameter.name] === 'undefined' || $scope.answers[parameter.name] === '') {
        if (parameter.in === 'path') {
          $scope.answers[parameter.name] = '';
        } else {
          return;
        }
      }
      var answer = '';
      if (parameter.type === 'array') {
        answer = $scope.answers[parameter.name] || [];
        var sep = getSeparatorFromFormat(parameter.collectionFormat);
        if (sep) answer = answer.join(sep);
      } else {
        answer = $scope.answers[parameter.name];
      }
      if (parameter.in === 'path') {
        params.path = params.path.replace('{' + parameter.name + '}', answer);
      } else if (parameter.in === 'header') {
        params.headers = params.headers || {};
        params.headers[parameter.name] = answer;
      } else if (parameter.in === 'formData') {
        if (params.body) params.body += '&';
        else params.body = '';
        params.body += parameter.name + '=' + answer;
      } else if (parameter.in === 'query') {
        params.query = params.query || {};
        params.query[parameter.name] = answer;
      } else if (parameter.in === 'body') {
        try {
          params.body = JSON.parse(answer)
        } catch (e) {
          $scope.inputError = 'Error parsing JSON:' + e.toString();
          return;
        }
      }
    });
    params.path = params.path.replace('{format}', 'json', 'g');
    return params;
  }
});

App.controller('SampleCode', function($scope) {
  $scope.selectedLanguage = {id: 'javascript', label: "JavaScript"};
  Lucy.get('/sample_code/languages', function(err, languages) {
    $scope.languages = languages;
    $scope.$apply();
  });

  var refreshTimeout = null;
  var refreshTimeoutLength = 350;
  $scope.refresh = function() {
    if (refreshTimeout) clearTimeout(refreshTimeout);
    refreshTimeout = setTimeout($scope.refreshInner, refreshTimeoutLength);
  }

  $scope.refreshInner = function() {
    Lucy.post('/sample_code/build/request', {
      request: $scope.getRequestParameters(),
      language: $scope.selectedLanguage.id,
    }, function(err, result) {
      $scope.sampleCodeError = $scope.sampleCode = '';
      if (err) {
        $scope.sampleCodeError = err.error;
      } else {
        $scope.sampleCode = result.code;
      }
      $scope.$apply();
    })
  }
  $scope.setLanguage = function(language) {
    $scope.selectedLanguage.id = language.id;
    $scope.selectedLanguage.label = language.label;
    $scope.refresh();
  }
  $scope.refresh();
  $scope.callOnChange.push($scope.refresh);
});

App.controller('Response', ['$scope', '$sce', function($scope, $sce) {
  $scope.frameSrc = "";
  $scope.outputType = $scope.activeRoute.visual ? 'visual' : 'raw';
  $scope.askedForRaw = false;
  $scope.setOutputType = function(type) {
    $scope.askedForRaw = type === 'raw';
    $scope.outputType = type;
  }

  $scope.getDemoUrl = function() {
    var demoURL = 'https://api.lucybot.com/v1/fromURL/embed?';
    demoURL += 'lucy_swaggerURL=' + encodeURIComponent($('#SpecURL').scope().specURL);
    demoURL += '&lucy_method=' + encodeURIComponent($scope.activeRoute.method);
    demoURL += '&lucy_path=' + encodeURIComponent($scope.activeRoute.path);
    var keys = $('#Keys').scope().keys;
    var keysAdded = [];
    for (key in keys) {
      if (keys[key] !== undefined && keys[key] !== null && keysAdded.indexOf(key) === -1) {
        keysAdded.push(key);
        demoURL += '&' + key + '=' + encodeURIComponent(JSON.stringify(keys[key]));
      }
    }
    for (key in $scope.answers) {
      if ($scope.answers[key] !== undefined && $scope.answers[key] !== null && keysAdded.indexOf(key) === -1) {
        keysAdded.push(key);
        demoURL += '&' + key + '=' + encodeURIComponent(JSON.stringify($scope.answers[key]));
      }
    }
    return demoURL;
  }

  var refreshTimeout = null;
  var refreshTimeoutLength = 350;
  $scope.refresh = function() {
    $scope.loadingResponse = true;
    if (refreshTimeout) clearTimeout(refreshTimeout);
    refreshTimeout = setTimeout($scope.refreshInner, refreshTimeoutLength);
  }

  $scope.refreshInner = function() {
    $scope.outputType = !$scope.askedForRaw && $scope.activeRoute.visual ? 'visual' : 'raw';
    $scope.response = '';
    if ($scope.activeRoute.visual) {
      $scope.frameSrc = $sce.trustAsResourceUrl($scope.getDemoUrl());
      var frame = $('iframe.response-frame');
      frame.attr('src', $scope.frameSrc);
    }

    var request = $scope.getRequestParameters();
    request.path = 'proxy/' + request.protocol + '/' + request.domain
        + (request.port ? ':' + request.port : '') + request.path;
    var parts = PROXY_HOST.split(':');
    request.protocol = parts[0];
    request.domain = parts[1].substring(2);
    if (parts[2]) request.port = parts[2];
    Lucy.post('/sample_code/build/request', {
      request: request, 
      language: 'javascript',
    }, function(err, result) {
      if (err) {
        $scope.loadingResponse = false;
        $scope.responseError = err.error;
        $scope.$apply();
        return;
      }
      code = 'var getResult = function(callback) {\n' + 
             '  try {\n' +
             '    ' + result.code.replace('console.log(result)', 'callback(null, result)').replace('throw err', 'callback(err)') + '\n' +
             '  } catch(e) { callback(e) }\n' +
             '}';
      eval(code);
      try {
        getResult(function(err, result) {
          $scope.loadingResponse = false;
          if (err && err.status !== 200) {
            console.log(err);
            if (err.status === 0) {
              $scope.responseError = 'Unknown error while sending request. Check your browser\'s console for details.'
            } else {
              $scope.switchToVisualOnSuccess = $scope.outputType === 'visual' || $scope.switchToVisualOnSuccess;
              $scope.outputType = 'raw';
              $scope.responseError = 'Status Code ' + err.status + ': ' + err.statusText + '\n';
            }
            if (err.responseJSON) {
              $scope.response = JSON.stringify(err.responseJSON, null, 2);
            } else {
              $scope.response = err.responseText;
            }
          } else {
            if ($scope.switchToVisualOnSuccess) {
              $scope.switchToVisualOnSuccess = false;
              $scope.outputType = 'visual';
            }
            $scope.responseError = null;
            if (result instanceof Document) {
              $scope.response = WebCodeBeauty.xml((new XMLSerializer()).serializeToString(result));
            } else if (typeof result === 'object') {
              $scope.response = JSON.stringify(result, null, 2);
            } else {
              $scope.response = result || '[no content]';
            }
          }
          $scope.$apply();
        })
      } catch (e) {
        $scope.loadingResponse = false;
        $scope.responseError = e.toString();
      }
    })
  }
  if ($scope.activeRoute.method === 'get' || $scope.activeRoute.method === 'def') {
    $scope.refresh()
    $scope.callOnChange.push($scope.refresh);
  }
}]);

