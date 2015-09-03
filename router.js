var _ = require('underscore');
var FS = require('fs');
var Path = require('path');
var Express = require('express');
var Jade = require('jade');

var ConsoleRouter = module.exports = function(options) {
  var self = this;
  self.options = options || {};
  self.options.basePath = self.options.basePath || '';
  self.options.oauth_callback = self.options.oauth_callback || '';

  self.router = Express.Router();
  self.router.use(require('compression')());
  self.router.use(require('./minifier.js'));
  if (self.options.cache) {
    self.router.use(Express.static(__dirname + '/static', {maxAge: self.options.cache}));
  } else {
    self.router.use(Express.static(__dirname + '/static'));
  }
  if (self.options.proxy === true) {
    self.router.use('/proxy', require('./routes/proxy.js'));
  }
  var codeRouter = require('./routes/code.js');
  self.router.use('/code', codeRouter);
  codeRouter.proxy = self.options.proxy;

  var renderOpts = {
    enableMixpanel: self.options.mixpanel,
    isAnyAPI: self.options.any_api,
    proxyHost: self.options.proxy,
    client_ids: self.options.client_ids || {},
    oauth_callback: self.options.oauth_callback,
    basePath: self.options.basePath,
  }
  if (self.options.swagger) {
    renderOpts.specURL = self.options.basePath + '/swagger.json',
    codeRouter.swagger = self.options.swagger;
    self.router.get('/swagger.json', function(req, res) {
      res.json(self.options.swagger);
    });
  }

  var jadeFile = __dirname + '/views/portal.jade';
  var portal = Jade.compile(FS.readFileSync(jadeFile, 'utf8'), {filename: jadeFile});
  self.router.get('/console', function(req, res) {
    var ext = {};
    if (!renderOpts.specURL) ext.specURL = req.query.swaggerURL || '';
    res.send(Jade.renderFile(jadeFile, _.extend(ext, renderOpts)));
  });
}
