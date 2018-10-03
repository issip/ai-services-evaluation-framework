'use strict'
const wcs = require('watson-developer-cloud/conversation/v1');
const username = process.env.WCS_NLU_USERNAME;
const password = process.env.WCS_NLU_PASSWORD;
const cloudant = require('../../custom_modules/cloudant/cloudantWrapper');
const cloudantBulk = require('../../custom_modules/cloudant/cloudantBulk');
const cloudantInsert = require('../../custom_modules/cloudant/cloudantInsert');
const db_ibm_results = cloudant.db.use(process.env.CLOUDANT_DBNAME_ISSIP_IBM_RESULTS_SENT);
const db_google_results = cloudant.db.use(process.env.CLOUDANT_DBNAME_ISSIP_GOOGLE_RESULTS_SENT);
const db_data = cloudant.db.use(process.env.CLOUDANT_DBNAME_ISSIP_DATA_SENT);
const excelToJson = require('convert-excel-to-json');
const routes = require('express').Router();
const dateTime = require('date-and-time');
const ibmSentimentAnalysis = require('./wcs_sentimentAnalysis');
const NaturalLanguageUnderstandingV1 = require('watson-developer-cloud/natural-language-understanding/v1.js');
const natural_language_understanding = new NaturalLanguageUnderstandingV1({
  'username': username,
  'password': password,
  'version': 'v1',
  'version_date': NaturalLanguageUnderstandingV1.VERSION_DATE_2017_02_27
});
// Imports the Google Cloud client library
const language = require('@google-cloud/language');
// Instantiates a client
const client = new language.LanguageServiceClient();

var inputMainDB = {
  '_id': '1',
  'text': 'IBM is an American multinational technology company headquartered in Armonk, New York, United States, with operations in over 170 countries.',
  'sentiment_gt':''
  };

module.exports = function(req, response){
  var file = req.files.sampleFile;
  const result = excelToJson({
      //sourceFile: file,
        sourceFile: file.name,
        columnToKey: {
            A: 'Test_Data'
        },header:{
            rows: 1
        }
    });
return new Promise((resolve,reject)=>{
    var dataList = result.Sheet1;
    var list_data = new Array();
    var list_db_data = new Array();

    var now = new Date().getTime();
    var count = 0;
      dataList.forEach((data,index)=>{
          console.log("test data:  " + data.Test_Data);
          count++;
          now = now + count;
          var inputMain = {
            '_id': '1',
            'text': '',
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
            'text': ''
            };

          inputMain.text = data.Test_Data;
          inputMain._id = now.toString();

          inputMainDB.text = data.Test_Data;
          inputMainDB._id = now.toString();

          list_data[index] = inputMain;
          list_db_data[index] = inputMainDB;
      });
      console.log("List_Data length:",list_data.length);
    cloudantBulk(db_data, list_db_data, (err, result) =>{
        if(err){
          console.log('Error inserting to data ' + err);
          response.sendStatus(404);
        }
        else{
          console.log('Inserted to db data');
          list_data.forEach((datatest,index)=>{
            //Call IBM Analyze
          		var id  = datatest._id;
          		natural_language_understanding.analyze(datatest, (err,res)=>{
                    console.log("id  " + id);
              			if (err){
                      console.log("err  " + err);
              				reject('Error: ', err);
              			}else{
                      console.log('Inserting to db results ' + id);
                      res["test_data_id"]=id;
                      res["date_analyzed"]=dateTime.format(now, 'DD/MM/YYYY');
                      res["score"]=res.sentiment.document.score;
                      res["sentiment_label"]=res.sentiment.document.label;
                      res["sme_update"]="";
                      res["sme_comment"]="";
                      res["dataset_id"]="";
                      res["sentiment_gt"]="";

                    //  console.log("date " + dateTime.format(now, 'DD/MM/YYYY'));
                      cloudantInsert(db_ibm_results, res, (err, result) =>{
                        if(err){
                          console.log('Error inserting to results ' + err);
                        }
                        else{
                        console.log('Inserted to ibm db results');
                      }
                      });
              			}
              		});

                  // Call google analyze

                  var document = {
                    content: "",
                    type: 'PLAIN_TEXT',
                  };
                  document.content = datatest.text;
                  var id = datatest._id;
                  client
                      .analyzeSentiment({document: document})
                      .then(results => {
                        const res = results[0];
                        const sentiment = results[0].documentSentiment;

                        console.log(`Sentiment score: ${sentiment.score}`);
                        console.log(`Sentiment magnitude: ${sentiment.magnitude}`);

                        console.log('Inserting to db results ' + id);
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

                        cloudantInsert(db_google_results, res, (err, result) =>{
                          if(err){
                            console.log('Error inserting to results ' + err);
                          }
                          else{
                            console.log('Inserted to google db results');
                          }
                        });
                  });
          	  });
              response.sendStatus(200);
        }
      });
    });
}
