var Utils = {};
module.exports = Utils;

Utils.createRecipe = function(){}
Utils.createView = function(){}

Utils.createActionName = function(params) {
  var filenameParts = typeof params.path === 'string' ? [params.path] : params.path.join.filter(function(piece) {
    return typeof piece === 'string';
  })
  filenameParts = filenameParts.map(function(part) {
    return part.replace(/\//g, '_').replace(/\W/g, '');
  })
  filenameParts.unshift(params.method);
  filename = filenameParts.join('_');
  return filename;
}

Utils.createAction = function(params, filename) {
  if (!filename) {
    fileame = Utils.createActionName(params);
  }
  var contents = '<%-\n' +
    'Lucy.code.request(' + JSON.stringify(params, null, 2) + ');\n' +
    '%>';

  return {name: filename, contents: contents, language: 'request', type: 'action', params: params};
}
