App.controller("Sidebar", function($scope) {
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
})
