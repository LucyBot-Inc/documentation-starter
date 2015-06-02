var Request = require('request');

var Router = module.exports = require('express').Router();

Router.use('/:protocol/:host', function(req, res, next) {
  req.proxy = {path: '', protocol: req.params.protocol, host: req.params.host};
  next();
})

Router.use('/:protocol/:host/:path*', function(req, res, next) {
  var path = req.params.path;
  var prefix = '/proxy/' + req.params.protocol + '/' + req.params.host + '/';
  req.proxy.path = req.originalUrl.substring(prefix.length);
  next();
});

Router.all('*', function(req, res) {
  var url = req.proxy.protocol + '://' + req.proxy.host + '/' + req.proxy.path;
  var handleErr = function() {
    res.status(500).json({error: "Error connecting to " + url})
  }
  try {
    req.pipe(Request({
      url:url,
      qs: req.query,
    }).on('error', handleErr)).pipe(res).on('error', handleErr);
  } catch (e) {
    handleErr(e);
  }
});
