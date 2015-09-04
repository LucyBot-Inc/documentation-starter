App.controller('Docs', function($scope) {
  $scope.getId = function(verb, path) {
    return verb + '_' + path.replace(/\W/g, '_')
  }
  $scope.scrollTo = function(idx) {
    if (idx === -1) {
      $('.docs-col').scrollTop(0);
    } else {
      var curTop = $('.docs-col').scrollTop();
      var colTop = $('.docs-col').offset().top;
      var routeTop = $('#ScrollRoute' + idx + ' h3').offset().top;
      $('.docs-col').scrollTop(routeTop - colTop + curTop - 15);
    }
  }

  $scope.routesFiltered = $scope.routes;
  var filterRoutes = function() {
    $scope.routesFiltered = $scope.routes
        .filter($scope.showRoute)
        .filter(function(r) {
          return !$scope.activeTag || (r.operation.tags && r.operation.tags.indexOf($scope.activeTag.name) !== -1)
        })
  }
  $scope.$watch('query', filterRoutes);
  $scope.$watch('activeTag', filterRoutes);
  $scope.$watch('routes', filterRoutes);
  $scope.showRoute = function(route) {
    if (!$scope.query) return true;
    var query = $scope.query.toLowerCase();
    var terms = query.split(' ');
    for (var i = 0; i < terms.length; ++i) {
      if (route.searchText.indexOf(terms[i]) !== -1) return true;
    }
    return false;
  }
  $scope.editorMode = false;
  $scope.switchMode = function() {
    $scope.editorMode = !$scope.editorMode;
  }

  $scope.addOperation = function() {
    var path = '/newOperation';
    var i = 0;
    while ($scope.spec.paths[path]) path = '/newOperation' + (++i);
    var op = $scope.spec.paths[path] = {
      parameters: [],
      responses: {
        '200': {
          description: 'Successful Response'
        }
      }
    };
    $scope.routes.push({operation: op, method: 'get', path: path})
    filterRoutes();
  }
});

App.controller('SidebarNav', function($scope) {
  $scope.navLinks = [];
});

App.controller('Route', function($scope) {
  $scope.openConsole = function() {
    $('#Body').scope().activePage = 'console';
    $('#Consoles').scope().activeConsole = $scope.$index;
  }

  $scope.addParameter = function() {
    $scope.route.operation.parameters.push({in: 'query', name: 'myParam', type: 'string'})
  }

  $scope.removeParameter = function(idx) {
    $scope.route.operation.parameters.splice(idx, 1);
  }

  $scope.addResponse = function() {
    var code = 200;
    while ($scope.route.operation.responses[String(code)]) ++code;
    $scope.route.operation.responses[String(code)] = {}
  }

  $scope.removeResponse = function(code) {
    delete $scope.route.operation.responses[code];
  }
})

App.controller('EditMarkdown', function($scope) {})

App.controller('Schema', function($scope) {
  $scope.printSchema = function(schema) {
    return JSON.stringify(EXAMPLES.schemaExample($scope.schema), null, 2);
  }
  $scope.edit = function(schema) {
    $scope.schemaString = JSON.stringify(schema, null, 2);
    $scope.clicked = true;
  }
  $scope.save = function() {
    try {
      var ret = $scope.schemaString ? JSON.parse($scope.schemaString) : null;
      $scope.clicked = false;
      $scope.parseError = '';
      return ret;
    } catch (e) {
      console.log('err')
      $scope.parseError = e.message;
    }
  }
  $scope.getString = function(schema) {
    return JSON.stringify(schema, null, 2);
  }
  $scope.codemirrorLoad = function(editor) {
    editor.on("change", function(ch) {
      $scope.schemaString = ch.getValue();
    });
  }
})

App.controller('DocParameter', function($scope) {
  $scope.getCollectionFormatMessage = function() {
    var param = $scope.parameter;
    if (param.collectionFormat === 'multi') {
      return 'Values should be specified as separate query parameters';
    }
    var ret = 'Values should be joined by ';

    if (param.collectionFormat === 'csv') {
      return ret + 'commas.';
    } else if (param.collectionFormat === 'ssv') {
      return ret + 'spaces.';
    } else if (param.collectionFormat === 'tsv') {
      return ret + 'tabs.';
    } else if (param.collectionFormat === 'pipes') {
      return ret + 'pipes.';
    }
  }
  $scope.getExample = function() {
    if ($scope.parameter.schema) {
      return $scope.printSchema($scope.parameter.schema);
    }
    return EXAMPLES.parameterExample($scope.parameter, $scope.route.path);
  }
})


App.controller('ResponseCode', function($scope) {
  var origCode = $scope.code;
  console.log('orig', origCode);
  $scope.save = function(code) {
    if (code !== origCode) {
      console.log('swag', origCode, code);
      $scope.route.operation.responses[code] = $scope.route.operation.responses[origCode];
      delete $scope.route.operation.responses[origCode];
    }
    return true;
  }
})
