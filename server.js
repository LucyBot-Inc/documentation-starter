var FS = require('fs');
var App = require('express')();
var GalleryRouter = require('./index.js').GalleryRouter;

var router = new GalleryRouter({
  proxy: true,
  enableEditor: true,
  apis: [{
    name: 'hacker_news',
    swagger: JSON.parse(FS.readFileSync(__dirname + '/examples/hacker_news.json')),
  }],
  galleryInfo: {
    title: "My APIs"
  },
  development: process.env.DEVELOPMENT ? true : false,
});

App.use(router.router);

App.listen(process.env.LUCY_CONSOLE_PORT || 3010);

