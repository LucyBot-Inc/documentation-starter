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
          $scope.alert = {danger: "Error retrieving Swagger"};
          $scope.$apply();
          return;
        }
        var bodyScope = $('#Body').scope();
        bodyScope.spec = api;
        bodyScope.$apply();
      });
    })
    .fail(function(xhr, details) {
      $scope.alert = {danger: "Error getting spec from " + $scope.specURL}
      $scope.$apply();
    })
  }
  if (SPEC_URL) $scope.getSpec();
})
