$(document).ready(function() {
  $('.modal').on('shown.bs.modal', function () {
    $('.auto-select').focus();
  });
});

var App = angular.module('App', []);

App.controller('Body', function($scope) {})

App.controller('APIs', function($scope) {
  $scope.BASE_PATH = BASE_PATH || '';
  $scope.apisToShow = 10;
  $scope.showNext = function() {
    if ($scope.apisToShow !== -1) $scope.apisToShow += 5;
  }

  $scope.stripHtml = function(str) {
    return str.replace(/<(?:.|\n)*?>/gm, '');
  }

  $scope.truncate = function(str, limit) {
    if (!str) return;
    if (str.length > limit) {
      str = str.substring(0, limit - 3).trim() + '...'
    }
    return str;
  }

  $scope.queryChanged = function() {
    $scope.apisToShow = -1;
  }

  $scope.tags = [];
  $scope.apis = [];
  $.getJSON(BASE_PATH + '/apis', function(data) {
    $scope.apis = data;
    $scope.tags = [];
    $scope.tags = $scope.apis.forEach(function(api) {
      $scope.tags = $scope.tags.concat(api.tags || []);
    })
    $scope.$apply();
  })
});

App.controller('API', function($scope) {
  $scope.getLogo = function(api) {
    var logo = api.info.logo || api.info['x-logo'];
    if (logo) return logo.url;
    return BASE_PATH + '/img/missing.png';
  }
  $scope.getBackgroundColor = function() {
    if (!$scope.api.info['x-logo']) return '#fff';
    return $scope.api.info['x-logo'].backgroundColor || '#fff';
  }

  $scope.api.info.description = $scope.api.info.description || '';
  $scope.api.info.description = $scope.api.info.description.replace(/<(?:.|\n)*?>/gm, '');
  $scope.api.info.title = $scope.api.info.title || '';
  if ($scope.api.info.title.indexOf(' API') === $scope.api.info.title.length - 4) {
    $scope.api.info.title = $scope.api.info.title.substring(0, $scope.api.info.title.length - 4);
  }
})
