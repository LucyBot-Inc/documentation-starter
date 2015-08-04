var Render = require('../middleware/render.js');

var Router = module.exports = require('express').Router();

var consoleImports = [
 // {name: 'zerocliboard', file: "/bower/angular-zeroclipboard/src/angular-zeroclipboard.js"},
  {name: 'hljs', file: "/bower/angular-highlightjs/angular-highlightjs.min.js"},
  {name: 'hc.marked', file: '/bower/angular-marked/angular-marked.js'}
];

var renderOpts = {
  angularImports: consoleImports,
  specURL: '',
}

Router.get('/', Render('portal', renderOpts));

Router.get('/embed', function(req, res) {
  Render('portal', {
    angularImports: renderOpts.angularImports,
    specURL: req.query.swaggerURL,
  })(req, res);
});
