var FS = require('fs');
var Path = require('path');
var Express = require('express');
var Jade = require('jade');

var ConsoleRouter = module.exports = function(options) {
  var self = this;
  self.options = options || {};
  self.options.rootDir = self.options.rootDir || '/';

  self.router = Express.Router();
  self.router.use(require('compression')());
  self.router.use(require('./minifier.js'));
  if (self.options.cache) {
    self.router.use(Express.static(__dirname + '/static', {maxAge: self.options.cache}));
  } else {
    self.router.use(Express.static(__dirname + '/static'));
  }
  if (self.options.proxy) {
    self.router.use('/proxy', require('./routes/proxy.js'));
  }
  var codeRouter = require('./routes/code.js');
  self.router.use('/code', codeRouter);

  if (self.options.swagger) {
    codeRouter.swagger = self.options.swagger;
    self.router.get('/swagger.json', function(req, res) {
      res.json(self.options.swagger);
    });
  }

  var renderOpts = {
    specURL: Path.join(self.options.rootDir, '/swagger.json'),
    enableMixpanel: self.options.mixpanel,
    isAnyAPI: self.options.any_api,
    proxyHost: self.options.proxy,
  }
  var jadeFile = __dirname + '/views/portal.jade';
  var portal = Jade.compile(FS.readFileSync(jadeFile, 'utf8'), {filename: jadeFile});

  self.router.get('/console', function(req, res) {
    res.send(portal(renderOpts));
  });
}
