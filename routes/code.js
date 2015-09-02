var Request = require('request');
var Codegen = require('lucy-codegen');
var RequestBuilder = Codegen.generators.request;
var Router = module.exports = require('express').Router();

var SwaggerImporter = require('../lib/swagger-importer.js');

Router.use(require('body-parser').json());

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
 if (Router.swagger) {
   req.swagger = Router.swagger;
   return next();
 }
 Request.get(req.query.lucy_swaggerURL, {json: true}, function(err, resp, body) {
   if (err) return res.status(500).json(err);
   req.swagger = body;
   next();
 })
}

Router.get('/build/embed', getSpec, function(req, res) {
  var buildOpts = {
    language: 'javascript',
    main: {},
    answers: {},
    actions: {},
    views: {},
  };
  var path = req.swagger.paths[req.query.lucy_path];
  if (!path) return res.status(400).json({error: "Path " + req.query.lucy_path + " not found"});
  var route = path[req.query.lucy_method];
  if (!route) return res.status(400).json({error: "Method " + req.query.lucy_method + " not found for path " + req.query.lucy_path});
  route.responses = route.responses || {}
  route.responses['200'] = route.responses['200'] || {};

  for (key in req.query) {
    if (key.indexOf('lucy_') === 0) continue;
    try {
      buildOpts.answers[key] = JSON.parse(req.query[key]);
    } catch (e) {
      return res.status(400).json({error: "Could not parse answer " + key + '=' + req.query[key]})
    }
  }
  var viewName = (req.query.lucy_method + req.query.lucy_path + '200').replace(/\W/g, '');
  buildOpts.views[viewName] = {};
  buildOpts.views[viewName].all = route.responses['200']['x-lucy/view'] || '';
  buildOpts.main.view = viewName;
  buildOpts.main.data = {
    action: (route.operationId || req.query.lucy_method + req.query.lucy_path).replace(/\W/g, ''),
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
})
