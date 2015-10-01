App.controller('Docs', function($scope) {
  $scope.printSchema = function(schema) {
    return JSON.stringify(EXAMPLES.schemaExample(schema), null, 2);
  }
  $scope.getId = function(verb, path) {
    return verb + '_' + path.replace(/\W/g, '_')
  }
  var initMenu = function () {
    $scope.menuItems = [];
    if ($scope.spec.info['x-lucy/readme'] || $scope.spec.info.description) {
      $scope.menuItems.push({
        title: 'README',
        class: 'readme',
        target: '#README',
      });
    }
    if ($scope.spec.tags && $scope.spec.tags.length) {
      $scope.menuItems = $scope.menuItems.concat($scope.spec.tags.map(function(tag) {
        var children = $scope.routesFiltered.filter(function(r) {
          return r.operation.tags && r.operation.tags.indexOf(tag.name) !== -1;
        }).map(function(route) {
          var index = $scope.routesFiltered.indexOf(route);
          return {
            method: route.method,
            title: route.path,
            class: 'route',
            target: '#ScrollRoute' + index + ' h2',
          }
        })
        if (!children.length) return null;
        return {
          title: tag.name,
          class: 'tag',
          children: children,
        }
      }).filter(function(item) {return item}));
    } else {
      $scope.menuItems = $scope.menuItems.concat($scope.routesFiltered.map(function(route, index) {
        return {
          method: route.method,
          title: route.path,
          class: 'route',
          target: '#ScrollRoute' + index + ' h2',
        }
      }))
    }
    $scope.menuItems.active = $scope.menuItems[0];
  }

  $scope.scrollToTarget = function(target) {
    var curTop = $('.docs-col').scrollTop();
    var colTop = $('.docs-col').offset().top;
    var targetTop = $(target).offset().top;
    newTop = targetTop - colTop + curTop - 15;
    
    $scope.animatingScroll = true;
    $('.docs-col').animate({
      scrollTop: newTop
    }, 800, function() {
      $scope.animatingScroll = false;
    })
  }

  $scope.scrollToRoute = function(idx) {
    if (typeof idx === 'object') idx = $scope.routesFiltered.indexOf(idx);
    if (idx === -1) $scope.scrollToTarget('#README');
    else $scope.scrollToTarget('#ScrollRoute' + idx + ' h2');
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
  $scope.onScroll= function() {
    if ($scope.animatingScroll) return;
    if ($scope.activePage !== 'documentation') return;
    var visibleHeight = $('.docs-col').height() - 50;
    var closest = null;
    var minDist = Infinity;
    $('.scroll-target').each(function(index) {
      var thisTop = $(this).offset().top;
      if (closest === null ||
          (minDist < 0 && thisTop < visibleHeight) ||
          (thisTop >= 0 && thisTop < minDist && thisTop < visibleHeight)) {
        closest = $(this);
        minDist = thisTop;
      }
    });
    var id = closest.attr('id');
    $scope.menuItems.active = null;
    var isActive = function(item) {
      return !$scope.menuItems.active && item.target && item.target.indexOf('#' + id) !== -1;
    }
    $scope.menuItems.forEach(function(item) {
      if (isActive(item)) $scope.menuItems.active = item;
      else if (item.children) {
        item.children.forEach(function(child) {
          if (isActive(child)) $scope.menuItems.active = child;
        })
      }
    })
  }
  $('.docs-col').scroll(function() {
    $scope.onScroll();
    $scope.$apply();
  })

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
  var sortByTag = function(r1, r2) {
    if (!$scope.spec.tags) return SORT_ROUTES(r1, r2);
    if (r1.operation.tags && !r2.operation.tags) return -1;
    if (r2.operation.tags && !r1.operation.tags) return 1;
    if (!r1.operation.tags && !r2.operation.tags) return SORT_ROUTES(r1, r2);
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
  $scope.filterRoutes = function() {
    $scope.routesFiltered = $scope.routes
        .filter($scope.matchesQuery)
        .sort(sortByTag)
    initMenu();
  }
  $scope.$watch('query', $scope.filterRoutes);
});

App.controller('Route', function($scope) {})

App.controller('Schema', function($scope) {
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
