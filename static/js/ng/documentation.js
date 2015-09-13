App.controller('Docs', function($scope) {
  $scope.getId = function(verb, path) {
    return verb + '_' + path.replace(/\W/g, '_');
  }
  $scope.scrollTo = function(idx) {
    var newTop = 0;
    if (idx !== -1) {
      if ($('#ScrollRoute0').length === 0) return;
      var curTop = $('.docs-col').scrollTop();
      var colTop = $('.docs-col').offset().top;
      var routeTop = $('#ScrollRoute' + idx + ' h2').offset().top;
      newTop = routeTop - colTop + curTop - 15;
    }
    $('.docs-col').animate({
      scrollTop: newTop
    }, 800)
  }

  $scope.routesFiltered = $scope.routes;
  $scope.matchesTag = function(route) {
    return !$scope.activeTag || (route.operation.tags && route.operation.tags.indexOf($scope.activeTag.name) !== -1)
  }
  $scope.matchesQuery = function(route) {
    if (!$scope.query) return true;
    var query = $scope.query.toLowerCase();
    var terms = query.split(' ');
    for (var i = 0; i < terms.length; ++i) {
      if (route.searchText.indexOf(terms[i]) === -1) return false;
    }
    return true;
  }
  var filterRoutes = function() {
    $scope.routesFiltered = $scope.routes
        .filter($scope.matchesQuery)
        .filter($scope.matchesTag)
  }
  var filterRoutesAndScroll = function() {
    filterRoutes();
    $scope.scrollTo(0);
  }
  $scope.$watch('query', filterRoutesAndScroll);
  $scope.$watch('activeTag', filterRoutesAndScroll);
  $scope.$watch('routes', filterRoutesAndScroll);
  $scope.query = '';

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
    $scope.routes.push({operation: op, method: 'get', path: path});
    filterRoutes();
    setTimeout(function() {
      $scope.scrollTo($scope.routes.length - 1);
    }, 800);
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
    console.log('add p');
    $scope.route.operation.parameters.push({in: 'query', name: 'myParam', type: 'string'})
  }

  $scope.removeParameter = function(idx) {
    $scope.route.operation.parameters.splice(idx, 1);
  }

  $scope.moveParameter = function(idx, dir) {
    var from = idx;
    var to = idx + dir;
    console.log('move from ' + from + ' to ' + to); 
    $scope.route.operation.parameters.splice(
        idx + dir,
        0,
        $scope.route.operation.parameters.splice(idx, 1)[0]
    );
  }

  $scope.addResponse = function() {
    var code = 200;
    while ($scope.route.operation.responses[String(code)]) ++code;
    $scope.route.operation.responses[String(code)] = {}
  }

  $scope.removeResponse = function(code) {
    delete $scope.route.operation.responses[code];
  }
});

App.controller('EditCode', function($scope) {})

App.controller('Schema', function($scope) {
  $scope.printSchema = function(schema) {
    return JSON.stringify(EXAMPLES.schemaExample(schema), null, 2);
  }
  var removeView = function(key, val) {
    if (key === 'x-lucy/view') return undefined;
    return val;
  }
  $scope.edit = function(schema) {
    $scope.schemaString = JSON.stringify(schema, removeView, 2);
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
    return JSON.stringify(schema, removeView, 2);
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
  $scope.hasEnum = $scope.parameter.enum ? true : false;
  $scope.toggleEnum = function() {
    if ($scope.parameter.enum) {
      $scope.savedEnum = $scope.parameter.enum;
      delete $scope.parameter.enum;
    } else {
      $scope.parameter.enum = $scope.savedEnum || [];
    }
  }
  $scope.removeEnumItem = function(idx) {
    $scope.parameter.enum.splice(idx, 1);
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
});

