# lucy-console

This respository contains the LucyBot API Console UI. It uses Swagger 2.0 to generate documentation and a console for your API.

## Sample Usage
```js
var FS = require('fs');
var App = require('express')();
var LucyConsole = require('lucy-console');

var SWAGGER_FILE = __dirname + '/node_modules/lucy-console/examples/hacker_news.json';
var hackerNewsConsole = new LucyConsole({
  swagger: JSON.parse(FS.readFileSync(SWAGGER_FILE, 'utf8')),
});

App.get('/', function(req, res) {
  res.redirect('/console');
});

App.use(Console.router);

App.listen(process.env.PORT || 3000);
```

## Options
You can initialize a LucyConsole object with a few different options:
```js
var LucyConsole = require('lucy-console');
var myConsole = new LucyConsole({
  swagger: swagger, // A JS object representing your Swagger specification
  basePath: '/api', // The path on which the router will be mounted
  oauth_callback: 'https://example.com/api/html/oauth_callback.html', // The URL that the user will be redirected to after authorization. A default callback page is provided at /{basePath}/html/oauth_callback.html
  client_ids: { // A mapping from hostname to OAuth2 client IDs
    'example.com': 'abcd1234'
  },
  cache: 1000 * 60 * 60, // The number of ms to cache static assets like JS and CSS
});
App.use('/api', Console.router);
```
