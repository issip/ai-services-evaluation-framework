'use strict'
const wcs = require('watson-developer-cloud/conversation/v1');
const username = process.env.WCS_NLU_USERNAME;
const password = process.env.WCS_NLU_PASSWORD;
const cloudant = require('../../custom_modules/cloudant/cloudantWrapper');
const cloudantBulk = require('../../custom_modules/cloudant/cloudantBulk');
const cloudantInsert = require('../../custom_modules/cloudant/cloudantInsert');
//var db_results = cloudant.db.use(process.env.CLOUDANT_DBNAME_ISSIP_IBM_RESULTS);
const db_data = cloudant.db.use(process.env.CLOUDANT_DBNAME_ISSIP_DATA_SENT);
const excelToJson = require('convert-excel-to-json');
const routes = require('express').Router();
const dateTime = require('date-and-time');
const ibmSentimentAnalysis = require('./wcs_sentimentAnalysis');
const NaturalLanguageUnderstandingV1 = require('watson-developer-cloud/natural-language-understanding/v1.js');

module.exports = function(req,res){
   var startDate = req.body.startDate;
   var endDate = req.body.endDate;
   console.log("START DATE:", startDate, "END DATE:", endDate);
   var vendor = req.body.vendor;
   var target_db = null;
console.log("Vendor Selected:", vendor);
   switch(vendor){
     case "ibm":
           target_db = process.env.CLOUDANT_DBNAME_ISSIP_IBM_RESULTS_SENT;
           break;
     case "ms":
           target_db = process.env.CLOUDANT_DBNAME_ISSIP_MS_RESULTS;
           break;
     case "google":
           target_db = process.env.CLOUDANT_DBNAME_ISSIP_GOOGLE_RESULTS_SENT;
           break;
      default:
            target_db = process.env.CLOUDANT_DBNAME_ISSIP_IBM_RESULTS_SENT; // default DB is IBM WATSON
   }
   console.log("Target Database:",target_db);
   var db_results = cloudant.db.use(target_db);

   console.log(startDate,"*********",endDate);
   db_results.view('dateRangeQuery', 'date_analyzed', {startkey:startDate,endkey:endDate}, function(err, body){
     if(err){
       res.status(404).send("Error occured" + err)
     }
     if(!err){
       console.log(body.rows);
       var records = body.rows;
       var listRecords = [];
       records.forEach(function(record){
         switch (vendor) {
           case "ibm":
                  var rec = {
                    score: record.value.score,
                    label: record.value.sentiment_label ,
                    test_data_id: record.value.test_data_id,
                    key: record.value.date_analyzed
                  }
             break;
           case "ms":
             var rec = {
               score: record.value.score,
               label: record.value.sentiment_label ,
               test_data_id: record.value.test_data_id,
               key: record.value.date_analyzed
             }
               break;
           case "google":
               var rec = {
                 score: record.value.score,
                 label: record.value.sentiment_label ,
                 test_data_id: record.value.test_data_id,
                 key: record.value.date_analyzed
               }
                 break;
           default:

         }

       });

       res.status(200).send(body.rows);
    //console.log(body.rows[0].value.sentiment.document);
    //res.status(200).send(body.rows[0].value.sentiment.document);
  }
  });
}
