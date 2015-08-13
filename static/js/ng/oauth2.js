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

var CLIENT_IDS = {
  'googleapis.com': "281611287830-66urn3gbae0a7doemo3jqg3impislvqh.apps.googleusercontent.com",
  'facebook.com': '509396115881819',
  'instagram.com': '5bce7994099644e4b2ac4a3c75f840a1',
}

App.controller('OAuth2', function($scope) {
  $scope.alert = {};
  var addedScopes = $scope.addedScopes = {};
  $scope.setDefinition = function(def) {
    $scope.definition = def;
    for (key in $scope.definition.scopes) {
      addedScopes[key] = true;
    }
  }

  $scope.clearScopes = function() {
    for (var scope in addedScopes) addedScopes[scope] = false;
  }

  $scope.authorize = function() {
    var flow = $scope.definition.flow;
    var url = $scope.definition.authorizationUrl;
    var clientId = '';
    for (host in CLIENT_IDS) {
      if ($scope.spec.host.indexOf(host) >= 0) clientId = CLIENT_IDS[host];
    }
    window.oauth.tokenName = $scope.definition.tokenName || 'access_token';
    window.oauth.tokenUrl = (flow === 'accessCode' ? $scope.definition.tokenUrl : null);
    var scopes = Object.keys(addedScopes).filter(function(name) {return addedScopes[name]});
    var state = Math.random();
    var redirect = 'https://lucybot.com:3011/html/oauth_callback.html';
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
