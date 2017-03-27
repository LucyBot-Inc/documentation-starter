# LucyBot Starter API Console
This is the default build for [LucyBot's API Documentation](http://lucybot.com).
It can be used in non-commercial projects, or for demo purposes.

Check out the [Pet Store demo](http://demo.lucybot.com)

Commercial licenses and additional features are available at [lucybot.com](http://lucybot.com)

## Usage
Simply fork this repository and replace `openapi.json` with your
[OpenAPI specification](https://www.openapis.org/).

```bash
git clone https://github.com/LucyBot-Inc/documentation-starter
cp /path/to/my/openapi.json documentation-starter/openapi.json
```

> Have RAML, WADL, API Blueprint, or I/O Docs?
> Check out [api-spec-converter](https://github.com/lucybot/api-spec-converter)

## Serving
You can serve the website with any static HTTP server.

e.g. with [http-server](https://github.com/indexzero/http-server)
```
npm install -g http-server
http-server ./documentation-starter
```

or with PHP:
```
php -S 0.0.0.0:80 -t ./documentation-starter
```

The easiest way to serve the documentation publicly is with GitHub pages:
in your fork, visit the Settings page, and choose "master branch" as the source in the
GitHub Pages section. You can also set a custom domain there.

You can also serve this directory with Apache, NodeJS Express, etc.

## Customization
### Title and Description
The API title and description are controlled by
the `info` field in `openapi.json`.  You can use
[Markdown](https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet)
in the description.

### Themes
You can use your own Bootstrap theme to customize colors, fonts, sizes, and more.
Just replace `dist/bootstrap.css` with your own bootstrap.css

You can generate a bootstrap.css file using:
* [Strapping!](http://bobby-brennan.github.io/strapping)
* [Bootstrap Live Customizer](http://bootstrap-live-customizer.com/)

### More
The full commercial version offers several additional features:
* Additional Markdown/HTML sections
* Custom navbar and footer
* Custom homepage
* Event tracking
* SEO (`<meta>` and `<title>` tags, `sitemap.xml`)
* User authentication
* Galleries for multiple APIs

For a full list of features available see [lucybot.com](http://lucybot.com)

## License
[Creative Commons 4.0 - Non-commercial](https://creativecommons.org/licenses/by-nc/4.0/)

For a commercial license, [contact us](http://lucybot.com/#Contact)
