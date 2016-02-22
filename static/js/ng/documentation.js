App.controller('Docs', function($scope, $location) {
  $scope.printSchema = function(schema) {
    return JSON.stringify(EXAMPLES.schemaExample(schema), null, 2);
  }
  $scope.getId = function(verb, path) {
    return verb + '_' + path.replace(/\W/g, '_');
  }
  $scope.initMenu = function () {
    var requested = $scope.getRouteFromLocation() || {};
    $scope.menuItems = [];
    var active = null;
    var getMenuItemFromRoute = function(route) {
      var index = $scope.routesFiltered.indexOf(route);
      var item = {
        method: route.method,
        title: route.path,
        class: 'route',
        target: '#ScrollRoute' + index + ' h3',
      }
      if (route.method === requested.method && route.path === requested.path) {
        active = item;
      }
      return item;
    }
    var getMenuItemsFromTag = function(tagName) {
      return $scope.routesFiltered.filter(function(r) {
        return r.operation.tags && r.operation.tags.indexOf(tagName) !== -1;
      }).map(getMenuItemFromRoute)
    }
    var groupedTags = [];
    ($scope.spec.tagGroups || []).forEach(function(group) {
      groupedTags = groupedTags.concat(group.tags);
      $scope.menuItems.push({
        title: group.name,
        description: group.description,
        class: 'tagGroup',
        children: group.tags.map(function(tagName) {
          return {
            title: tagName,
            target: '[data-tag="' + tagName + '"] h1',
            class: 'tag',
            children: getMenuItemsFromTag(tagName),
          }
        })
      })
    })
    if ($scope.spec.tags && $scope.spec.tags.length) {
      $scope.menuItems = $scope.menuItems.concat($scope.spec.tags.filter(function(tag) {
        return groupedTags.indexOf(tag.name) === -1;
      }).map(function(tag) {
        var children = getMenuItemsFromTag(tag.name);
        if (!children.length) return null;
        return {
          title: tag.name,
          description: tag.description,
          target: '[data-tag="' + tag.name + '"] h1',
          class: 'tag',
          children: children,
        }
      }).filter(function(item) {return item}));
    } else {
      $scope.menuItems = $scope.menuItems.concat($scope.routesFiltered.map(getMenuItemFromRoute))
    }
    if (active) {
      $scope.menuItems.active = active;
      setTimeout(function() {
        $scope.scrollToTarget(active.target);
      }, 750);
    }
  }

  $scope.$watch('menuItems.active', function() {
    var active = ($scope.menuItems || []).active;
    if (!active || !active.method) return;
    if ($scope.isActive('Documentation')) $location.path('/Documentation/' + active.method + '/' + encodeURIComponent(active.title));
  })

  $scope.setMenuItem = function(item) {
    $scope.menuItems.active = item;
    while ($scope.menuItems.active.children) $scope.menuItems.active = $scope.menuItems.active.children[0];
    $scope.scrollToTarget(item.target || item.children[0].target)
  }

  $scope.isActiveParent = function(item) {
    var isActive = false;
    (item.children || []).forEach(function(c) {
      if (c === $scope.menuItems.active) isActive = true;
      (c.children || []).forEach(function(gc) {
        if (gc === $scope.menuItems.active) isActive = true;
      })
    })
    return isActive;
  }

  $scope.scrollTo = function(idx) {
    var newTop = 0;
    if (idx !== -1) {
      if ($('#ScrollRoute0').length === 0) return;
      $scope.scrollToTarget('#ScrollRoute' + idx + ' h3');
    }
    $scope.menuItems.active = $scope.menuItems[0];
  }

  $scope.scrollToTarget = function(target) {
    if (!$scope.isActive('Documentation')) return;
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
    else $scope.scrollToTarget('#ScrollRoute' + idx + ' h3');
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
    if ($location.path().indexOf('/Documentation') !== 0) return;
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
          else if (child.children) {
            child.children.forEach(function(grandchild) {
              if (isActive(grandchild)) $scope.menuItems.active = grandchild;
            })
          }
        })
      }
    })
  }

  $scope.routesFiltered = $scope.routes;
  $scope.matchesQuery = function(route) {
    if (!$scope.filter.query) return true;
    var query = $scope.filter.query.toLowerCase();
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
  var filterRoutes = function() {
    $scope.routesFiltered = $scope.routes
        .filter($scope.matchesQuery)
        .sort(sortByTag)
    $scope.initMenu();
  }
  var filterRoutesAndScroll = function() {
    filterRoutes();
    $scope.scrollTo(0);
  }
  $scope.filter = {
    query: ''
  };
  $scope.$watch('filter.query', filterRoutesAndScroll);
  $scope.$watch('activeTag', filterRoutesAndScroll);
  $scope.$watch('routes', filterRoutesAndScroll);

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
    $scope.initMenu();
  }
});

App.controller('Route', function($scope) {
  $scope.addParameter = function() {
    $scope.route.operation.parameters.push({in: 'query', name: 'myParam', type: 'string'})
  }

  $scope.removeParameter = function(idx) {
    $scope.route.operation.parameters.splice(idx, 1);
  }

  $scope.moveParameter = function(idx, dir) {
    var from = idx;
    var to = idx + dir;
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

  var getTagIfFirstRoute = function () {
    if (!$scope.spec.tags || !$scope.spec.tags.length) return;
    var opsByTag = $scope.spec.tags.map(function (tag) {
      return $scope.routesFiltered.filter(function(r) {
        return r.operation.tags && r.operation.tags.indexOf(tag.name) !== -1;
      })
    });
    var matches = opsByTag.map(function(ops, index) {
      return ops.indexOf($scope.route) === 0 ? index : -1;
    }).filter(function(idx) {
      return idx >= 0;
    });
    if (matches.length > 0) {
      return $scope.spec.tags[matches[0]];
    }
  }
  $scope.tag = getTagIfFirstRoute();
});

App.controller('EditCode', function($scope) {})

App.controller('Schema', function($scope) {
  $scope.schemaExample = $scope.printSchema($scope.schema);
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

App.controller('DocResponse', function($scope) {
  $scope.schema = $scope.response.schema;
})

App.controller('ResponseCode', function($scope) {
  var origCode = $scope.code;
  $scope.save = function(code) {
    if (code !== origCode) {
      $scope.route.operation.responses[code] = $scope.route.operation.responses[origCode];
      delete $scope.route.operation.responses[origCode];
    }
    return true;
  }
});

