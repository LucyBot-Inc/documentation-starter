module.exports = function(tmpl, inputs) {
  inputs = inputs || {};
  inputs.page = tmpl;
  inputs.angularImports = inputs.angularImports || [];
  return function(req, res) {
    res.render(tmpl, inputs);
  }
}
