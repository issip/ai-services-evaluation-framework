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
  'text': 'IBM is an American multinational technology company headquartered in Armonk, New York, United States, with operations in over 170 countries.'
  };
var inputDS = {
    'datasetId': '',
    'datasetName':'',
    'datasetFilename': '',
    'dateImported':''
    };

module.exports = function(req, response){
  var file = req.body.sampleFile;
  const result = excelToJson({
      sourceFile: file,
      columnToKey: {
            A: 'Test_Data',
            B: 'Sentiment_Label'
        },header:{
            rows: 1
        }
    });

    var dataList = result.Sheet1;
    var list_data = new Array();
    var list_db_data = new Array();
    var list_ds_data = new Array();
    var now = new Date().getTime();
    var dataset_id = now;
    var count = 0;
    var dsName = file + "_" + dataset_id;
    inputDS.datasetId = dataset_id;
    inputDS.datasetName = dsName;
    inputDS.datasetFilename = file;
    inputDS.dateImported=dateTime.format(now, 'DD/MM/YYYY');

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
            'text': '',
            'sentiment_gt':'',
            'dataset_id':''
            };

          inputMain.text = data.Test_Data;
          inputMain._id = now.toString();

          inputMainDB.text = data.Test_Data;
          inputMainDB._id = now.toString();
          inputMainDB.sentiment_gt=data.Sentiment_Label;
          inputMainDB.dataset_id=dataset_id;

          console.log("dataset id:", dataset_id);
          console.log("dataset filename:", file.name);
          console.log("dataset text_id :", now.toString());
          console.log("dataset data.Sentiment_Label :", data.Sentiment_Label);

          list_data[index] = inputMain;
          list_db_data[index] = inputMainDB;

      });
      console.log("List_Data length:",list_data.length);

      cloudantInsert(ds_data, inputDS, (err, result) =>{
          if(err){
            console.log('Error inserting to dataset ' + err);
          }
          else{
          console.log('Inserted to db dataset');

        cloudantBulk(db_data, list_db_data, (err, result) =>{
          if(err){
            console.log('Error inserting to data ' + err);
            response.sendStatus(404);
          }
          else{
            console.log('Inserted to db data');
            response.sendStatus(200);
          }
        });
      }
    });
}
