var PARSER_OPTS = {
  strictValidation: false,
  validateSchema: false
}

App.controller('SpecURL', function($scope) {
  $scope.specURL = SPEC_URL || "https://api.lucybot.com/v1/apis/hacker_news";
  $scope.alert = {};
  $scope.getSpec = function() {
    $.ajax({
      url: $scope.specURL
    })
    .done(function(response, status, request) {
      swagger.parser.parse(response, PARSER_OPTS, function(err, api, metadata) {
        if (!api || !api.swagger) {
          $scope.alert = {danger: "Error parsing Swagger"};
          $scope.$apply();
          mixpanel.track('err_swagger', {
            url: $scope.specURL,
            error: err,
          });
          return;
        }
        mixpanel.track('get_swagger', {
          host: api.host,
          url: $scope.specURL,
        });
        console.log('tracked get swag');
        var bodyScope = $('#Body').scope();
        bodyScope.spec = api;
        bodyScope.$apply();
      });
    })
    .fail(function(xhr, details) {
      $scope.alert = {danger: "Error getting spec from " + $scope.specURL}
      mixpanel.track('err_swagger', {
        url: $scope.specURL,
        error: 'load'
      })
      $scope.$apply();
    })
  }
  if (SPEC_URL) $scope.getSpec();
})
