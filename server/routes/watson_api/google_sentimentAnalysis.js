'use strict'
const cloudant = require('../../custom_modules/cloudant/cloudantWrapper');
const cloudantInsert = require('../../custom_modules/cloudant/cloudantInsert');
const db_results = cloudant.db.use(process.env.CLOUDANT_DBNAME_ISSIP_GOOGLE_RESULTS_SENT);
const db_data = cloudant.db.use(process.env.CLOUDANT_DBNAME_ISSIPDB_DATA_SENT);
const dateTime = require('date-and-time');
// Imports the Google Cloud client library
const language = require('@google-cloud/language');
// Instantiates a client
const client = new language.LanguageServiceClient();

const document = {
  content: "",
  type: 'PLAIN_TEXT',
};

var inputMainDB = {
  '_id': '1',
  'text': 'IBM is an American multinational technology company headquartered in Armonk, New York, United States, with operations in over 170 countries.',
  'sentiment_gt':''
  };

module.exports = function(req, response){
  var now = new Date().getTime();
  var input = req.body.textInput;
  document.content = input;
  inputMainDB._id = now.toString();
  inputMainDB.text = input;

  console.log('input:', input);
  console.log('date:', now);

  return new Promise((resolve,reject)=>{

    client
      .analyzeSentiment({document: document})
      .then(results => {
        var res = results[0];
        var sentiment = results[0].documentSentiment;

        console.log(`Sentiment score: ${sentiment.score}`);
        console.log(`Sentiment magnitude: ${sentiment.magnitude}`);

        console.log('Inserting to db data ' + inputMainDB._id);
        cloudantInsert(db_data, inputMainDB, (err, result) =>{
          if(err){
            console.log('Error inserting to data ' + err);
            response.sendStatus(200);
          }
          console.log('Inserted to db data');
        });

        console.log('Inserting to db results ' + now);
        res["test_data_id"]=now.toString();
        res["date_analyzed"]=dateTime.format(now, 'DD/MM/YYYY');
        res["score"]=sentiment.score;
        res["sme_update"]="";
        res["sme_comment"]="";
        res["dataset_id"]="";
        res["sentiment_gt"]="";

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
        res["sentiment_label"] = sentiment_label;

        cloudantInsert(db_results, res, (err, result) =>{
          if(err){
            console.log('Error inserting to results ' + err);
            response.sendStatus(200);
          }
          console.log('Inserted to db results');
        });

        var out = JSON.stringify(res);
        console.log('out ' + out);
        console.log('sentiment ' + JSON.stringify(sentiment));
        resolve(JSON.stringify(res));
        response.status(200).send(res);

      })
      .catch(err => {
        console.error('ERROR:', err);
        reject('Error: ', err);
      });
		});
	}
