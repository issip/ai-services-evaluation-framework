'use strict'
const cloudant = require('../../custom_modules/cloudant/cloudantWrapper');
const cloudantInsert = require('../../custom_modules/cloudant/cloudantInsert');
const db_results = cloudant.db.use(process.env.CLOUDANT_DBNAME_ISSIP_MS_RESULTS);
const db_data = cloudant.db.use(process.env.CLOUDANT_DBNAME_ISSIPDB_DATA);
const dateTime = require('date-and-time');
let https = require ('https');

// Replace the accessKey string value with your valid access key.
let accessKey = process.env.MS_SUBSCRIPTION_KEY;

// Replace or verify the region.

// You must use the same region in your REST API call as you used to obtain your access keys.
// For example, if you obtained your access keys from the westus region, replace
// "westcentralus" in the URI below with "westus".

// NOTE: Free trial access keys are generated in the westcentralus region, so if you are using
// a free trial access key, you should not need to change this region.
//let uri = 'westus.api.cognitive.microsoft.com';
let uri = 'westcentralus.api.cognitive.microsoft.com';
//https://westcentralus.api.cognitive.microsoft.com/text/analytics/v2.0
let path = '/text/analytics/v2.0/sentiment';

var inputMainDB = {
  '_id': '1',
  'text': 'IBM is an American multinational technology company headquartered in Armonk, New York, United States, with operations in over 170 countries.'
  };

  let result;
  let res;
  
let get_sentiments = function (documents,cb) {
    let body = JSON.stringify (documents);

    let request_params = {
        method : 'POST',
        hostname : uri,
        path : path,
        headers : {
            'Ocp-Apim-Subscription-Key' : accessKey,
        }
    };

    let req = https.request (request_params, function (response) {
      let body = '';
      response.on ('data', function (d) {
          body += d;
      });
      response.on ('end', function () {
          let body_ = JSON.parse (body);
          //let body__ = JSON.stringify (body_, null, '  ');
          result = body_;
          console.log ("output: \n" + result);
          res = result.documents[0];

          console.log ("res: \n" + res);
          var now = new Date().getTime();
          console.log('Inserting to db results ' + res.id);
          res["test_data_id"]=res.id;
          res["date_analyzed"]=dateTime.format(now, 'DD/MM/YYYY');
          res["sme_update"]="";
          res["sme_comment"]="";

          var sentiment_label = null;
          if(res.score==0){
            sentiment_label = "neutral";
          }
          else if (res.score > 0) {
            sentiment_label = "positive";
          }
          else{
            sentiment_label = "negative";
          }
          res["sentiment_label"] = sentiment_label
          cloudantInsert(db_results, res, (err, result) =>{
            if(err){
              console.log('Error inserting to results ' + err);
              cb(new Error("Error inserting MS Results"));
              //ms_response.sendStatus(400);
            }
            else{
              var out = JSON.stringify(res);
              console.log('out ' + out);
              console.log('Inserted to db results');
              cb(null,res);
            }
            //ms_response.status(200).send(res);
          });



      });

      response.on ('error', function (e) {
          console.log ('Error: ' + e.message);
      });
  });
    req.write (body);
    req.end ();
}

let documents = { 'documents': [
    { 'id': '1', 'language': 'en', 'text': '' }
]};


module.exports = function(req, response){
  var now = new Date().getTime();
  var input = req.body.textInput;
  documents.documents[0].id = now.toString();
  documents.documents[0].text = input;

  inputMainDB._id = now.toString();
  inputMainDB.text = input;

  console.log('input:', input);
  console.log('date:', now);

    console.log('Inserting to db data ' + documents.documents[0].id);
    cloudantInsert(db_data, inputMainDB, (err, result) =>{
      if(err){
        console.log('Error inserting to data ' + err);
        response.sendStatus(200);
      }
      console.log('Inserted to db data');
    });

    get_sentiments(documents,function(err,ms_response){
      if(err) respnse.sendStatus(400);
      else response.status(200).send(ms_response);
    });
	}
