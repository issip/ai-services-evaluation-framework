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

(NOTE: `grunt` has been configured to watch for changes in the `client/src` folder and recompile them to `client/build`. Keep `grunt` running in a separate terminal for changes to be automatically applied. Not running `grunt` will require you to copy changes over manually.)

See `gruntfile.js` for more info on config.

## Setup
The application requires valid credentials for Cloudant, Google and IBM Watson APIs.
Rename .env.sample to .env.
 
--Fill in the credentials in .env file:--
Cloudant: CLOUDANT_USERNAME and CLOUDANT_PASSWORD
IBM Speech to Text service: IBM_SPEECH_TEXT_USERNAME and IBM_SPEECH_TEXT_PASSWORD
Watson Natural Language Understanding service: WCS_NLU_USERNAME and WCS_NLU_PASSWORD

Copy the Google Cloud credentials to google-cred.json.

--Create and configure DBs in Cloudant--
Create the required Cloudant databases with the names specified in the .env file.

## Documentation/Links
[Nodejs](https://nodejs.org/api/)

[expressjs](https://expressjs.com/)

[Cloudant](https://docs.cloudant.com/api.html)

[Grunt](https://gruntjs.com/getting-started)
