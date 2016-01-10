var App = angular.module('App', ['hc.marked', 'zeroclipboard', 'hljs', 'xeditable', 'ui.codemirror'])
App.run(function(editableOptions) {
  editableOptions.buttons = 'no';
  editableOptions.theme = 'bs3';
});
App.service('spec', function($http) {
  var promise = $http.get(SPEC_URL).success(function(data) {
    return data.data;
  })
  return promise;
})
App.config(['markedProvider', function(markedProvider) {
  markedProvider.setOptions({
    gfm: true,
    highlight: function (code) {
      return hljs.highlightAuto(code).value;
    }
  });
  markedProvider.setRenderer({
    link: function(href, title, text) {
      return '<a href="' + href + '"' + ' target="_blank">' + text + '</a>';
    }
  });
}]);
App.config(['uiZeroclipConfigProvider', function(uiZeroclipConfigProvider) {
  uiZeroclipConfigProvider.setZcConf({
    swfPath: BASE_URL + '/swf/ZeroClipboard.swf'
  });
}])
App.controller('Body', function($scope) {});

