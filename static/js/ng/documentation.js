App.controller('Docs', function($scope) {
  $scope.getId = function(verb, path) {
    return verb + '_' + path.replace(/\W/g, '_')
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

  $scope.query = '';
  $scope.matchesQuery = function(route) {
    if (!$scope.query) return true;
    var query = $scope.query.toLowerCase();
    var terms = query.split(' ');
    for (var i = 0; i < terms.length; ++i) {
      if (route.searchText.indexOf(terms[i]) === -1) return false;
    }
    return true;
  }
  $scope.matchesTag = function(route) {
    return !$scope.activeTag || (route.operation.tags && route.operation.tags.indexOf($scope.activeTag.name) !== -1)
  }
  $scope.routesFiltered = $scope.routes;
  var filterRoutes = function() {
    $scope.routesFiltered = $scope.routes
        .filter($scope.matchesQuery)
        .filter($scope.matchesTag)
    $scope.scrollTo(0);
  }
  $scope.$watch('query', filterRoutes);
  $scope.$watch('activeTag', filterRoutes);
});

App.controller('Route', function($scope) {})

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

