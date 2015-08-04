var PROXY_HOST = 'https://api.lucybot.com'

var getSeparatorFromFormat = function(format) {
  if (format === 'csv' || format === 'multi') {
    return ',';
  } else if (format === 'tsv') {
    return '\t';
  } else if (format === 'ssv') {
    return ' ';
  } else if (format === 'pipes') {
    return '|';
  }
}

App.controller('SidebarNav', function($scope) {
  $scope.navLinks = [];
})

App.controller('Consoles', function($scope) {
  $scope.consoles = $scope.consoles.filter(function(console) {return console.method !== 'def'}).sort(SORT_ROUTES);
  $scope.consoles.forEach(function(c) {
    if (c.path) {
      var resp = $scope.spec.paths[c.path][c.method].responses['200'];
      c.visual = c.recipe || resp && resp['x-lucy/view'];
    }
  })
  $scope.activeConsole = -1;
  Lucy.get('/sample_code/languages', function(err, languages) {
    $scope.languages = languages;
    $scope.$apply();
  })

  $scope.setActiveConsole = function(index) {
    $scope.activeConsole = index;
  }

  var query = window.location.search.substring(1);
  var openLoc = query.indexOf('open=');
  if (openLoc === -1) {
    $scope.consoles.forEach(function(cons, idx) {
      if ($scope.activeConsole === -1 && cons.visual) {
        $scope.setActiveConsole(idx);
      }
    });
    if ($scope.activeConsole === -1) {
      $scope.setActiveConsole(0);
    }
  } else {
    var num = query.substring(openLoc + 5).split('&')[0];
    $scope.setActiveConsole(parseInt(num))
  }
  $scope.getId = function(verb, path) {
    return verb + '_' + path.replace(/\//g, '-').replace(/\W/g, '')
  }
});

App.controller('Keys', function($scope) {
  var keys = localStorage.getItem('API_KEYS') || '{}';
  $scope.keys = JSON.parse(keys) || {};
  $scope.checks = {
    saveKeys: true
  }
  $scope.changedKeys = Object.keys($scope.keys).length > 0;
  $scope.keyChanged = function() {
    $scope.changedKeys = true;
    $('#SampleCode').scope().refresh();
    if ($scope.checks.saveKeys) {
      var keys = JSON.stringify($scope.keys);
      localStorage.setItem('API_KEYS', keys);
    }
  }
  $scope.saveChanged = function() {
    if (!$scope.checks.saveKeys) {
      localStorage.setItem('API_KEYS', '{}');
    }
  }

  var looksLikeApiKey = function(parameter) {
    var name = parameter.name.toLowerCase();
    if (parameter.in === 'header' && name === 'authorization') {
      return true;
    }
    var matches = name.match(/^api.?key$/i);
    if (matches) return true;
    return false;
  }
  $scope.keyInputs = [];
  if ($scope.spec.securityDefinitions) {
    for (def in $scope.spec.securityDefinitions) {
      def = $scope.spec.securityDefinitions[def];
      var name = def.name || def.type;
      $scope.keyInputs.push({
        name: def.name,
        label: def.name
      })
      $scope.keys[name] = $scope.keys[name] || undefined;
    }
  } else {
    added = [];
    for (path in $scope.spec.paths) {
      for (verb in $scope.spec.paths[path]) {
        var route = $scope.spec.paths[path][verb];
        route.parameters.forEach(function(parameter) {
          if (added.indexOf(parameter.name) === -1 && looksLikeApiKey(parameter)) {
            added.push(parameter.name);
            $scope.keyInputs.push({
              name: parameter.name,
              label: parameter.label,
            })
            $scope.keys[parameter.name] = $scope.keys[parameter.name] || undefined;
          }
        })
      }
    }
  }
})

App.controller('Console', function($scope) {
  $scope.answers = $scope.answers || {};
  $scope.console.inputs.forEach(function(input) {
    if (input.default) {
      var sep = getSeparatorFromFormat(input.parameter.collectionFormat);
      if (sep) {
        $scope.answers[input.name] = input.default.split(sep);
      } else {
        $scope.answers[input.name] = input.default;
      }
    }
  });

  if ($scope.console.path) {
    var route = $scope.spec.paths[$scope.console.path][$scope.console.method];
    $scope.description = route.description;
  }

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
      method: $scope.console.method,
      returns: 'json'
    };
    var basePath = $scope.spec.basePath || '';
    if (basePath.lastIndexOf('/') === basePath.length - 1) {
      basePath = basePath.substring(0, basePath.length - 1);
    }
    params.path = basePath + $scope.console.path;
    var keys = $('#Keys').scope().keys;
    for (key in keys) {
      $scope.answers[key] = keys[key];
    }
    $scope.console.inputs.forEach(function(input) {
      if (typeof $scope.answers[input.name] === 'undefined' || $scope.answers[input.name] === '') {
        if (input.parameter.in === 'path') {
          $scope.answers[input.name] = '';
        } else {
          return;
        }
      }
      var answer = '';
      if (input.parameter.type === 'array') {
        answer = $scope.answers[input.name] || [];
        var sep = getSeparatorFromFormat(input.parameter.collectionFormat);
        if (sep) answer = answer.join(sep);
      } else {
        answer = $scope.answers[input.name];
      }
      if (input.in === 'path') {
        params.path = params.path.replace('{' + input.name + '}', answer);
      } else if (input.in === 'header') {
        params.headers = params.headers || {};
        params.headers[input.name] = answer;
      } else if (input.in === 'formData') {
        if (params.body) params.body += '&';
        else params.body = '';
        params.body += input.name + '=' + answer;
      } else if (input.in === 'query') {
        params.query = params.query || {};
        params.query[input.name] = answer;
      } else if (input.in === 'body') {
        try {
          params.body = JSON.parse(answer)
        } catch (e) {
          $scope.inputError = 'Error parsing JSON:' + e.toString();
          return;
        }
      } else if (input.in === 'body_nested') {
        params.body = params.body || {};
        params.body[input.name] = answer;
      }
    });
    params.path = params.path.replace('{format}', 'json', 'g');
    return params;
  }
});

App.controller('Parameters', function($scope) {
  var keys = $('#Keys').scope().keys || {};
  $scope.parameters = $scope.console.inputs.filter(function(param) {
    return Object.keys(keys).indexOf(param.name) === -1;
  });
})

App.controller('SampleCode', function($scope) {
  $scope.selectedLanguage = {id: 'javascript', label: "JavaScript"};
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
  $scope.outputType = $scope.console.visual ? 'visual' : 'raw';
  $scope.frameSrc = "";
  $scope.setOutputType = function(type) {
    $scope.outputType = type;
  }

  $scope.getDemoUrl = function() {
    var demoURL = 'https://api.lucbot.com/v1/fromURL/embed?';
    demoURL += 'lucy_swaggerURL=' + encodeURIComponent($scope.specURL) + '&';
    if ($scope.console.path) {
      demoURL += 'lucy_method=' + encodeURIComponent($scope.console.method);
      demoURL += '&lucy_path=' + encodeURIComponent($scope.console.path);
    } else {
      demoURL += 'lucy_definition=' + encodeURIComponent($scope.console.definition);
    }
    for (key in $scope.answers) {
      if ($scope.answers[key] !== undefined && $scope.answers[key] !== null) {
        demoURL += '&' + key + '=' + encodeURIComponent(JSON.stringify($scope.answers[key]));
      }
    }
    return demoURL;
  }

  $scope.refresh = function() {
    if ($scope.console.visual) {
      $scope.frameSrc = '';
      $scope.frameSrc = $scope.getDemoUrl();
      var frame = $('iframe.response-frame');
      frame.attr('src', frame.attr('src'));
    }

    if (!$scope.console.path) return;
    
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
              $scope.responseError = 'Status Code ' + err.status + ': ' + err.statusText + '\n';
            }
            if (err.responseJSON) {
              $scope.response = JSON.stringify(err.responseJSON, null, 2);
            } else {
              $scope.response = err.responseText;
            }
          } else {
            $scope.responseError = null;
            if (typeof result === 'object') {
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
  if ($scope.console.method === 'get' || $scope.console.method === 'def') {
    $scope.refresh()
    $scope.callOnChange.push($scope.refresh);
  }
});
