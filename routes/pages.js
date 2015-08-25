var Render = require('../middleware/render.js');

var Router = module.exports = require('express').Router();

var renderOpts = {
  specURL: '',
}

Router.get('/', Render('portal', renderOpts));

Router.get('/embed', function(req, res) {
  Render('portal', {
    specURL: req.query.swaggerURL,
    enableMixpanel: !process.env.DEVELOPMENT,
    isAnyAPI: req.query.any_api,
  })(req, res);
});
