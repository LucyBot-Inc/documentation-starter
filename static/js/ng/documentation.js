App.controller('Docs', function($scope) {
  $scope.getId = function(verb, path) {
    return verb + '_' + path.replace(/\W/g, '-')
  }
  $scope.routes = $scope.flatRoutes;
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

