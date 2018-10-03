'use strict'
const cloudant = require('../../custom_modules/cloudant/cloudantWrapper');
const cloudantInsert = require('../../custom_modules/cloudant/cloudantInsert');
const cloudantBulk = require('../../custom_modules/cloudant/cloudantBulk');
const db_results = cloudant.db.use(process.env.CLOUDANT_DBNAME_ISSIP_GOOGLE_RESULTS_SENT);
const db_data = cloudant.db.use(process.env.CLOUDANT_DBNAME_ISSIP_DATA_SENT);
const excelToJson = require('convert-excel-to-json');
const dateTime = require('date-and-time');
// Imports the Google Cloud client library
const language = require('@google-cloud/language');
// Instantiates a client
const client = new language.LanguageServiceClient();

module.exports = function(req, response){
  //var file = req.files.sampleFile;
  var file = req.files;
  const result = excelToJson({
      sourceFile: "Test_Data.xlsx",
        //sourceFile: file.name,
        columnToKey: {
            A: 'Test_Data'
        },header:{
            rows: 1
        }
    });

    var dataList = result.Sheet1;
    var list_db_data = new Array();
    var now = new Date().getTime();
    var count = 0;
    dataList.forEach((data,index)=>{
          console.log("test data:  " + data.Test_Data);
          count++;
          now = now + count;

          var inputMainDB = {
            '_id': '1',
            'text': '',
            'sentiment_gt':''
            };

          inputMainDB.text = data.Test_Data;
          inputMainDB._id = now.toString();

          list_db_data[index] = inputMainDB;
      });
      console.log("List_Data length:",list_db_data.length);
      cloudantBulk(db_data, list_db_data, (err, result) =>{
        if(err){
          console.log('Error inserting to data ' + err);
          response.sendStatus(404);
        }
        else{
          console.log('Inserted to db data');
          list_db_data.forEach((datatest,index)=>{
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
                  res["test_data_id"]=id;
                  res["date_analyzed"]=dateTime.format(now, 'DD/MM/YYYY');
                  res["sme_update"]="";
                  res["sme_comment"]="";
                  //  console.log("date " + dateTime.format(now, 'DD/MM/YYYY'));
                  cloudantInsert(db_results, res, (err, result) =>{
                    if(err){
                      console.log('Error inserting to results ' + err);
                    }
                    else{
                      console.log('Inserted to db results');
                    }
                  });
              			});
              		});
          	  }
              response.sendStatus(200);
        });

    }
