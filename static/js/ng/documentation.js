App.controller('Docs', function($scope) {
  $scope.getId = function(verb, path) {
    return verb + '_' + path.replace(/\W/g, '_')
  }
  $scope.scrollToRoute = function(idx) {
    var newTop = 0;
    $scope.scrolledRoute = idx >= 0 ? $scope.routesFiltered[idx] : null;
    if (idx !== -1) {
      if ($('.scroll-target').length === 0) {
        setTimeout(function() {
          $scope.scrollToRoute(idx);
        }, 500)
        return;
      }
      var curTop = $('.docs-col').scrollTop();
      var colTop = $('.docs-col').offset().top;
      var routeTop = $('#ScrollRoute' + idx + ' h2').offset().top;
      newTop = routeTop - colTop + curTop - 15;
    } else {
      $scope.scrolledTag = null;
    }
    $scope.animatingScroll = true;
    $('.docs-col').animate({
      scrollTop: newTop
    }, 800, function() {
      $scope.animatingScroll = false;
    })
  }
  $scope.scrollToTag = function(idx) {
    var tag = $scope.scrolledTag = $scope.spec.tags[idx];
    var scrollToRoute = -1;
    $scope.routesFiltered.forEach(function(r, routeIdx) {
      if (r.operation.tags &&
          scrollToRoute === -1 &&
          r.operation.tags.indexOf(tag.name) !== -1) scrollToRoute = routeIdx
    })
    $scope.scrollToRoute(scrollToRoute);
  }
  $scope.initScroll = function() {
    $('.docs-col').scroll(function() {
      if ($scope.animatingScroll) return;
      if ($scope.activePage !== 'documentation') return;
      var visibleHeight = $('.docs-col').height() - 50;
      var closest = -1;
      var minDist = Infinity;
      $('.scroll-target').each(function(index) {
        var thisTop = $(this).offset().top;
        var thisBottom = thisTop + $(this).height();
        if (closest === -1 ||
            (minDist < 0 && thisTop < visibleHeight) ||
            (thisTop >= 0 && thisTop < minDist && thisTop < visibleHeight)) {
          closest = index;
          minDist = thisTop;
        }
      });
      if (!$scope.spec.info['x-lucy/readme'] && !$scope.spec.info.description) closest += 1;
      if (closest === 0) {
        $scope.scrolledRoute = null;
        $scope.scrolledTag = null;
      } else if (!$scope.spec.tags) {
        $scope.scrolledRoute = $scope.routes[closest - 1];
        $scope.scrolledTag = null;
      } else {
        var activeRoute = $scope.routesFiltered[closest - 1];
        $scope.scrolledTag = !activeRoute.operation.tags ?
          {name: 'Miscellaneous'} :
          $scope.spec.tags.filter(function(t) {
            return activeRoute.operation.tags.indexOf(t.name) !== -1;
          })[0];
        $scope.scrolledRoute = activeRoute;
      }
      $scope.$apply();
    })
  }
  $scope.initScroll();

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
  var sortByTag = function(r1, r2) {
    if (!$scope.spec.tags) return SORT_ROUTES(r1, r2);
    if (r1.operation.tags && !r2.operation.tags) return -1;
    if (r2.operation.tags && !r1.operation.tags) return 1;
    var r1Index = -1;
    var r2Index = -1;
    $scope.spec.tags.forEach(function(tag, index) {
      if (r1.operation.tags.indexOf(tag.name) !== -1 &&
          (r1Index === -1 || r1Index > index)) {
        r1Index = index;
      }
      if (r2.operation.tags.indexOf(tag.name) !== -1 &&
          (r2Index === -1 || r2Index > index)) {
        r2Index = index;
      }
    })
    if (r1Index < r2Index) return -1;
    if (r2Index < r1Index) return 1;
    return SORT_ROUTES(r1, r2);
  }
  $scope.routesFiltered = $scope.routes;
  var filterRoutes = function() {
    $scope.routesFiltered = $scope.routes
        .filter($scope.matchesQuery)
        .filter($scope.matchesTag)
        .sort(sortByTag)
  }
  $scope.$watch('query', filterRoutes);
  $scope.$watch('activeTag', filterRoutes);
});

App.controller('Route', function($scope) {})

App.controller('Schema', function($scope) {
  $scope.printSchema = function(schema) {
    return JSON.stringify(EXAMPLES.schemaExample(schema), null, 2);
  }
  $scope.schemaExample = $scope.printSchema($scope.schema);
})

App.controller('DocParameter', function($scope) {
  $scope.schema = $scope.parameter.schema;
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

App.controller('DocResponse', function($scope) {
  $scope.schema = $scope.response.schema;
})
