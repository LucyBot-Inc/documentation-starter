var PROXY_HOST = 'https://api.lucybot.com'

App.controller('Console', function($scope) {
  $scope.flatRoutes = [];
  for (path in $scope.spec.paths) {
    var pathParams = $scope.spec.paths[path].parameters || [];
    for (method in $scope.spec.paths[path]) {
      if (method === 'parameters') continue;
      route = $scope.spec.paths[path][method];
      route.parameters = route.parameters.concat(pathParams);
      var flat = {path: path, method: method, route: route};
      flat.visual = route.responses['200'] && route.responses['200']['x-lucy/view'];
      $scope.flatRoutes.push(flat);
    }
  }

  $scope.setActiveRoute = function(route) {
    $scope.answers = {}
    $scope.activeRoute = route;
  }
  $scope.setActiveRoute($scope.flatRoutes[0]);

  $scope.callOnChange = [];
  $scope.onAnswerChanged = function() {
    $scope.callOnChange.forEach(function(fn) {
      fn();
    })
  }

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
      $scope.answers[key] = keys[key];
    }
    $scope.activeRoute.route.parameters.forEach(function(parameter) {
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

  $scope.refresh = function() {
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

App.controller('Response', function($scope) {
  $scope.outputType = $scope.activeRoute.route.responses['200']['x-lucy/view'] ? 'visual' : 'raw';
  $scope.setOutputType = function(type) {
    $scope.outputType = type;
  }

  $scope.getDemoUrl = function() {
    var demoURL = 'https://api.lucybot.com/v1/fromURL/embed?';
    demoURL += 'lucy_swaggerURL=' + encodeURIComponent($('#SpecURL').scope().specURL);
    demoURL += '&lucy_method=' + encodeURIComponent($scope.activeRoute.method);
    demoURL += '&lucy_path=' + encodeURIComponent($scope.activeRoute.path);
    for (key in $scope.answers) {
      if ($scope.answers[key] !== undefined && $scope.answers[key] !== null) {
        demoURL += '&' + key + '=' + encodeURIComponent(JSON.stringify($scope.answers[key]));
      }
    }
    return demoURL;
  }

  $scope.refresh = function() {
    console.log('refr');
    if ($scope.activeRoute.visual) {
      var frameSrc = $scope.getDemoUrl();
      console.log('src', frameSrc)
      var frame = $('iframe.response-frame');
      frame.attr('src', frameSrc);
    }

    $scope.loadingResponse = true;
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
});

