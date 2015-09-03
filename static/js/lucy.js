var LUCY_DONE = function(callback) {
  return function(response, status, request) {
     var isJson = request.getResponseHeader('Content-Type').indexOf('application/json') !== -1;
     if (isJson && response.error) {
       callback(response);
     } else {
       callback(null, response);
     }
  }
}

var LUCY_FAIL = function(callback) {
  return function(xhr, details) {
    if (xhr.responseJSON) return callback(xhr.responseJSON);
    else callback({message: "Could not connect to LucyBot"});
  }
}

Lucy = {
  get: function(path, input, callback) {
    if (!callback) {
      callback = input;
      input = {};
    };
    var query = '';
    for (key in input) {
      if (!query) query = '?';
      else query += '&';
      query += key + '=' + encodeURIComponent(input[key]);
    }
    $.ajax({
      method: 'get',
      url: BASE_URL + path + query,
    }).done(LUCY_DONE(callback)).fail(LUCY_FAIL(callback))
  },
  post: function(path, input, callback) {
    if (!callback) {
      callback = input;
      input = {};
    };
    $.ajax({
      method: 'post',
      url: BASE_URL + path,
      data: JSON.stringify(input),
      headers: {'Content-Type': 'application/json'}
    }).done(LUCY_DONE(callback)).fail(LUCY_FAIL(callback));
  }
}
