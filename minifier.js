var FS = require('fs');
var UglifyJS = require('uglify-js');
var CleanCSS = require('clean-css');

var Router = module.exports = require('express').Router();

var toMinify = [{
  fileIn: [
    "static/bower/jquery/dist/jquery.min.js",
    "static/bower/bootstrap/dist/js/bootstrap.min.js",
    "static/bower/angular/angular.min.js",
    "static/bower/highlightjs/highlight.pack.js",
    "static/bower/zeroclipboard/dist/ZeroClipboard.min.js",
    "static/bower/marked/lib/marked.js",
    "static/bower/swagger-parser/dist/swagger-parser.min.js",
    "static/js/smooth-scroll.js",
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
  ],
  fileOut: 'static/minified/js/all.js',
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

var minify = function(m) {
  var inFiles = m.fileIn.map(function(f) {
    return FS.readFileSync(__dirname + '/' + f, 'utf8')
  });
  var concat = inFiles.join(m.join || '\n');
  if (m.processor) concat = m.processor(concat);
  FS.writeFileSync(__dirname + '/' + m.fileOut, concat);
};

toMinify.forEach(minify);

if (process.env.DEVELOPMENT) {
  toMinify.forEach(function(m) {
    Router.get(m.fileOut.substring(6), function(req, res, next) {
      minify(m);
      next();
    })
  })
}
