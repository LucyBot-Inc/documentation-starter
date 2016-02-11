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

App.controller('Console', function($scope, $location) {
  $scope.onAnswerChanged = function() {
    if ($('#SampleCode').length) $('#SampleCode').scope().refresh();
    if ($('#Response').length) $('#Response').scope().autorefresh();
  }

  $scope.setActiveRoute = function(route) {
    $scope.answers = {}
    $location.path('/Console/' + route.method + '/' + encodeURIComponent(route.path));
    route.operation.parameters.forEach(function(parameter) {
      if (parameter['x-consoleDefault']) {
        $scope.answers[parameter.name] = parameter['x-consoleDefault'];
      }
    })
    mixpanel.track('set_route', {
      host: $scope.spec.host,
      method: route.method,
      path: route.path,
    })
    $scope.activeRoute = route;
    $scope.activeRouteIdx = $scope.routes.indexOf(route);
    $scope.onAnswerChanged();
  }

  $scope.goToBestRoute = function() {
    var loc = $location.path();
    loc = loc.substring(loc.indexOf('/', 1));
    var startRoute = null;
    if (loc) {
      var method = loc.substring(1, loc.indexOf('/', 1));
      var path = decodeURIComponent(loc.substring(loc.indexOf('/', 1) + 1));
      startRoute = $scope.routes.filter(function(r) {return r.method === method && r.path === path})[0];
    }
    var taggedRoutes= $scope.routes
        .filter(function(r) {
          return !$scope.activeTag || (r.operation.tags && r.operation.tags.indexOf($scope.activeTag.name) !== -1)
        })
    startRoute = startRoute || taggedRoutes.filter(function(r) {return r.visual})[0];
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
      returns: 'json',
      answers: $scope.answers,
    };
    var basePath = $scope.spec.basePath || '';
    if (basePath.lastIndexOf('/') === basePath.length - 1) {
      basePath = basePath.substring(0, basePath.length - 1);
    }
    params.path = basePath + $scope.activeRoute.path;
    var addParam = function(parameter, answer) {
      if (parameter.in === 'path') {
        params.path = params.path.replace('{' + parameter.name + '}', answer);
      } else if (parameter.in === 'header') {
        params.headers = params.headers || {};
        params.headers[parameter.name] = answer;
      } else if (parameter.in === 'formData') {
        if (params.body) params.body += '&';
        else params.body = '';
        params.body += parameter.name + '=' + encodeURIComponent(answer);
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
    }
    var keys = $('#Keys').scope().keys;
    if ($scope.spec.securityDefinitions) {
      var addedOauth = false;
      for (var sec in $scope.spec.securityDefinitions) {
        sec = $scope.spec.securityDefinitions[sec];
        if (sec.type === 'apiKey') {
          if (keys[sec.name]) addParam(sec, keys[sec.name]);
        } else if (sec.type === 'oauth2' && keys.oauth2 && !addedOauth) {
          if (sec.flow === 'implicit') params.query = {access_token: keys.oauth2};
          else params.headers = {'Authorization': 'Bearer ' + keys.oauth2}
          addedOauth = true;
        } else if (sec.type === 'basic' && keys.username && keys.password) {
          params.headers = {'Authorization': 'Basic ' + btoa(keys.username + ':' + keys.password)};
        }
      }
    } else {
      for (key in keys) {
        if (keys[key]) $scope.answers[key] = $scope.answers[key] || keys[key];
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
      addParam(parameter, answer);
    });
    params.path = params.path.replace('{format}', 'json', 'g');
    return params;
  }
});

App.controller('SampleCode', function($scope) {
  var refreshTimeout = null;
  var refreshTimeoutLength = 350;
  $scope.refresh = function(language, callback) {
    if (!language) {
      language = $scope.selectedLanguage;
    }
    if (refreshTimeout) clearTimeout(refreshTimeout);
    refreshTimeout = setTimeout(function() {
      $scope.refreshInner(language, callback);
    }, refreshTimeoutLength);
  }

  $scope.refreshInner = function(language, callback) {
    mixpanel.track('refresh_sample_code', {
      language: language.id
    })
    Lucy.post(OPTIONS.codegenPath, {
      request: $scope.getRequestParameters(),
      language: language.id
    }, function(err, result) {
      $scope.sampleCodeError = $scope.sampleCode = '';
      if (err) {
        $scope.sampleCodeError = err.error;
      } else {
        $scope.sampleCode = result.code;
      }
      $scope.$apply();
      if (callback) callback(err);
    })
  }
  $scope.setLanguage = function(language) {
    $scope.refresh(language, function() {
      $scope.selectedLanguage = language;
      $scope.$apply();
    });
  }

  Lucy.get('/code/languages', function(err, languages) {
    $scope.languages = languages;
    $scope.languages.forEach(function(l) {
      if (l.id === 'node') l.hljsID = 'javascript';
    })
    $scope.setLanguage($scope.languages[0]);
    $scope.$apply();
  });
});

App.controller('Response', ['$scope', '$sce', function($scope, $sce) {
  $scope.frameSrc = "";
  $scope.outputType = $scope.activeRoute.visual ? 'visual' : 'raw';
  $scope.askedForRaw = false;
  $scope.setOutputType = function(type) {
    $scope.askedForRaw = type === 'raw';
    $scope.outputType = type;
  }

  var refreshTimeout = null;
  var refreshTimeoutLength = 350;
  $scope.refresh = function() {
    $scope.loadingResponse = true;
    if (refreshTimeout) clearTimeout(refreshTimeout);
    refreshTimeout = setTimeout($scope.refreshInner, refreshTimeoutLength);
  }

  $scope.refreshInner = function() {
    mixpanel.track('refresh_response', {
      visual: $scope.activeRoute.visual,
      method: $scope.activeRoute.method,
      path: $scope.activeRoute.path,
      host: $scope.spec.host
    })
    $scope.outputType = !$scope.askedForRaw && $scope.activeRoute.visual ? 'visual' : 'raw';
    $scope.response = '';
    if ($scope.activeRoute.visual) {
      var frameDoc = $('iframe.response-frame')[0].contentWindow.document;
      frameDoc.body.innerHTML = '<h1 class="text-center"><i class="fa fa-spin fa-spinner"></i></h1>';
      var removeCruft = function(k, v) {
        if (k === 'description' || k === 'x-lucy/readme' || k.indexOf('$$') === 0) return;
        return v;
      }
      var answers = JSON.parse(JSON.stringify($scope.answers));
      var keys = $('#Keys').scope().keys;
      for (var key in keys) {
        answers[key] = keys[key];
      }
      for (var key in OPTIONS.embedParameters || {}) {
        answers[key] = OPTIONS.embedParameters[key];
      }
      var req =  JSON.stringify({
        swagger: OPTIONS.disableSwaggerUpload ? undefined : $scope.spec,
        method: $scope.activeRoute.method,
        path: $scope.activeRoute.path,
        keys: keys,
        answers: answers,
      }, removeCruft);
      $.ajax({
        type: 'POST',
        url: BASE_URL + '/code/build/embed',
        contentType: 'application/json',
        data: req,
        success: function(data) {
          frameDoc.body.innerHTML = '';
          frameDoc.write(data);
        },
      });
    }

    var request = $scope.getRequestParameters();
    if (PROXY_HOST) {
      request.path = 'proxy/' + request.protocol + '/' + request.domain
          + (request.port ? ':' + request.port : '') + request.path;
      if (PROXY_HOST === true) {
        request.protocol = '';
        request.domain = '';
        request.relative = true;
      } else {
        var parts = PROXY_HOST.split(':');
        request.protocol = parts[0];
        request.domain = parts[1].substring(2);
        if (parts[2]) request.port = parts[2];
      }
    }
    Lucy.post('/code/build/request', {
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
  $scope.autorefresh = function() {
    if (!OPTIONS.disableAutorefresh && $scope.activeRoute.method === 'get') {
      $scope.refresh()
    }
  }
  $scope.autorefresh();
}]);

