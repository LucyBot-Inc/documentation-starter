var FS = require('fs');
var Https = require('https');
var UglifyJS = require('uglify-js');
var CleanCSS = require('clean-css');
var Express = require('express');
var App = Express();

App.set('views', __dirname + '/views')
App.set('view engine', 'jade');
App.engine('jade', require('jade').__express);

App.use(require('compression')());
var ONE_HOUR = 1000 * 60 * 60;
App.use(Express.static(__dirname + '/static', {maxAge: ONE_HOUR}));

App.use(require('./routes/pages.js'));
['proxy'].forEach(function(route) {
  App.use('/' + route, require('./routes/' + route + '.js'));
});

var toMinify = [{
  fileIn: [
    "static/bower/jquery/dist/jquery.min.js",
    "static/bower/bootstrap/dist/js/bootstrap.min.js",
    "static/bower/angular/angular.min.js",
    "static/bower/highlightjs/highlight.pack.js",
    "static/bower/zeroclipboard/dist/ZeroClipboard.min.js",
    "static/bower/marked/lib/marked.js",
    "static/bower/swagger-parser/dist/swagger-parser.min.js",
    "static/js/examples.js",
    "static/js/lucy.js",
    "static/bower/angular-zeroclipboard/src/angular-zeroclipboard.js",
    "static/bower/angular-highlightjs/angular-highlightjs.min.js",
    "static/bower/angular-marked/angular-marked.js",
    "static/js/ng/app.js",
    "static/js/ng/portal.js",
    "static/js/ng/documentation.js",
    "static/js/ng/console.js",
    "static/js/ng/oauth2.js",
    "static/js/sort-routes.js",
    "static/js/ng/parameter.js",
    "static/js/ng/spec-url.js",
  ],
  fileOut: 'static/minified/js/deps.js',
}, {
  fileIn: [
    "static/less/styles.css",
    "static/bower/highlightjs/styles/github.css",
    "static/bower/highlightjs/styles/atelier-forest.light.css",
    "static/css/portal.css",
    "static/css/spec-url.css",
    "static/css/verb-colors.css",
    "static/css/documentation.css",
    "static/css/console.css",
  ],
  fileOut: 'static/minified/css/all.css',
  processor: function(code) { return new CleanCSS().minify(code).styles }
}]

toMinify.forEach(function(m) {
  var inFiles = m.fileIn.map(function(f) {
    return FS.readFileSync(__dirname + '/' + f, 'utf8')
  });
  var concat = inFiles.join('\n');
  if (m.processor) concat = m.processor(concat);
  FS.writeFileSync(__dirname + '/' + m.fileOut, inFiles.join('\n'));
})

App.listen(process.env.LUCY_CONSOLE_PORT || 3010);
if (!process.env.DEVELOPMENT) {
  var Creds = require('../lucybot-com/creds.js');
  Https.createServer(Creds.ssl, App).listen(3011, '0.0.0.0');
}

