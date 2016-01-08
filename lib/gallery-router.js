var Jade = require('jade');
var Express = require('express');
var _ = require('lodash');
var Marked = require('marked');

var ConsoleRouter = require('./console-router.js');

var GalleryRouter = module.exports = function(opts) {
  var self = this;
  self.options = opts;
  self.options.basePath = self.options.basePath || '';

  self.router = Express.Router();
  if (self.options.cache) {
    self.router.use(Express.static(__dirname + '/../static', {maxAge: self.options.cache}));
  } else {
    self.router.use(Express.static(__dirname + '/../static'));
  }
  var assetManager = require('../asset-manager.js')({
    basePath: self.options.basePath,
    development: self.options.development,
  });

  if (self.options.proxy === true) {
    self.router.use('/proxy', require('../routes/proxy.js'));
  }

  self.apiList = self.options.apis.map(function(api) {
    return {
      name: api.name,
      tags: api.tags,
      disabled: api.disabled,
      info: api.swagger.info || {},
    }
  });
  var renderOpts = {
    assetManager: assetManager,
    tags: self.options.tags || [],
    basePath: self.options.basePath,
    galleryInfo: self.options.galleryInfo,
    cssIncludes: self.options.cssIncludes || [],
    jsIncludes: self.options.jsIncludes || [],
    Marked: Marked,
  }
  self.router.get('/', function(req, res) {
    res.send(Jade.renderFile(__dirname + '/../views/gallery/gallery.jade', renderOpts))
  })

  self.router.get('/apis', function(req, res) {
    res.json(self.apiList);
  });

  self.options.apis.forEach(function(api) {
    var consoleOpts = _.extend({}, opts);
    consoleOpts.swagger = api.swagger;
    consoleOpts.assetManager = assetManager;
    if (api.strapping) consoleOpts.strapping = api.strapping;
    consoleOpts.cssIncludes = (consoleOpts.cssIncludes || []).concat(api.cssIncludes || [])
    consoleOpts.jsIncludes = (consoleOpts.jsIncludes || []).concat(api.jsIncludes || [])
    var path = '/' + api.name;
    consoleOpts.basePath += path;
    var consoleRouter = new ConsoleRouter(consoleOpts);
    self.router.use(path, consoleRouter.router);
  });
}
