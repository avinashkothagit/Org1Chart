# Salesforce Org Chart: Local Set-up
###### Salesforce Org Chart is web application that is being designed to run as a SF1 canvas app. This read me is a tutorial for setting up and running Org Chart locally. Please note, that this guide assumes that you already have Org Chart running on heroku.

If you do not have the Org Chart running on Heroku yet, please install this appexchange package to your Salesforce Org and follow the post installation instructions:

https://appexchange.salesforce.com/listingDetail?listingId=a0N30000000rFyZEAU

+ [Prepare The App](README.md#Prepare)
+ [Building](README.md#Building)
+ [Local Back-up](README.md#Local)
+ [Testing](README.md#testing)
+ [Development Extras](README.md#development-extras)
+ [Deploying](README.md#deploying)
 
&nbsp;

---------------------
#### Prepare the app
Get the project source and install dependencies:

```shell
$ git clone <repo url> [dest dir]
$ npm install
```

Run the node server to see the site locally:

```shell
$ APP_SECRET=<secret> node server.js
```

The application uses the following Environment variables:


* `APP_SECRET` - **Required**, The secret key from your connected app. Used to decode the signed request.
You will need a connected app in the desired salesforce org to get a client secret. [See this SF1 guide on setting up a connected app](https://developer.salesforce.com/docs/atlas.en-us.salesforce1.meta/salesforce1/canvas_custom_action_create_canvas_app_task.htm)
* `NODE_ENV` - Used to determine the environment running. Defaults to "development". Used to adjust the logging for debugging.

This will create a locally running node.js server, in order to run the UI application you must go through SF1. This requires:

* A SF1 enabled org
* A canvas connected app (see the `APP_SECRET` above) on that org.
* The canvas app should be added to the Mobile Navigation of your org.

Once those are in place you can login to the org and use SF1 through the browser by visiting `/one/one.app`. Then use the left-hand nav
to visit your canvas app.

&nbsp;

---------------
#### Building

There are several components of the application that require a build - namely the JavaScript and CSS. To build these you will need [gruntjs](http://gruntjs.com):

* Install grunt (globally is recommended by them):

```shell
$ npm install grunt
```

* The default task will build both the CSS and JS:

```shell
$ grunt
```

For production build, set the `NODE_ENV`:

```shell
$ NODE_ENV=production grunt
```

This will produce minified and GZipped JavaScript bundle with no source maps for debugging.

&nbsp;

--------------
#### Local Back-up

+ Install [PostGresSQL](http://www.postgresql.org/download/) 
+ Capture the database and store it locally.
```shell
$ heroku pg:backups capture
$ curl -o latest.dump `heroku pg:backups public-url`
$ pg_restore --verbose --clean --no-acl --no-owner -h localhost -U orgChartUser -d orgchart latest.dump
```

&nbsp;

--------

#### Testing
Install mocha with `-g` or better yet add [`node_modules` to your `PATH`](http://stackoverflow.com/a/15157360/42998)

```shell
$ npm test
```

#### Development Extras:
* Install the Chrome extension Livereload in order to automatically refresh your dev browser as you make changes in your editor
* Get Nodemon to automatically restart your node server as you make js file changes. Use the -e flag to include the extensions we want to monitor.

```shell
$ npm install -g nodemon
$ nodemon server.js -e js,ejs
```

[Webstorm](http://www.jetbrains.com/webstorm/) can also be used to run the server and unit tests and is a good IDE for JS development
