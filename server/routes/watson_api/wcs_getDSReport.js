'use strict'
const wcs = require('watson-developer-cloud/conversation/v1');
const username = process.env.WCS_NLU_USERNAME;
const password = process.env.WCS_NLU_PASSWORD;
const cloudant = require('../../custom_modules/cloudant/cloudantWrapper');
const cloudantBulk = require('../../custom_modules/cloudant/cloudantBulk');
const cloudantInsert = require('../../custom_modules/cloudant/cloudantInsert');
//var db_s = cloudant.db.use(process.env.CLOUDANT_DBNAME_ISSIP_IBM_S);
const db_ibm_results = cloudant.db.use(process.env.CLOUDANT_DBNAME_ISSIP_IBM_RESULTS_SENT);
const db_google_results = cloudant.db.use(process.env.CLOUDANT_DBNAME_ISSIP_GOOGLE_RESULTS_SENT);
const db_data = cloudant.db.use(process.env.CLOUDANT_DBNAME_ISSIP_DATA_SENT);
const ds_data = cloudant.db.use(process.env.CLOUDANT_DBNAME_ISSIP_DATASET_SENT);
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
    'metadata': {'service': 'Natural Language Understanding', 'feature': 'Sentiment Analysis', 'language': 'English(US)', 'version':[{vendor: 'IBM', version: '02-27-2017', 'release_date': ''}, {vendor: 'Google', version: '', 'release_date': ''}]},
    'result': [{'dataset': '',
								 'date_analyzed': "",
                 'vendor_result': [{'vendor': '', 'accuracy':0, 'precision':0}]
               }]
  };

  resOutput.result = new Array();
  var results = new Array();

  ds_data.list({include_docs: true}, function(err, body) {
       console.log("rows ", body.rows);
       listRecords = body.rows;
       listRecordsCount = body.rows.length;
       var outIdx = -1;

       db_version.view('apiQuery', 'api', {'key':"NaturalLanguage"} , function(err, body){
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
           'vendor_result': [{'vendor': '', 'accuracy':0, 'precision':0}]
         };

         listRecordsIdx++;
         var dsId = record.doc.datasetId;
         var dsName = record.doc.datasetName;
         if (dsId == undefined)
          return;
         console.log("resOutput", JSON.stringify(resOutput));
         result.dataset = dsName;

         console.log("dsId ", dsId);
         var ibmMap = {};
         var googleMap = {};

         var version = versionMap["IBM"].version;
         var release = versionMap["IBM"].release_date;
         console.log("Version Map IBM version " + versionMap["IBM"].version);
         console.log("Version Map IBM release date " + versionMap["IBM"].release_date);

         // Generate IBM DS s data
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
             ibmMap[dsId] = {'TP': 0, 'FN': 0, 'FP':0, 'TN':0};

             console.log("*************** IBM map ******************");
             console.log ("TP ", ibmMap[dsId].TP);
             console.log ("FN ", ibmMap[dsId].FN);
             console.log ("FP ", ibmMap[dsId].FP);
             console.log ("TN ", ibmMap[dsId].TN);
             console.log("**************** IBM map *****************");

             //
              ibmDSRows.forEach((ibmData,idx)=>{
               iIndex++;

               console.log("sentiment label : " , ibmData.value.sentiment_label);
               console.log("sentiment gt : " , ibmData.value.sentiment_gt);
               console.log("test_data_id : " , ibmData.value.test_data_id);
               result.date_analyzed =  ibmData.value.date_analyzed;

               var gt = ibmData.value.sentiment_gt;
               var label = ibmData.value.sentiment_label;

               if ((gt.toLowerCase() == "positive") && (label.toLowerCase() == "positive"))
               {
                 ibmMap[dsId].TP=ibmMap[dsId].TP+1;
               }
               else if ((gt.toLowerCase() == "positive") && (label.toLowerCase() == "negative"))
               {
                 ibmMap[dsId].FN=ibmMap[dsId].FN+1;
               }
               else if ((gt.toLowerCase() == "negative") && (label.toLowerCase() == "positive"))
               {
                 ibmMap[dsId].FP=ibmMap[dsId].FP+1;
               }
               else if ((gt.toLowerCase() == "negative") && (label.toLowerCase() == "negative"))
               {
                 ibmMap[dsId].TN=ibmMap[dsId].TN+1;
               }


               console.log ("iIndex ", iIndex);
               console.log ("icount ", icount);
             });

               console.log ("dsId " + dsId + " ibm map ");
               console.log ("TP ", ibmMap[dsId].TP);
               console.log ("FN ", ibmMap[dsId].FN);
               console.log ("FP ", ibmMap[dsId].FP);
               console.log ("TN ", ibmMap[dsId].TN);

               var accuracy = (ibmMap[dsId].TP + ibmMap[dsId].TN)/(ibmMap[dsId].TP + ibmMap[dsId].TN+ibmMap[dsId].FP+ibmMap[dsId].FN);

               var precision = ibmMap[dsId].TP/(ibmMap[dsId].TP + ibmMap[dsId].FP);

               console.log ("accuracy ", accuracy);
               console.log ("precision ", precision);

               result.vendor_result = new Array();
               var vendor_result = {'vendor': '', 'accuracy':0, 'precision':0};

               vendor_result.vendor="IBM";
               vendor_result.accuracy=(accuracy).toFixed(2) * 100;
               vendor_result.precision=(precision).toFixed(2) * 100;

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

             googleMap[dsId] = {'TP': 0, 'FN': 0, 'FP':0, 'TN':0};

             console.log("**************Google map*******************");
             console.log ("TP ", googleMap[dsId].TP);
             console.log ("FN ", googleMap[dsId].FN);
             console.log ("FP ", googleMap[dsId].FP);
             console.log ("TN ", googleMap[dsId].TN);
             console.log("************** Google map *********");

             googleDSRows.forEach((googleData,idx)=>{
               gIndex++;

               if (googleData == undefined)
               return;

               console.log("sentiment label : " , googleData.value.sentiment_label);
               console.log("sentiment gt : " , googleData.value.sentiment_gt);
               console.log("test_data_id : " , googleData.value.test_data_id);

               var gt = googleData.value.sentiment_gt;
               var label = googleData.value.sentiment_label;
               result.dataset = dsName;
               result.date_analyzed =  googleData.value.date_analyzed;

               if ((gt.toLowerCase() == "positive") && (label.toLowerCase() == "positive"))
               {
                 googleMap[dsId].TP=googleMap[dsId].TP+1;
               }
               else if ((gt.toLowerCase() == "positive") && (label.toLowerCase() == "negative"))
               {
                 googleMap[dsId].FN=googleMap[dsId].FN+1;
               }
               else if ((gt.toLowerCase() == "negative") && (label.toLowerCase() == "positive"))
               {
                 googleMap[dsId].FP=googleMap[dsId].FP+1;
               }
               else if ((gt.toLowerCase() == "negative") && (label.toLowerCase() == "negative"))
               {
                 googleMap[dsId].TN=googleMap[dsId].TN+1;
               }

             });
                 console.log ("dsId " + dsId + " google map ");
                 console.log ("TP ", googleMap[dsId].TP);
                 console.log ("FN ", googleMap[dsId].FN);
                 console.log ("FP ", googleMap[dsId].FP);
                 console.log ("TN ", googleMap[dsId].TN);

                 var accuracy = (googleMap[dsId].TP + googleMap[dsId].TN)/(googleMap[dsId].TP + googleMap[dsId].TN+googleMap[dsId].FP+googleMap[dsId].FN);

                 var precision = googleMap[dsId].TP/(googleMap[dsId].TP + googleMap[dsId].FP);

                 console.log ("accuracy ", accuracy);
                 console.log ("precision ", precision);

                 var vendor_result = {'vendor': '', 'accuracy':0, 'precision':0};

                 vendor_result.vendor="Google";
                 vendor_result.accuracy=(accuracy).toFixed(2) * 100;
                 vendor_result.precision=(precision).toFixed(2) * 100;

                 console.log("vendor  ", vendor_result);
                 result.vendor_result[1]=vendor_result;

                 outIdx++;
                 results[outIdx] = result;

                 if (listRecordsCount == (outIdx+1))
                 {
                          resOutput.result = results;
                          console.log("Final response");
                          console.log('resOutput ' + JSON.stringify(resOutput));

                          res.status(200).send(resOutput);
                 }

                 /*
                 if (listRecordsIdx == listRecordsCount)
                 {
                   console.log("Final response");
                   console.log('resOutput Google 0 ' + JSON.stringify(resOutputs[0]));
                   console.log('resOutput Google 1 ' + JSON.stringify(resOutputs[1]));
                   console.log('resOutput Google 2 ' + JSON.stringify(resOutputs[2]));
                   console.log('resOutput Google 3 ' + JSON.stringify(resOutputs[3]));
                   console.log('resOutputs ' + JSON.stringify(resOutputs));
                 }
*/

               }
             });

           }
         });
         /*
         console.log("outer for loop " + outIdx);
         outIdx++;
         s[outIdx] = ;
         console.log(" " + JSON.stringify());
          console.log("listRecordsCount " + listRecordsCount);
           console.log("outIdx " + outIdx);


*/
       });

        }
});
       });
     }
