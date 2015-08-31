var Path = require('path');
var Jade = require('jade');

var viewDir = Path.join(__dirname, '../views');

module.exports = function(tmpl, inputs) {
  var render = Jade.compile(Path.join(viewDir, tmpl + '.jade'))
  inputs = inputs || {};
  inputs.page = tmpl;
  inputs.angularImports = inputs.angularImports || [];
  return function(req, res) {
    res.send(render(tmpl), inputs);
  }
}
