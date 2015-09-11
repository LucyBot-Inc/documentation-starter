var Path = require('path');

var Swagger = {};
module.exports = Swagger;

var Utils = require('./utils');
var Url = require('url');

var getSeparatorFromFormat = function(format) {
  if (!format || format === 'csv' || format === 'multi') {
    return ',';
  } else if (format === 'tsv') {
    return '\t';
  } else if (format === 'ssv') {
    return ' ';
  } else if (format === 'pipes') {
    return '|';
  }
}

var isShallowSchema = function(schema) {
  if (!schema || !schema.properties) return false;
  for (key in schema.properties) {
    var prop = schema.properties[key];
    if (prop.type === 'object' || prop.properties) {
      return false;
    }
  }
  return true;
}

var getShallowKeys = function(schema) {
  if (!schema || !schema.properties) return [];
  return Object.keys(schema.properties).filter(function(key) {
    var prop = schema.properties[key];
    if (prop.type === 'object' || prop.properties) {
      return false;
    } else if (prop.type === 'array') {
      if (!prop.items || !prop.items.type || prop.items.type === 'object' || prop.items.type === 'array') {
        return false;
      }
    }
    return true;
  })
}

var maybeResolveSchema = function(schema, spec) {
  if (!schema || !schema['$ref']) {
    return schema;
  }
  var parts = schema['$ref'].split('/');
  parts.shift();
  var cur = spec;
  parts.forEach(function(part) {
    if (!cur) return null;
    cur = cur[part];
  })
  return cur;
}

Swagger.import = function(spec, callback) {
  callback(null, {
    recipes: [],
    actions: Swagger.importActions(spec),
    views: Swagger.importViews(spec),
  })
}

var createInputsFromParameter = function(parameter, spec, name) {
  name = name || parameter.name;
  var input = {
      name: name,
      label: name,
      type: 'text',
      in: parameter.in || 'body_nested',
      parameter: parameter
  };
  if (parameter.description) {
    input.tip = parameter.description;
  }
  if (parameter.enum) {
    input.type = 'radio';
    input.choices = parameter.enum.map(function(choice) {
      return {label: choice, value: choice}
    })
  }

  input.default = parameter['x-consoleDefault'] || parameter.default;
  var inputs = [input];
  if (parameter.type === 'number' || parameter.type === 'integer') {
    input.type = 'number'
  } else if (parameter.type === 'boolean') {
    input.type = 'radio';
    input.choices = [
      {label: 'true', value: true},
      {label: 'false', value: false}
    ];
  } else if (parameter.type === 'array') {
    if (parameter.enum) {
      input.type = 'checkboxes';
    } else {
      input.type = 'dynamicArray';
    }
  } else if (parameter.schema) {
    var schema = maybeResolveSchema(parameter.schema, spec);
    inputs = [];
    if (schema) {
      getShallowKeys(schema).forEach(function(key) {
        inputs = inputs.concat(createInputsFromParameter(schema.properties[key], spec, key));
      })
    }
  }
  return inputs;
}

Swagger.importConsoles = function(spec) {
  var consoles = [];
  for (var path in spec.paths) {
    for (var verb in spec.paths[path]) {
      var route = spec.paths[path][verb];
      var inputs = [];
      route.parameters.forEach(function(parameter) {
        inputs = inputs.concat(createInputsFromParameter(parameter, spec));
      });
      consoles.push({
        path: path,
        method: verb,
        inputs: inputs,
        recipe: route['x-lucy/recipe'],
      });
    }
  }
  for (var def in spec.definitions) {
    var parameter = {
      name: 'def',
      in: 'body',
      schema: {'$ref': "#/definitions/" + def},
    }
    var inputs = createInputsFromParameter(parameter, spec);
    consoles.push({
      method: 'def',
      inputs: inputs,
      definition: def,
    })
  }
  return consoles;
}

Swagger.importRecipes = function(spec) {
  var recipes = [];
  var forceInsecure = spec.schemes.indexOf('https') === -1;
  for (path in spec.paths) {
    for (verb in spec.paths[path]) {
      var operation = spec.paths[path][verb];
      var action = operation.operationId;
      var response = getBestResponse(operation.responses);
      if (!response) continue;
      var schema = response.schema;
      var view = action + '_view';
      var views = Object.keys(spec.definitions);
      if (schema && schema['$ref']) {
        view = getViewFromRef(schema['$ref']);
      } else {
        views.push(view);
      }
      var controlSets = [{
        title: operation.summary || operation.description,
        tip: operation.summary ? operation.description : null,
        affects: action,
        inputs: []
      }, {
        title: "Here's one way to display the results",
        affects: view,
        inputs: []
      }];
      operation.parameters.forEach(function(parameter) {
        var inputs = createInputsFromParameter(parameter, spec);
        controlSets[0].inputs = controlSets[0].inputs.concat(inputs);
      })
      recipes.push({
        name: operation.operationId,
        title: operation.operationId,
        description: operation.description,
        force_insecure: forceInsecure,
        actions: [action],
        views: views,
        pages: [{
          view: view,
          data: {action: action}
        }],
        control_sets: controlSets
      })
    }
  }
  return recipes;
}

var getViewFromRef = function(ref) {
  return ref.substring(ref.lastIndexOf('/') + 1);
}

var getContentsFromSchema = function(schema, result, numSpaces) {
  if (!schema) return '';
  numSpaces = numSpaces || 0;
  var spaces = Array(numSpaces + 1).join(' ');
  result = result || 'result';
  var contents = '';

  if (schema['$ref']) {
    contents += '<%- Lucy.include("' + getViewFromRef(schema['$ref']) + '", {result: "' + result + '", indent: ' + numSpaces + '}) %>\n';
  } else if (schema.type === 'object' || schema.properties || schema.additionalProperties) {
    for (attr in schema.properties) {
      contents += getContentsFromSchema(schema.properties[attr], result + '.' + attr, numSpaces);
    }
  } else if (schema.type === 'array') {
    var iterator = result.substring(result.lastIndexOf('.') + 1) + '_item';
    contents += spaces + '<%- Lucy.code.for("' + iterator + ' in ' + result + '") %>\n';
    contents += getContentsFromSchema(schema.items, iterator, numSpaces + 2);
    contents += spaces + '<%- Lucy.code.rof() %>\n';
  } else if (schema.type === 'integer' ||
             schema.type === 'number' ||
             schema.type === 'string' ||
             schema.type === 'boolean') {
    contents += spaces + '<p><b>' + result.substring(result.lastIndexOf('.') + 1) + '</b>:' +
                ' <%- Lucy.code.variable("' + result + '") %></p>\n'
  } else {
    contents = '';
  }
  return contents;
}

var getBestResponse = function(responses) {
  for (code in responses) {
    if (code.indexOf('2') === 0) {
      return responses[code];
    }
  }
  return responses.default;
}

Swagger.importViews = function(spec) {
  var views = [];
  for (name in spec.definitions) {
    var def = spec.definitions[name];
    var contents = getContentsFromSchema(def);
    views.push({
      name: name,
      language: 'html',
      contents: contents,
    })
  }

  for (path in spec.paths) {
    for (verb in spec.paths[path]) {
      var response = getBestResponse(spec.paths[path][verb].responses);
      if (!response) continue;
      if (response.schema && response.schema['$ref']) continue;
      var contents = '<h2>' + response.description + '</h2>\n';
      contents += getContentsFromSchema(response.schema);
      views.push({
        name: spec.paths[path][verb].operationId + '_view',
        language: 'html',
        contents: contents
      })
    }
  }

  return views;
}

Swagger.importActions = function(spec, options) {
  options = options || {};
  var actions = [];
  var protocol = spec.schemes[0];
  if (spec.schemes.indexOf('https') !== -1) {
    protocol = 'https';
  }

  var oauthFlow = null;
  for (def in spec.securityDefinitions) {
    if (spec.securityDefinitions[def].type === 'oauth2') {
      oauthFlow = spec.securityDefinitions[def].flow;
    }
  }
  var paths = Object.keys(spec.paths);
  var domain = spec.host;
  var basePath = spec.basePath || '';
  if (basePath.lastIndexOf('/') === basePath.length - 1) basePath = basePath.substring(0, basePath.length - 1);
  paths.forEach(function(path) {
    var verbs = Object.keys(spec.paths[path]);
    for (var i = 0; i < verbs.length; ++i) {
      var verb = verbs[i];
      var params = spec.paths[path][verb].parameters || [];
      var query = {};
      var headers = {};
      var body = {};
      if (oauthFlow === 'implicit') {
        query['access_token'] = {answer: 'oauth2'}; 
      } else {
        headers['Authorization'] = {join: ['Bearer ', {answer: 'oauth2'}]};
      }
      var pathParts = [basePath + path];
      while (pathParts[0].indexOf('/') === 0) pathParts[0] = pathParts[0].substring(1);
      while (pathParts[pathParts.length-1].indexOf('{') !== -1) {
        var backPart = pathParts[pathParts.length-1];
        var start = backPart.indexOf('{');
        var end = backPart.indexOf('}');
        var newParts = [
          backPart.substring(0, start),
          {answer: backPart.substring(start + 1, end)},
          backPart.substring(end + 1)
        ]
        pathParts.pop();
        pathParts = pathParts.concat(newParts);
      }
      pathParts = pathParts.filter(function(part) {return part});
      params.forEach(function(param) {
        if (param.in === 'query') {
          var ans = {answer: param.name};
          if (param.type === 'array') {
            var sep = getSeparatorFromFormat(param.collectionFormat);
            if (sep) ans = {join: ans, on:sep};
          }
          query[param.name] = ans;
        } else if (param.in === 'body') {
          var schema = maybeResolveSchema(param.schema, spec);
          if (schema) {
            for (key in getShallowKeys(schema)) {
              body[key] = {answer: key}
            }
          } else {
            body = {answer: param.name}
          }
        } else if (param.in === 'header') {
          headers[param.name] = {answer: param.name}
        } else if (param.in === 'path') {
          // handled above
        } else {
          console.log('unknown parameter location:' + param.in);
        }
      })
      var actionOpts = {
        protocol: protocol,
        domain: spec.host,
        method: verb,
        path: pathParts.length === 1 ? (pathParts[0] || '') : {join: pathParts},
        query: query,
        headers: headers,
        body: body,
      }
      if (options.proxy) {
        var proxyHost = process.env.PROXY_HOST || 'https://api.lucybot.com';
        proxyHost = Url.parse(proxyHost);
        var newPath = 'proxy/' + actionOpts.protocol + '/' + actionOpts.domain;
        if (typeof actionOpts.path === 'string') {
          if (actionOpts.path.indexOf('/') === 0) actionOpts.path = actionOpts.path.substring(1);
          actionOpts.path = newPath + '/' + actionOpts.path;
        } else if (actionOpts.path.join) {
          actionOpts.path.join.unshift(newPath + '/')
        } else {
          console.log('ERROR: couldn\'t alter path for proxy', actionOpts.path);
        }
        actionOpts.domain = proxyHost.hostname + (proxyHost.port ? ':' + proxyHost.port : '');
        actionOpts.protocol = proxyHost.protocol;
        if (actionOpts.protocol.indexOf(':') !== -1) {
          actionOpts.protocol = actionOpts.protocol.substring(0, actionOpts.protocol.length - 1);
        }
      }
      var action = Utils.createAction(actionOpts, spec.paths[path][verb].operationId || verb + path);
      actions.push(action);
    }
  })
  return actions;
}
