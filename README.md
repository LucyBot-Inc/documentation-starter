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

App.use(hackerNewsConsole.router);

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
App.use('/api', myConsole.router);
```

## Visual Overlays
In addition to showing the raw output of your API, the LucyBot Console UI allows you to display neatly-formatted output using snippets of HTML.

Views are snippets of HTML for displaying responses from the API. Any valid HTML can be used here, including ```<script>``` and ```<style>``` tags.  You can attach HTML to any endpoint's response, or to a definition's schema, by adding the field 'x-lucy/view'.

LucyBot also provides some helper tags:
* Use ```{{ variable.name }}``` to print the value of a given variable
* Use ```<lucy for="thing" in="array">``` to iterate over an array
* Use ```<lucy if="condition">``` to add conditionals
* Use ```<lucy include="ViewName">``` to include other views

You have access to two global variables inside of your views:
* ```result``` which is the API's response (but can be overriden via ```<lucy include>```)
* ```answers``` which contains the user's responses from inside the recipe

```<lucy include>``` can operate in two different ways:

1. It can simply copy the HTML of the included view

2. It can make a new call to the API, and use the included view as a template for displaying the result.

Case (1) is the default behavior. In addition, you can use ```<lucy include="ViewName" resultvar="foo">``` to use variable "foo" in place of API output.

Case (2) is useful if you need more data from the API. You can specify ```action```, which is the name of the action to use, and ```inputvars``` which is a mapping from variable names to API inputs.

### Example
Let's consider an API with two endpoints:
* ```GET /users```, which returns an array of user IDs
* ```GET /users/{id}```, which returns the details for a given user

First let's tell LucyBot how to display the details for a given User by setting
``` swagger.definitions.User['x-lucy/view'] ```

```html
<h2>{{ result.name }}</h2>
<p>{{ result.about }}</p>
```

Next let's tell LucyBot to use that view for the /users/{id} endpoint by setting
``` swagger.paths['/users/{id}'].responses['200']['x-lucy/view'] ```

```html
<lucy include="User"></lucy>
```

For the /users endpoint, we only get an array of user IDs. In order to display their details, we'll need to tell LucyBot to call the /users/{id} endpoint. For this example, we assume GET /users/{id} has its operationId set to "getUserById". To show the details for the first 10 users, set
``` swagger.paths['/users'].responses['200']['x-lucy/view'] ```

```html
<lucy for="userID" in="result">
  <lucy if="index < 10">
    <lucy include="User" action="getUserById" inputvars="{id: userID}">
    </lucy>
  </lucy>
</lucy>
```

