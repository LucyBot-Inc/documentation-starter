# LucyBot API Console

**Interactive documentation for your API**

We utilize [OpenAPI](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md)
(formerly **Swagger**) to generate both static documentation and an interactive API console

If you use another type of API specification, such as **RAML**, **WADL**, or **API Blueprint**,
you can use [api-spec-converter](https://github.com/lucybot/api-spec-converter) to generate an OpenAPI document.

## Demo
You can see the console in action for over 250 different APIs at [AnyAPI](https://any-api.com).

You can also see the [Hacker News example](http://lucybot.github.io/lucy-console)
contained in this repository.

## Usage
Simply clone this repository, and replace `swagger.json` with your Swagger file. You can then
serve the site statically using Apache, NodeJS, or whatever else.

If you work on the `gh-pages` branch of your fork, you should be able to see it running at

`https://your-username.github.io/lucy-console`

You can also add additional styles by editing `styles.css`, or replacing `minified/css/bootstrap.css` with a custom Bootstrap theme.

## Commercial Version

A commercial version of the LucyBot console is also available for a one-time licensing fee.

Additional features include:
* Sample code generation
* Recipes (step-by-step tutorials for complex workflows)
* Embeddable UI components
* Simple customization and branding
* Custom authentication schemes
* Support via phone and e-mail

Please contact sales@lucybot.com for more information

## Where's v1?
We've decided to merge this open-source project with our commercial product in order
to reduce code duplication. The assets in this repository are auto-generated from
the upstream commercial repository.

v1 will continue to exist on the master branch, and we will continue responding
to bugs and pull requests. However, all active development will take place in
the commercial repository, with some features propagating down into this branch.

We encourage all existing users to migrate to the `static-site` branch or consider
purchasing a commercial license.

## Contributing
The files in this repository are entirely auto-generated, with the exceptions of
`swagger.json` and `styles.css`.  If you'd like to contribute, let us know and we'll
add you to the upstream repository.
