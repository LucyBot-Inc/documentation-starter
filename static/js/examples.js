var EXAMPLES = {};
EXAMPLES.parameterExample = function(param, path) {
  var ret = '';
  if (param.format === 'date') {
    ret = '1987-09-23';
  } else if (param.format === 'date-time') {
    ret = '1987-09-23T18:30:00Z';
  } else if (param.type === 'integer') {
    ret = '123';
  } else if (param.type === 'number') {
    ret = '1.23';
  } else if (param.type === 'string') {
    ret = 'xyz';
  } else if (param.type === 'boolean') {
    ret = 'true';
  } else if (param.type === 'array') {
    var choices = [];
    if (param.enum) {
      choices = param.enum.filter(function(choice, idx) {return idx < 2});
    } else if (param.items) {
      if (param.items.type === 'string') {
        choices = ['foo', 'bar'];
      } else if (param.items.type === 'integer') {
        choices = ['1', '2', '3'];
      } else if (param.items.type === 'number') {
        choices = ['1.0', '2.0', '3.0'];
      } else if (param.items.type === 'boolean') {
        choices = ['true', 'false'];
      } else {
        choices = [parameterExample(param.items, path)];
      }
    }
    if (param.collectionFormat === 'csv') {
      ret = choices.join(',');
    } else if (param.collectionFormat === 'ssv') {
      ret = choices.join(' ');
    } else if (param.collectionFormat === 'tsv') {
      ret = choices.join('\\t');
    } else if (param.collectionFormat === 'pipes') {
      ret = choices.join('|');
    } else if (param.collectionFormat === 'multi') {
      ret = choices[0];
    } else {
      ret = choices.join();
    }
  }
  if (param.enum && param.type !== 'array') {
    ret = param.enum[0];
  }
  if (param.in === 'path') {
    ret = path.replace('{' + param.name + '}', ret);
  } else if (param.in === 'query') {
    ret = '?' + param.name + '=' + ret;
  } else if (param.in === 'header') {
    ret = param.name + ': ' + ret;
  }
  return ret;
}

EXAMPLES.schemaExample = function(schema, readable) {
  if (!schema) return '';
  if (schema.type === 'array') {
    return [EXAMPLES.schemaExample(schema.items, readable)]
  } else if (schema.type === 'object' || schema.properties) {
    var ret = {};
    if (schema.properties) {
      for (key in schema.properties) {
        ret[key] = EXAMPLES.schemaExample(schema.properties[key], readable)
      }
    }
    if (schema.additionalProperties) {
      var example = EXAMPLES.schemaExample(schema.additionalProperties, readable);
      ret['item1'] = example;
      ret['item2'] = example;
    }
    return ret;
  } else if (schema.type === 'integer') {
    return readable ? 123 : 0;
  } else if (schema.type === 'number') {
    return readable ? 1.23 : 0.0;
  } else if (schema.type === 'string') {
    return readable ? "xyz" : "string";
  } else if (schema.type === 'boolean') {
    return true;
  } else {
    console.log('unknown type:' + schema.type);
  }
}

EXAMPLES.resolveSchema = function(obj, schema) {
  if (typeof schema !== 'object') return schema;
  var ret = {};
  for (key in schema) {
    if (key === '$ref') {
      ret = EXAMPLES.resolveSchema(obj, EXAMPLES.resolveRef(obj, schema[key]));
      break;
    } else {
      ret[key] = EXAMPLES.resolveSchema(obj, schema[key]);
    }
  }
  return ret;
}

EXAMPLES.resolveRef = function(object, ref) {
  var parts = ref.split('/');
  parts.shift();
  var cur = object;
  parts.forEach(function(part) {
    cur = cur[part];
  });
  return cur === object ? null : cur;
}

