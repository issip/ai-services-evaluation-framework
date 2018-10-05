# ISSIP AI Services Evaluation Framework

## About
Project for ISSIP AI Services Evaluation Framework. This provides a framework to evaluate and compare the metrics for AI services provided by different vendors.
Currently supported vendors are IBM and Google.
This project is built using Cloudant, NodeJS and JQuery.

## How to install
1. Clone or download the repo into a folder and run `npm install` to install node modules.
2. Install grunt CLI using `npm install -g grunt-cli`. To build the project, `cd` into the folder containing `gruntfile.js` and run `grunt` to compile the angularjs code. Always keep `grunt` running in a separate terminal, it automatically watches for updates in the `client/src` folder and compiles it into the `bundle.js` file that is served to the client.
3. Request one of the devs to provide you with the `.env` file or provide your own config using `.env.sample.` as an example (this file contains all the endpoint URLS and credentials used by the server). When pushing to Bluemix, these keys will also need to be added as environment variables to the app instance.
4. In a separate terminal, `cd` into the `./ai-services-framework` folder and use `npm start` or `node server/app.js` to start the nodejs instance.
The port number in which the server was started in printed in the console. Remember this port number to open the application in the browser.

(NOTE: `grunt` has been configured to watch for changes in the `client/src` folder and recompile them to `client/build`. Keep `grunt` running in a separate terminal for changes to be automatically applied. Not running `grunt` will require you to copy changes over manually.)

See `gruntfile.js` for more info on config.

## Setup
The application requires valid credentials for Cloudant, Google and IBM Watson APIs.
Rename .env.sample to .env.

### Fill in the credentials in .env file ###
1. Cloudant: CLOUDANT_USERNAME and CLOUDANT_PASSWORD
2. IBM Speech to Text service: IBM_SPEECH_TEXT_USERNAME and IBM_SPEECH_TEXT_PASSWORD
3. Watson Natural Language Understanding service: WCS_NLU_USERNAME and WCS_NLU_PASSWORD

Also, copy the Google Cloud credentials to google-cred.json.

### Create and configure DBs in Cloudant ###
The application works with Cloudant databases. They should to be created and configured before you can start playing with the application.
After starting the application, open the application's admin dashboard using the url https://localhost:<port-number>/admin.
Click on "Create & Configure Cloudant DB" button. The names of the dbs that will be created is specified in the .env file.
This step needs to performed only once, that is when the application is started for the first time.

## How to run the application ##
In a browser, open the url https://localhost:<port-number> . This will show the Application Dashboard.

## Documentation/Links
[Nodejs](https://nodejs.org/api/)

[expressjs](https://expressjs.com/)

[Cloudant](https://docs.cloudant.com/api.html)

[Grunt](https://gruntjs.com/getting-started)
