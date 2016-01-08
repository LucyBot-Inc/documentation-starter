var FS = require('fs');
var App = require('express')();
var GalleryRouter = require('./index.js').GalleryRouter;


var apis = FS.readdirSync(__dirname + '/examples').map(function(file) {
  var swagger = JSON.parse(FS.readFileSync(__dirname + '/examples/' + file, 'utf8'))
  var name = file.substring(0, file.length - 5);
  var bootstrapCSS = '/css/' + name + '/bootstrap.css'
  var strappingOpts = !process.env.DEVELOPMENT ? null : {
    css: __dirname + '/static' + bootstrapCSS,
    config: __dirname + '/static/css/' + name + '/bootstrap-config.css',
  }
  var cssIncludes = [bootstrapCSS];

  var overrideCSS = '/css/' + name + '/styles.css';
  if (FS.existsSync(__dirname + '/static' + overrideCSS)) cssIncludes.push(overrideCSS);
  return {name: name, swagger: swagger, strapping: strappingOpts, cssIncludes: cssIncludes}
})

var router = new GalleryRouter({
  proxy: true,
  enableEditor: true,
  apis: apis,
  galleryInfo: {
    title: "LucyBot API Console Demo"
  },
  development: process.env.DEVELOPMENT ? true : false,
});

App.use(router.router);

App.listen(process.env.LUCY_CONSOLE_PORT || 3010);

