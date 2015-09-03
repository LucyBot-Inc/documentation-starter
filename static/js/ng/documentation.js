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
  $scope.showRoute = function(route) {
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

