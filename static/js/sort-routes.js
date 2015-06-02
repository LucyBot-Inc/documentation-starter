var METHOD_ORDER = [
  'def', 'get', 'post', 'patch', 'put', 'delete'
];

var SORT_ROUTES = function(a, b) {
  var ret = METHOD_ORDER.indexOf(a.method) - METHOD_ORDER.indexOf(b.method);
  if (ret) return ret;
  var compA = a.path || a.definition;
  var compB = b.path || b.definition;
  if (compA > compB) return 1;
  else if (compA < compB) return -1;
  return 0;
}
