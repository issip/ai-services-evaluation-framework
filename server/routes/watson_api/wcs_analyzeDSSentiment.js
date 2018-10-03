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
const ds_data = cloudant.db.use(process.env.CLOUDANT_DBNAME_ISSIP_DATASET_SENT);
const db_version = cloudant.db.use(process.env.CLOUDANT_DBNAME_ISSIP_VERSION);
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

module.exports = function(req, response){
    var sentimentMap = {};
    var now = new Date().getTime();
    var dataset_id = now;
    var count = 0;
    var counter = 0;
    var versionMap = {};

    //fetch the data from dataset
    ds_data.list({include_docs: true}, function(err, body) {
         var listRecords = body.rows;
         var listRecordsCount = body.rows.length;
         var listRecordsCountIdx = 0;
         var analyzeIbm = false;
         var analyzeGoogle = false;

         db_version.view('apiQuery', 'api', {'key':"NaturalLanguage"} , function(err, versionBody){
           if(err){
             //response.status(404).send("Error occured" + err);
             console.log("Error occured" + err);
           }
           if(!err){
             var listVersions = versionBody.rows;
             var listVersionsCount = versionBody.rows.length;
             listVersions.forEach((record,index)=>{
               versionMap[record.value.vendor] = {"version": record.value.version, "release_date": record.value.release_date};
              });

         listRecords.forEach((record,lrindex)=>{
           listRecordsCountIdx++;

           var dsId = record.doc.datasetId;
           var idsId = parseInt(dsId);
           var dsName = record.doc.datasetName;
           console.log("dsId " + dsId);
           var analyzeIbm = false;
           var analyzeGoogle = false;
           if (dsId == undefined)
            return;
            var version = versionMap["IBM"].version;
            var release = versionMap["IBM"].release_date;
            console.log("dsId before ibm " + dsId);
           db_ibm_results.view('datasetIdQuery', 'dataset_id', {'key': [idsId, version, release]}, function(err, ibmBody) {
             if (err){
               //response.status(404).send("Error occured in IBM results " + err);
               console.log("Error occured in IBM results " + err);
             }
             if (!err) {
               if (ibmBody.rows.length == 0) {
                  analyzeIbm = true;
                }
                 console.log("IBM results count " + ibmBody.rows.length + " dsId " + dsId + " analyzeIbm " + analyzeIbm);
                  // Insert data in IBM table
                  version = versionMap["Google"].version;
                  release = versionMap["Google"].release_date;
                  console.log("dsId before google " + dsId);
                  db_google_results.view('datasetIdQuery', 'dataset_id', {'key': [idsId, version, release]}, function(err, googleBody) {
                    if (err){
                      //response.status(404).send("Error occured in Google results " + err);
                      console.log("Error occured in Google results " + err);
                    }
                    if (!err) {
                      if (googleBody.rows.length == 0) {
                         analyzeGoogle = true;
                       }
                       console.log("Google results count " + googleBody.rows.length + " dsId " + dsId + " analyzeGoogle " + analyzeGoogle);
                       if (analyzeIbm || analyzeGoogle) {
                       //fetch the data from data table for the dataset
                       db_data.view('datasetIdQuery', 'dataset_id', {'key':dsId} , function(err, dataBody){
                         if(err){
                           //response.status(404).send("Error occured" + err);
                           console.log("Error occured" + err);
                         }
                         if(!err){
                           var dataRows = dataBody.rows;
                           console.log("count ", dataBody.rows.length);
                           var count = dataBody.rows.length;
                           var gIndex = 0;
                           //fetch the sentiment_gt and test data id
                           dataRows.forEach((data,index)=>{
                             var sentiment_gt = data.value.sentiment_gt;
                             var id = data.value._id;
                             var text = data.value.text;
                             console.log("test_data_id ", id);
                             console.log("sentiment_gt ", sentiment_gt);

                             counter++;
                             now = now + counter;

                             if (analyzeIbm) {
                             var datatest = {
                             '_id': now.toString(),
                               'text': text,
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


                             natural_language_understanding.analyze(datatest, (err,res)=>{
                                      console.log("id  " + id);
                                      if (err){
                                        reject('Error: ', err);
                                      }else{
                                         console.log('Inserting to db results ' + id);
                                         res["test_data_id"]=id;
                                         res["date_analyzed"]=dateTime.format(now, 'DD/MM/YYYY');
                                         res["score"]=res.sentiment.document.score;
                                         res["sentiment_label"]=res.sentiment.document.label;
                                         res["sme_update"]="";
                                         res["sme_comment"]="";
                                         res["dataset_id"]=dsId;
                                         res["sentiment_gt"]=sentiment_gt;
                                         res["version"]=versionMap["IBM"].version;
                                         res["release_date"]=versionMap["IBM"].release_date;
                                         console.log('sentiment_gt ', sentiment_gt);

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

                                  }

                                  if (analyzeGoogle) {

                                     // Call google analyze

                                     var document = {
                                       content: text,
                                       type: 'PLAIN_TEXT',
                                     };
                                     //document.content = datatest.text;
                                     client
                                         .analyzeSentiment({document: document})
                                         .then(results => {
                                           const res = results[0];
                                           const sentiment = results[0].documentSentiment;

                                           console.log(`Sentiment score: ${sentiment.score}`);
                                           console.log(`Sentiment magnitude: ${sentiment.magnitude}`);

                                           console.log('Inserting to db results ' + id);
                                           res["test_data_id"]=id;
                                           res["date_analyzed"]=dateTime.format(now, 'DD/MM/YYYY');
                                           res["score"]=sentiment.score;
                                           res["sme_update"]="";
                                           res["sme_comment"]="";

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
                                           res["dataset_id"]=dsId;
                                           res["sentiment_gt"]=sentiment_gt;
                                           res["version"]=versionMap["Google"].version;
                                           res["release_date"]=versionMap["Google"].release_date;
                                           console.log('sentiment_gt ', sentiment_gt);

                                           cloudantInsert(db_google_results, res, (err, result) =>{
                                             if(err){
                                               console.log('Error inserting to results ' + err);
                                             }
                                             else{
                                               console.log('Inserted to google db results');
                                             }
                                           });
                                     });
                                   }


                                });
                           }
                         });

                         if (lrindex == (listRecordsCount-1))
                         {
                           console.log("Sending response");
                           response.sendStatus(200);
                          }

                       }
                       else if (!analyzeIbm && !analyzeGoogle) {
                         console.log("lrindex " + lrindex);
                         console.log("listRecordsCount " + listRecordsCount);
                         if (lrindex == (listRecordsCount-1))
                         {
                           console.log("Sending response");
                           response.sendStatus(200);
                          }
                       }

                     }

                });
              }
            });

          });
          }
        });
      });
    }
