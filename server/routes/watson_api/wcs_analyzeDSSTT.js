'use strict'
const SpeechToTextV1 = require('watson-developer-cloud/speech-to-text/v1');
// Imports the Google Cloud client library
const speech = require('@google-cloud/speech');
const username = process.env.IBM_SPEECH_TEXT_USERNAME2;
const password = process.env.IBM_SPEECH_TEXT_PASSWORD2;
const cloudant = require('../../custom_modules/cloudant/cloudantWrapper');
const cloudantInsert = require('../../custom_modules/cloudant/cloudantInsert');
const db_ibm_results = cloudant.db.use(process.env.CLOUDANT_DBNAME_ISSIP_IBM_RESULTS_STT);
const db_google_results = cloudant.db.use(process.env.CLOUDANT_DBNAME_ISSIP_GOOGLE_RESULTS_STT);
const db_data = cloudant.db.use(process.env.CLOUDANT_DBNAME_ISSIP_STT_DATA);
const ds_data = cloudant.db.use(process.env.CLOUDANT_DBNAME_ISSIP_DATASET_STT);
const db_version = cloudant.db.use(process.env.CLOUDANT_DBNAME_ISSIP_VERSION);
const dateTime = require('date-and-time');
// Creates a client
const client = new speech.SpeechClient();
const fs = require('fs');

var speech_to_text = new SpeechToTextV1 ({
  username: username,
  password: password
});

module.exports = function(req, response){
    var sentimentMap = {};

    var now = new Date().getTime();
    var dataset_id = now;
    var count = 0;
    var counter = 0;
    var versionMap = {};
    var listRecordsCount = 0;
    var listRecordsCountIdx = 0;
    var sendingResponse = false;

    //fetch the data from dataset
    ds_data.list({include_docs: true}, function(err, body) {
         var listRecords = body.rows;
         listRecordsCount = body.rows.length;
         listRecordsCountIdx = 0;
         var analyzeIbm = false;
         var analyzeGoogle = false;

         db_version.view('apiQuery', 'api', {'key':"Speech-to-Text"} , function(err, versionBody){
           if(err){
             //response.status(404).send("Error occured" + err);
             console.log("Error occured in db version " + err);
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
                           console.log("Error occured in db data " + err);
                         }
                         if(!err){
                           var dataRows = dataBody.rows;
                           console.log("count ", dataBody.rows.length);
                           var count = dataBody.rows.length;
                           var gIndex = 0;
                           //fetch the test data id and
                           dataRows.forEach((data,index)=>{
                             var reference = data.value.reference;
                             var id = data.value._id;
                             var strName = data.value.name;
                             var inputWav = "input.wav";

                             db_data.attachment.get(id, strName, function(err, attachbody) {

                                 if (!err) {

                                   fs.writeFile(inputWav, attachbody, function(err) {

                                     if (err) {

                                       console.log("error while writing file!")

                                     }
else {
                             console.log("test_data_id ", id);

                             counter++;
                             now = now + counter;

                             if (analyzeIbm) {
                               // call ibm speech to text analyze
                               //var files = ['male.wav'];
                               var params = {
                           	  model: 'en-US_NarrowbandModel',
                               audio: fs.createReadStream(inputWav),
                               content_type: 'audio/wav',
                               timestamps: true,
                               word_alternatives_threshold: 0.9,
                               keywords: ['colorado', 'tornado', 'tornadoes'],
                               keywords_threshold: 0.5
                             };

                             speech_to_text.recognize(params, function(error, output) {
                               if (error)
                                 console.log('Error:', error);


                                 var resOutput = new Object();
                                 var transcript = output.results[0].alternatives[0].transcript;
                                 resOutput.vendor = "IBM";
                                 resOutput.text = transcript;
                                 resOutput.data_id = id;

                                 resOutput["date_analyzed"]=dateTime.format(now, 'DD/MM/YYYY');
                                 resOutput["dataset_id"]=dsId;
                                 resOutput["reference"]=reference;
                                 resOutput["version"]=versionMap["IBM"].version;
                                 resOutput["release_date"]=versionMap["IBM"].release_date;
                                 resOutput.wer = 0;

                                 cloudantInsert(db_ibm_results, resOutput, (err, result) =>{
                                     if(err){
                                       console.log('Error inserting to data ' + err);
                                       response.sendStatus(200);
                                     }

                                     console.log('Inserted to db IBM results ' + id);

                                     var referenceIBMFile = "referenceIBMFile"+ id +".txt";
                                     var hypothesisIBMFile = "hypothesisIBMFile"+ id +".txt";

                                     fs.writeFile(referenceIBMFile, reference, function(err, data){
                                         if (err) console.log(err);
                                         fs.writeFile(hypothesisIBMFile, transcript, function(err, data){
                                             if (err) console.log(err);

                                             const spawn = require("child_process").spawn;
                                             const pythonProcess = spawn('python2.7',["wer.py", referenceIBMFile, hypothesisIBMFile]);

                                             pythonProcess.stdout.on('data',function(data){
                                                 console.log("Inside python process IBM");
                                                 var str = data.toString();
                                                 var look = "WER: ";
                                                 var index = str.indexOf("WER: ");
                                                 var wer = 0;

                                                   var str = str.substring(index+5);
                                                   wer = str.substring(0, str.length-2);
                                                   console.log("IBM return value from python", wer);
                                                   if (wer > 0) {
                                                     console.log ("IBM wer " + wer);
                                                     db_ibm_results.view('dataIdQuery', 'data_id', {'key':id} , function(err, ibmData){
                                                       if(err){
                                                         //response.status(404).send("Error occured" + err);
                                                         console.log("Error occured in retrieving data from db_ibm_results " + err);
                                                       }
                                                       if(!err){
                                                         var dataRows = ibmData.rows;
                                                         console.log("IBM rows count ", ibmData.rows.length);
                                                         console.log ("IBM results data " +  JSON.stringify(ibmData.rows[0]));

                                                         ibmData.rows[0].value.wer=wer;
                                                         cloudantInsert(db_ibm_results, ibmData.rows[0].value, (err, result) =>{
                                                             if(err){
                                                               console.log('Error inserting to data ' + err);
                                                               response.sendStatus(200);
                                                             }

                                                             console.log('Inserted to db ibm results ');
                                                           });
                                                       }
                                                     });
                                                   }

                                              });

                                             pythonProcess.stderr.on('data', (data) => {
                                               console.log("error ", data.toString());
                                             });

                                         });
                                       });

                                   });
                             });
                           }
                                  if (analyzeGoogle) {
                                     // Call google analyze
                                     // call google speech to text analyze
                                     // The name of the audio file to transcribe

                                   // Reads a local audio file and converts it to base64
                                   console.log('Analyzing google speech to text');
                                   const file = fs.readFileSync(inputWav);
                                   const audioBytes = file.toString('base64');

                                   // The audio file's encoding, sample rate in hertz, and BCP-47 language code
                                   const audio = {
                                     content: audioBytes,
                                   };
                                   const config = {
                                     languageCode: 'en-US',
                                   };
                                   const request = {
                                     audio: audio,
                                     config: config,
                                   };

                                   // Detects speech in the audio file
                                   client
                                     .recognize(request)
                                     .then(data => {
                                       const response1 = data[0];
                                       const transcript = response1.results
                                         .map(result => result.alternatives[0].transcript)
                                         .join('\n');
                                       var resOutput = new Object();
                                       resOutput.vendor = "Google";
                                       resOutput.text = transcript;
                                       resOutput.data_id = id;
                                       resOutput.wer = 0;

                                       resOutput["date_analyzed"]=dateTime.format(now, 'DD/MM/YYYY');
                                       resOutput["dataset_id"]=dsId;
                                       resOutput["reference"]=reference;
                                       resOutput["version"]=versionMap["Google"].version;
                                       resOutput["release_date"]=versionMap["Google"].release_date;

                                       resOutput["wer"]=0;

                                       cloudantInsert(db_google_results, resOutput, (err, result) =>{
                                           if(err){
                                             console.log('Error inserting to data ' + err);
                                             response.sendStatus(200);
                                           }

                                           console.log('Inserted to db google results ' + id);

                                           var referenceGoogleFile = "referenceGoogleFile"+ id +".txt";
                                           var hypothesisGoogleFile = "hypothesisGoogleFile"+ id +".txt";

                                           fs.writeFile(referenceGoogleFile, reference, function(err, data){
                                               if (err) console.log(err);
                                               fs.writeFile(hypothesisGoogleFile, transcript, function(err, data){
                                                   if (err) console.log(err);

                                                   const spawn = require("child_process").spawn;
                                                   const pythonProcess = spawn('python2.7',["wer.py", referenceGoogleFile, hypothesisGoogleFile]);

                                                   pythonProcess.stdout.on('data',function(data){
                                                     console.log("Inside python process Google");
                                                       var str = data.toString();
                                                       var look = "WER: ";
                                                       var index = str.indexOf("WER: ");
                                                       var wer = 0;

                                                         var str = str.substring(index+5);
                                                         wer = str.substring(0, str.length-2);
                                                         console.log("Google return value from python", wer);
                                                         if (wer > 0) {
                                                           console.log ("Google wer " + wer);
                                                           db_google_results.view('dataIdQuery', 'data_id', {'key':id} , function(err, googleData){
                                                             if(err){
                                                               //response.status(404).send("Error occured" + err);
                                                               console.log("Error occured in retrieving data from db_google_results " + err);
                                                             }
                                                             if(!err){
                                                               var dataRows = googleData.rows;googleData
                                                               console.log("Google rows count ", googleData.rows.length);
                                                               console.log ("Google results data " +  JSON.stringify(googleData.rows[0]));
                                                               googleData.rows[0].value.wer=wer;
                                                               cloudantInsert(db_google_results, googleData.rows[0].value, (err, result) =>{
                                                                   if(err){
                                                                     console.log('Error inserting to data ' + err);
                                                                     response.sendStatus(200);
                                                                   }

                                                                   console.log('Inserted to db google results ');
                                                                 });
                                                             }
                                                           });
                                                         }

                                                    });

                                                   pythonProcess.stderr.on('data', (data) => {
                                                     console.log("error ", data.toString());
                                                   });

                                               });
                                             });
                                         });

                                         response.status(200);

                                     })
                                     .catch(err => {
                                       console.error('ERROR:', err);
                                     });

                                   } // end google

                                  }
                                });
                              }
                           });
                         });
}
});
                         if ((lrindex == (listRecordsCount-1)) && (!sendingResponse))
                         {
                           console.log("Sending response");
                           sendingResponse = true;
                           response.sendStatus(200);
                          }

                       }
                       else if (!analyzeIbm && !analyzeGoogle && !sendingResponse) {
                         console.log("lrindex " + lrindex);
                         console.log("listRecordsCount " + listRecordsCount);
                         if (listRecordsCountIdx == listRecordsCount)
                         {
                           console.log("Sending response");
                           sendingResponse = true;
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
      if (!sendingResponse)
      {
        console.log("Sending response");
        sendingResponse = true;
        response.sendStatus(200);
       }
    });
  }
