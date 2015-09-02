App.controller('Docs', function($scope) {
  $scope.getId = function(verb, path) {
    return verb + '_' + path.replace(/\W/g, '_')
  }
  $scope.scrollTo = function(idx) {
    var curTop = $('.docs-col').scrollTop();
    var colTop = $('.docs-col').offset().top;
    var routeTop = $('#ScrollRoute' + idx).offset().top;
    console.log('tops', curTop, colTop, routeTop);
    $('.docs-col').scrollTop(routeTop - colTop + curTop);
  }

  $scope.routesFiltered = $scope.routes;
  $scope.$watch('query', function(q) {
    $scope.routesFiltered = $scope.routes
        .filter($scope.showRoute)
  })
  $scope.showRoute = function(route) {
    console.log('if', route, $scope.query)
    if (!$scope.query) return true;
    var query = $scope.query.toLowerCase();
    var terms = query.split(' ');
    for (var i = 0; i < terms.length; ++i) {
      if (route.searchText.indexOf(terms[i]) !== -1) return true;
    }
    return false;
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
})

App.controller('Schema', function($scope) {
  $scope.printSchema = function(schema) {
    return JSON.stringify(EXAMPLES.schemaExample(schema), null, 2);
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

