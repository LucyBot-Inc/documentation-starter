var Render = require('../middleware/render.js');

var Router = module.exports = require('express').Router();

var consoleImports = [
 // {name: 'zerocliboard', file: "/bower/angular-zeroclipboard/src/angular-zeroclipboard.js"},
  {name: 'hljs', file: "/bower/angular-highlightjs/angular-highlightjs.min.js"}
];

Router.get('/', Render('console', {angularImports: consoleImports}));
