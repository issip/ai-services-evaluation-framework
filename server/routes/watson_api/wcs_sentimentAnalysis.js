'use strict'
const wcs = require('watson-developer-cloud/conversation/v1');
const username = process.env.WCS_NLU_USERNAME;
const password = process.env.WCS_NLU_PASSWORD;
const cloudant = require('../../custom_modules/cloudant/cloudantWrapper');
const cloudantInsert = require('../../custom_modules/cloudant/cloudantInsert');
const db_ibm_results = cloudant.db.use(process.env.CLOUDANT_DBNAME_ISSIP_IBM_RESULTS_SENT);
const db_data = cloudant.db.use(process.env.CLOUDANT_DBNAME_ISSIP_DATA_SENT);
const dateTime = require('date-and-time');
const db_google_results = cloudant.db.use(process.env.CLOUDANT_DBNAME_ISSIP_GOOGLE_RESULTS_SENT);
// Imports the Google Cloud client library
const language = require('@google-cloud/language');
// Instantiates a client
const client = new language.LanguageServiceClient();
const document = {
  content: "",
  type: 'PLAIN_TEXT',
};
const NaturalLanguageUnderstandingV1 = require('watson-developer-cloud/natural-language-understanding/v1.js');
const natural_language_understanding = new NaturalLanguageUnderstandingV1({
  'username': username,
  'password': password,
  'version': 'v1',
  'version_date': NaturalLanguageUnderstandingV1.VERSION_DATE_2017_02_27
});

var inputMain = {
  '_id': '1',
  'text': 'IBM is an American multinational technology company headquartered in Armonk, New York, United States, with operations in over 170 countries.',
  'features': {
    'entities': {
      'emotion': true,
      'sentiment': true,
      'limit': 2
    },
    'keywords': {
      'emotion': true,
      'sentiment': true,
      'limit': 2
    },
    'sentiment': {

    }
  }
};

var inputMainDB = {
  '_id': '1',
  'text': 'IBM is an American multinational technology company headquartered in Armonk, New York, United States, with operations in over 170 countries.',
  'sentiment_gt':''
  };
var resOutput = {
    'vendor': 'IBM',
    'result': {}
  };

module.exports = function(req, response){
  var now = new Date().getTime();
  var input = req.body.textInput;
  var resOutputs = new Array();

  inputMain.text = input;
  inputMain._id = now.toString();
  inputMainDB._id = now.toString();
  inputMainDB.text = input;

  console.log('input:', input);
  console.log('date:', now);
  console.log('Got WCS Sentiment query :', inputMain);

  return new Promise((resolve,reject)=>{

    // call ibm analyze
		natural_language_understanding.analyze(inputMain, (err,res)=>{
			if (err){
				reject('Error: ', err);
			}else{

        console.log('Inserting to db data ' + inputMain._id);
        cloudantInsert(db_data, inputMainDB, (err, result) =>{
      		if(err){
            console.log('Error inserting to data ' + err);
            response.sendStatus(200);
      		}
          console.log('Inserted to db data');


      	});

        console.log('Inserting to db results ' + now + " " + res);
        res["test_data_id"]=now.toString();
        res["date_analyzed"]=dateTime.format(now, 'DD/MM/YYYY');
        res["score"]=res.sentiment.document.score;
        res["sentiment_label"]=res.sentiment.document.label;
        res["sme_update"]="";
        res["sme_comment"]="";
        res["dataset_id"]="";
        res["sentiment_gt"]="";

        cloudantInsert(db_ibm_results, res, (err, result) =>{
          if(err){
            console.log('Error inserting to results ' + err);
            response.sendStatus(200);
          }
          console.log('Inserted to db results');
        });
        resOutput = new Object();
        resOutput.vendor = "IBM";
        resOutput.result = res;
        resOutputs[0] = resOutput;
        console.log('resOutput 0' + JSON.stringify(resOutput));
        // analyze google data
        // Call google analyze

        var document = {
          content: "",
          type: 'PLAIN_TEXT',
        };
        document.content = input;
        var id = now.toString();
        client
            .analyzeSentiment({document: document})
            .then(results => {
              const resp = results[0];
              const sentiment = results[0].documentSentiment;

              console.log(`Sentiment score: ${sentiment.score}`);
              console.log(`Sentiment magnitude: ${sentiment.magnitude}`);

              console.log('Inserting to db results ' + now);
              resp["test_data_id"]=now.toString();
              resp["date_analyzed"]=dateTime.format(now, 'DD/MM/YYYY');
              resp["score"]=sentiment.score;
              resp["sme_update"]="";
              resp["sme_comment"]="";
              resp["dataset_id"]="";
              resp["sentiment_gt"]="";

              var sentiment_label = null;
              if(sentiment.score==0){
                sentiment_label = "neutral";
              }
              else if (sentiment.score > 0) {
                sentiment_label = "positive";
              }
              else{
                sentiment_label = "negative";
              }
              resp["sentiment_label"] = sentiment_label;

              cloudantInsert(db_google_results, resp, (err, result) =>{
                if(err){
                  console.log('Error inserting to results ' + err);
                  response.sendStatus(200);
                }
                console.log('Inserted to db results');
              });
              resOutput = new Object();
              resOutput.vendor = "Google";
              resOutput.result = resp;
              resOutputs[1] = resOutput;
              console.log('resOutput 1' + JSON.stringify(resOutput));
              console.log('resOutputs ' + JSON.stringify(resOutputs));
              resolve(resOutputs);
              response.status(200).send(resOutputs);
        });
			}
		});
	});
}
