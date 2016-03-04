App.controller("Sidebar", function($scope, $location) {
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
    $scope.scrollToTarget('#ScrollTarget' + idx);
  }

  $scope.scrollToTarget = function(target) {
    var curTop = $('.docs-col').scrollTop();
    var colTop = $('.docs-col').offset().top;
    var $target = $(target);
    if (!$target.length) return;
    var targetTop = $target.offset().top;
    var newTop = targetTop - colTop + curTop - 15;

    $scope.animatingScroll = true;
    $('.docs-col').animate({
      scrollTop: newTop
    }, 800, function() {
      $scope.animatingScroll = false;
    })
  }

  $scope.onScroll= function() {
    if ($scope.animatingScroll) return;
    if ($location.path().indexOf('/Console') === 0) return;
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
})
