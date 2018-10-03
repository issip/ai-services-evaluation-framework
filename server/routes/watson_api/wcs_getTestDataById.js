'use strict'
const wcs = require('watson-developer-cloud/conversation/v1');
const username = process.env.WCS_NLU_USERNAME;
const password = process.env.WCS_NLU_PASSWORD;
const cloudant = require('../../custom_modules/cloudant/cloudantWrapper');
const cloudantInsert = require('../../custom_modules/cloudant/cloudantInsert');
const db_data = cloudant.db.use(process.env.CLOUDANT_DBNAME_ISSIPDB_DATA);
const dateTime = require('date-and-time');
const NaturalLanguageUnderstandingV1 = require('watson-developer-cloud/natural-language-understanding/v1.js');
const natural_language_understanding = new NaturalLanguageUnderstandingV1({
  'username': username,
  'password': password,
  'version': 'v1',
  'version_date': NaturalLanguageUnderstandingV1.VERSION_DATE_2017_02_27
});

var result = {
  'text': '',
  'score': '0',
  'label': ''
  };

module.exports = function(req, response){
  var input = req.body.id;
  var vendor = req.body.vendor;
  var target_db = null;
  console.log("Vendor Selected:", vendor);
  switch(vendor){
    case "ibm":
          target_db = process.env.CLOUDANT_DBNAME_ISSIP_IBM_RESULTS;
          break;
    case "ms":
          target_db = process.env.CLOUDANT_DBNAME_ISSIP_MS_RESULTS;
          break;
    case "google":
          target_db = process.env.CLOUDANT_DBNAME_ISSIP_GOOGLE_RESULTS;
          break;
     default:
           target_db = process.env.CLOUDANT_DBNAME_ISSIP_IBM_RESULTS; // default DB is IBM WATSON
  }
  var db_results = cloudant.db.use(target_db);
  console.log("id for test data", input);
  var document;
  var body;

  db_data.get(input, (err, document) => {
    console.log('document:', document.text);
    result.text=document.text;
    db_results.view('testDataIdQuery', 'test_data_id', {'key':input} , function(err, body){
      console.log("BODY:",body);
      if(err){
        res.status(404).send("Error occured" + err)
      }
      if(!err){
        console.log("Result:",result);
        //console.log("Rows " + JSON.stringify(body.rows[0]));
        result.score=body.rows[0].value.score;
        result.label=body.rows[0].value.sentiment_label;
        //console.log("result " + JSON.stringify(result));
        console.log("Result after modification :",result);
          response.status(200).send(result);
     //console.log(body.rows[0].value.sentiment.document);
     //res.status(200).send(body.rows[0].value.sentiment.document);
    }
    });
  });
	}
