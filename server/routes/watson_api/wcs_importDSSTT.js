'use strict'
const wcs = require('watson-developer-cloud/conversation/v1');
const username = process.env.WCS_NLU_USERNAME;
const password = process.env.WCS_NLU_PASSWORD;
const cloudant = require('../../custom_modules/cloudant/cloudantWrapper');
const cloudantBulk = require('../../custom_modules/cloudant/cloudantBulk');
const cloudantInsert = require('../../custom_modules/cloudant/cloudantInsert');
const excelToJson = require('convert-excel-to-json');
const routes = require('express').Router();
const dateTime = require('date-and-time');
// Imports the Google Cloud client library
const language = require('@google-cloud/language');
const db_ibm_results = cloudant.db.use(process.env.CLOUDANT_DBNAME_ISSIP_IBM_RESULTS_STT);
const db_google_results = cloudant.db.use(process.env.CLOUDANT_DBNAME_ISSIP_GOOGLE_RESULTS_STT);
const db_data = cloudant.db.use(process.env.CLOUDANT_DBNAME_ISSIP_STT_DATA);
const ds_data = cloudant.db.use(process.env.CLOUDANT_DBNAME_ISSIP_DATASET_STT);

// Instantiates a client
const client = new language.LanguageServiceClient();
const fs = require('fs');

var inputDS = {
    'datasetId': '',
    'datasetName':'',
    'datasetFilename': '',
    'dateImported':''
    };

module.exports = function(req, response){
  console.log("file name to upload is ", req.body.sampleFile_ST);
  var file = req.body.sampleFile_ST;
  const result = excelToJson({
      sourceFile: file,
      columnToKey: {
            A: 'Test_Data',
            B: 'Reference'
        },header:{
            rows: 1
        }
    });

    var dataList = result.Sheet1;
    var list_db_data = new Array();
    var list_ds_data = new Array();
    var list_attach_data = new Array();

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
          console.log("Reference :  " + data.Reference);

          var input = data.Test_Data;
          var reference = data.Reference;
          var mimeType = "audio/wav";
          var strName = input.substr(0, input.indexOf('.'));

          count++;
          now = now + count;

          var doc = {
              _id: now.toString(),
              name:  strName,
              dataset_id: dataset_id,
              reference: reference
            };

          var attach = {
            name: strName,
            data: fs.readFileSync(input),
            content_type: mimeType
          };

          console.log("dataset id:", dataset_id);
          db_data.multipart.insert(doc, [attach], now.toString(), function (err, result) {

              if(err){
                console.log('Error inserting to STT data table' + err);
                response.sendStatus(200);
              }
              else {
                console.log('Inserted to db data table');
              }
            });
      });

      cloudantInsert(ds_data, inputDS, (err, result) =>{
          if(err) {
            console.log('Error inserting to dataset ' + err);
          }
          else {
            console.log('Inserted to db dataset');
          }
    });
    response.sendStatus(200);
}
