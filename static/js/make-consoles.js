Consoles = {};

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
  if (parameter.default) {
    input.default = parameter.default;
  }

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
    getShallowKeys(parameter.schema).forEach(function(key) {
      inputs = inputs.concat(createInputsFromParameter(parameter.schema.properties[key], spec, key));
    })
  }
  return inputs;
}

Consoles.generate = function(spec) {
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
