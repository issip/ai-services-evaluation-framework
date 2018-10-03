# ISSIP AI Services Test Framework

## About
 Project for ISSIP AI Services Test Framework. This project is built using the MEAN (MongoDB, ExpressJS, AngularJS, NodeJS) web-dev stack (using Cloudant as MongoDB replacement). It is designed to be integrated with Watson Discovery Services and Watson Conversation Services.

## How to install
1. Clone or download the repo into a folder and run `npm install` to install node modules.
2. Install grunt CLI using `npm install -g grunt-cli`. To build the project, `cd` into the folder containing `gruntfile.js` and run `grunt` to compile the angularjs code. Always keep `grunt` running in a separate terminal, it automatically watches for updates in the `client/src` folder and compiles it into the `bundle.js` file that is served to the client.
3. Request one of the devs to provide you with the `.env` file or provide your own config using `.env.sample.` as an example (this file contains all the endpoint URLS and credentials used by the server). When pushing to Bluemix, these keys will also need to be added as environment variables to the app instance.
4. In a separate terminal, `cd` into the `./issip-test-framework` folder and use `npm start` or `node server/app.js` to start the nodejs instance.


(NOTE: `grunt` has been configured to watch for changes in the `client/src` folder and recompile them to `client/build`. Keep `grunt` running in a separate terminal for changes to be automatically applied. Not running `grunt` will require you to copy changes over manually.)

See `gruntfile.js` for more info on config.

## Documentation/Links
[Nodejs](https://nodejs.org/api/)

[expressjs](https://expressjs.com/)

[AngularJs](https://docs.angularjs.org/guide)

[Angular-Material](https://material.angularjs.org/latest/)

[Cloudant](https://docs.cloudant.com/api.html)

[WDS API](https://www.ibm.com/watson/developercloud/discovery/api/v1/)

[WCS API](https://www.ibm.com/watson/developercloud/conversation/api/v1/)

[Grunt](https://gruntjs.com/getting-started)

[Sass](http://sass-lang.com/)# issip-test-framework
