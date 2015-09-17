var oauth = window.oauth = {};

oauth.onOAuthComplete = function(qs) {
  mixpanel.track('oauth_done', {
    host: $('#Portal').scope().spec.host
  })
  oauth.token = qs;
  var keyScope = $('#Keys').scope()
  keyScope.keys.oauth2 = qs.access_token;
  keyScope.keyChanged();
  keyScope.$apply();
  setTimeout(function() {
    $('#OAuth2').modal('hide');
    $('#Response').scope().refresh();
  }, 1000);
}

App.controller('OAuth2', function($scope) {
  $scope.alert = {};
  var addedScopes = $scope.addedScopes = {};
  for (key in $scope.oauthDefinition.scopes) {
    addedScopes[key] = true;
  }

  $scope.clearScopes = function() {
    for (var scope in addedScopes) addedScopes[scope] = false;
  }

  $scope.authorize = function() {
    var flow = $scope.oauthDefinition.flow;
    var url = $scope.oauthDefinition.authorizationUrl;
    var clientId = '';
    for (host in CLIENT_IDS) {
      if ($scope.spec.host.indexOf(host) >= 0) clientId = CLIENT_IDS[host];
    }
    window.oauth.tokenName = $scope.oauthDefinition.tokenName || 'access_token';
    window.oauth.tokenUrl = (flow === 'accessCode' ? $scope.oauthDefinition.tokenUrl : null);
    var scopes = Object.keys(addedScopes).filter(function(name) {return addedScopes[name]});
    var state = Math.random();
    var redirect = OAUTH_CALLBACK;
    url += '?response_type=' + (flow === 'implicit' ? 'token' : 'code');
    url += '&redirect_uri=' + redirect;
    url += '&client_id=' + encodeURIComponent(clientId);
    if (scopes.length > 0) {
      url += '&scope=' + encodeURIComponent(scopes.join(' '));
    }
    url += '&state=' + encodeURIComponent(state);
    mixpanel.track('oauth_start', {
      host: $scope.spec.host,
      scopes: scopes.length,
    })
    window.open(url);
  }
})
