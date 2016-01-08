var FS = require('fs');
var App = require('express')();
var GalleryRouter = require('./index.js').GalleryRouter;

var strapping = !process.env.DEVELOPMENT ? null : {
  css: __dirname + '/static/css/bootstrap.css',
  config: __dirname + '/static/css/bootstrap-config.css',
}

var router = new GalleryRouter({
  proxy: true,
  enableEditor: true,
  apis: [{
    name: 'hacker_news',
    swagger: JSON.parse(FS.readFileSync(__dirname + '/examples/hacker_news.json')),
  }],
  cssIncludes: [__dirname + '/static/css/bootstrap.css'],
  galleryInfo: {
    title: "Sample APIs"
  },
  development: process.env.DEVELOPMENT ? true : false,
  strapping: strapping,
});

App.use(router.router);

App.listen(process.env.LUCY_CONSOLE_PORT || 3010);

