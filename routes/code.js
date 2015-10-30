var Util = require('util');
var Request = require('request');
var Codegen = require('lucy-codegen');
var RequestBuilder = Codegen.generators.request;
var Router = module.exports = require('express').Router();

var SwaggerImporter = require('../lib/swagger-importer.js');

Router.use(require('body-parser').json({limit: '500kb'}));

Router.get('/languages', function(req, res) {
  res.json(RequestBuilder.getLanguages());
});

Router.post('/build/request', function(req, res) {
  RequestBuilder.build(req.body, function(err, code) {
    if (err) return res.status(500).json(err);
    else res.json({code: code});
  })
})

var getSpec = function(req, res, next) {
 if (req.body && req.body.swagger) {
   req.swagger = req.body.swagger;
 } else if (Router.swagger) {
   req.swagger = Router.swagger;
 }
 next();
}

var buildEmbed = function(req, res) {
  var buildOpts = {
    language: 'javascript',
    main: {},
    answers: Util._extend({}, req.body.answers, req.body.keys),
    actions: {},
    views: {},
  };
  var path = req.swagger.paths[req.body.path];
  if (!path) return res.status(400).json({error: "Path " + req.body.path + " not found"});
  var route = path[req.body.method];
  if (!route) return res.status(400).json({error: "Method " + req.body.method + " not found for path " + req.body.method});
  route.responses = route.responses || {}
  route.responses['200'] = route.responses['200'] || {};

  var viewName = (req.body.method + req.body.path + '200').replace(/\W/g, '');
  buildOpts.views[viewName] = {};
  buildOpts.views[viewName].all = route.responses['200']['x-lucy/view'] || '';
  buildOpts.main.view = viewName;
  buildOpts.main.data = {
    action: (route.operationId || req.body.method + req.body.path).replace(/\W/g, ''),
    answers: JSON.parse(JSON.stringify(buildOpts.answers)),
  };
  for (var def in req.swagger.definitions) {
    var viewName = def.replace(/\W/g, '');
    var view = buildOpts.views[viewName] = {};
    view.all = req.swagger.definitions[def]['x-lucy/view'] || '';
  }
  var opts = {proxy: Router.proxy};
  var actions = SwaggerImporter.importActions(req.swagger, opts);
  actions.forEach(function(action) {
    action.name = action.name.replace(/\W/g, '');
    buildOpts.actions[action.name] = {};
    buildOpts.actions[action.name].javascript = action.contents;
  })

  Codegen.generators.app.build(buildOpts, function(err, files) {
    res.send(files[0].contents);
  })
}
Router.post('/build/embed', getSpec, buildEmbed);

