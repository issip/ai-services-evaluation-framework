'use strict'
const wcs = require('watson-developer-cloud/conversation/v1');
const username = process.env.WCS_NLU_USERNAME;
const password = process.env.WCS_NLU_PASSWORD;
const cloudant = require('../../custom_modules/cloudant/cloudantWrapper');
const cloudantBulk = require('../../custom_modules/cloudant/cloudantBulk');
const cloudantInsert = require('../../custom_modules/cloudant/cloudantInsert');
//var db_s = cloudant.db.use(process.env.CLOUDANT_DBNAME_ISSIP_IBM_S);
const db_ibm_results = cloudant.db.use(process.env.CLOUDANT_DBNAME_ISSIP_IBM_RESULTS_STT);
const db_google_results = cloudant.db.use(process.env.CLOUDANT_DBNAME_ISSIP_GOOGLE_RESULTS_STT);
const fs = require('fs');
const ds_data = cloudant.db.use(process.env.CLOUDANT_DBNAME_ISSIP_DATASET_STT);
const db_version = cloudant.db.use(process.env.CLOUDANT_DBNAME_ISSIP_VERSION);

module.exports = function(req,res){
  var startDate = req.body.startDate;
  var endDate = req.body.endDate;
  var listRecords;
  var listRecordsCount=0;
  var listRecordsIdx=0;
  var dsRecords = [];
  var resOutputs = new Array();
  var resCount = -1;
  var versionMap = {};

  var resOutput = {
    'metadata': {'service': 'Speech To Text', 'feature': 'Speech To Text', 'language': 'English(US)', 'version':[{vendor: 'IBM', version: '02-27-2017', 'release_date': ''}, {vendor: 'Google', version: '', 'release_date': ''}]},
    'result': [{'dataset': '',
								 'date_analyzed': "",
                 'vendor_result': [{'vendor': '', 'WER':0}]
               }]
  };

  resOutput.result = new Array();
  var results = new Array();

  ds_data.list({include_docs: true}, function(err, body) {
       console.log("rows ", body.rows);
       listRecords = body.rows;
       listRecordsCount = body.rows.length;
       var outIdx = -1;

       db_version.view('apiQuery', 'api', {'key':"Speech-to-Text"} , function(err, body){
         if(err){
           //res.status(404).send("Error occured" + err);
           console.log("Error occured" + err);
         }
         if(!err){
           var listVersions = body.rows;
           console.log("Data records", listVersions);
           var listVersionsCount = body.rows.length;
           listVersions.forEach((record,index)=>{
             versionMap[record.value.vendor] = {"version": record.value.version, "release_date": record.value.release_date};
             resOutput.metadata.version[index].vendor = record.value.vendor;
             resOutput.metadata.version[index].version = record.value.version;
             resOutput.metadata.version[index].release_date = record.value.release_date
            });


       //outer for loop for dataset
        listRecords.forEach((record,index)=>{

         var  result = {
           'dataset': "",
          'date_analyzed': "",
           'vendor_result': [{'vendor': '', 'WER':0}]
         };

         listRecordsIdx++;
         var dsId = record.doc.datasetId;
         var dsName = record.doc.datasetName;
         if (dsId == undefined)
          return;
         console.log("resOutput", JSON.stringify(resOutput));
         result.dataset = dsName;

         console.log("dsId ", dsId);
         var ibmWer = 0;
         var googleWer = 0;

         var version = versionMap["IBM"].version;
         var release = versionMap["IBM"].release_date;
         console.log("Version Map IBM version " + versionMap["IBM"].version);
         console.log("Version Map IBM release date " + versionMap["IBM"].release_date);

         // Generate IBM DS data
         db_ibm_results.view('datasetIdQuery', 'dataset_id', {'key': [dsId, version, release]} , function(err, body){
           if(err){
             //res.status(404).send("Error occured" + err);
             console.log("Error occured" + err);
           }
           if(!err){
             console.log("IBM records for datasetId ",  dsId);
             var ibmDSRows = body.rows;
             console.log("count ", body.rows.length);
             var icount = body.rows.length;
             var iIndex = 0;

             //
              ibmDSRows.forEach((ibmData,idx)=>{
               iIndex++;

               console.log("text" , ibmData.value.text);
               console.log("reference" , ibmData.value.reference);
               console.log("test_data_id : " , ibmData.value.test_data_id);
               var reference=ibmData.value.reference;
               var transcript=ibmData.value.text;
               var test_id = ibmData.value.data_id;
               var wer = ibmData.value.wer;

               if (wer > 0)
                ibmWer = parseInt(ibmWer) + parseInt(wer);


               console.log ("IBM wer ", wer);
               console.log ("iIndex ", iIndex);
               console.log ("icount ", icount);
             });
             console.log ("Total IBM wer ", ibmWer);
             console.log ("Total IBM index ", iIndex);

             ibmWer = (parseInt(ibmWer)/parseInt(iIndex)).toFixed(2);
               console.log ("dsId " + dsId + " ibm map ");

               result.vendor_result = new Array();
               var vendor_result = {'vendor': '', 'WER':0};

               vendor_result.vendor="IBM";
               vendor_result.WER=ibmWer;

               console.log("vendor  ", vendor_result);
               result.vendor_result[0]=vendor_result;

               version = versionMap["Google"].version;
               release = versionMap["Google"].release_date;
               console.log("Version Map Google version " + versionMap["Google"].version);
               console.log("Version Map Google release date " + versionMap["Google"].release_date);

         // Generate Google DS s data
         db_google_results.view('datasetIdQuery', 'dataset_id', {'key': [dsId, version, release]} , function(err, body){
           if(err){
             //res.status(404).send("Error occured" + err);
             console.log("Error occured" + err);
           }
           if(!err){
             console.log("Google records for datasetId ",  dsId);
             var googleDSRows = body.rows;
             console.log("count ", body.rows.length);
             var gcount = body.rows.length;
             var gIndex = 0;


             googleDSRows.forEach((googleData,idx)=>{
               gIndex++;

               if (googleData == undefined)
               return;

               console.log("text : " , googleData.value.text);
               console.log("reference : " , googleData.value.reference);
               console.log("test_data_id : " , googleData.value.test_data_id);


               result.dataset = dsName;
               result.date_analyzed =  googleData.value.date_analyzed;
               var test_id = googleData.value.data_id;
               var reference=googleData.value.reference;
               var transcript=googleData.value.text;
               var wer = googleData.value.wer;
               console.log ("Google wer ", wer);
               if (wer > 0)
               googleWer = parseInt(googleWer) + parseInt(wer);

             });

             console.log ("Total Google wer ", googleWer);
             console.log ("Total Google index ", gIndex);
             googleWer = (parseInt(googleWer)/parseInt(gIndex)).toFixed(2);
                 var vendor_result = {'vendor': '', 'WER':0};

                 vendor_result.vendor="Google";
                 vendor_result.WER=googleWer;
                 console.log("vendor  ", vendor_result);
                 result.vendor_result[1]=vendor_result;

                 outIdx++;
                 results[outIdx] = result;

console.log ("listRecordsCount ", listRecordsCount);
console.log ("outIdx ", outIdx);
                 if (listRecordsCount == (outIdx+2))
                 {
                          resOutput.result = results;
                          console.log("Final response");
                          console.log('resOutput ' + JSON.stringify(resOutput));

                          res.status(200).send(resOutput);
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
