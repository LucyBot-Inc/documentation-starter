var Https = require('https');
var Express = require('express');
var App = Express();

App.set('views', __dirname + '/views')
App.set('view engine', 'jade');
App.engine('jade', require('jade').__express);

App.use(require('compression')());
App.use(require('./minifier.js'));

var ONE_HOUR = 1000 * 60 * 60;
if (process.env.DEVELOPMENT) {
  App.use(Express.static(__dirname + '/static'));
} else {
  App.use(Express.static(__dirname + '/static', {maxAge: ONE_HOUR}));
}

App.use(require('./routes/pages.js'));
['proxy'].forEach(function(route) {
  App.use('/' + route, require('./routes/' + route + '.js'));
});

App.listen(process.env.LUCY_CONSOLE_PORT || 3010);
if (!process.env.DEVELOPMENT) {
  var Creds = require('../lucybot-com/creds.js');
  Https.createServer(Creds.ssl, App).listen(3011, '0.0.0.0');
}

