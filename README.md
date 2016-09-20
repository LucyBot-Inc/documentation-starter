# LucyBot API Console

**Interactive documentation for your API**

We utilize [OpenAPI](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md)
(formerly known as **Swagger**) to generate both static documentation and an interactive API console

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

## Commercial Version

A commercial version of the LucyBot console is also available for a one-time licensing fee.

Additional features include:
* Simple customization and branding
* Inject custom CSS and JavaScript
* Include unlimited Markdown/HTML sections
* Customized navigation bars
* Custom authentication schemes
* API galleries and discovery
* Sample code generation
* Recipes (step-by-step tutorials for complex workflows)
* Embeddable UI components
* Support via phone and e-mail

Please contact sales@lucybot.com for more information

## Contributing
The files in this repository are entirely auto-generated, with the exception of
`swagger.json`.  If you'd like to contribute, let us know and we'll
add you to the upstream repository.
