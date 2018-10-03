'use strict'
const wcs = require('watson-developer-cloud/conversation/v1');
const username = process.env.WCS_NLU_USERNAME;
const password = process.env.WCS_NLU_PASSWORD;
const cloudant = require('../../custom_modules/cloudant/cloudantWrapper');
const cloudantInsert = require('../../custom_modules/cloudant/cloudantInsert');
const db_ibm_results = cloudant.db.use(process.env.CLOUDANT_DBNAME_ISSIP_IBM_RESULTS_SENT);
const db_data = cloudant.db.use(process.env.CLOUDANT_DBNAME_ISSIP_DATA_SENT);
const dateTime = require('date-and-time');
const db_google_results = cloudant.db.use(process.env.CLOUDANT_DBNAME_ISSIP_GOOGLE_RESULTS_SENT);
// Imports the Google Cloud client library
const language = require('@google-cloud/language');
// Instantiates a client
const client = new language.LanguageServiceClient();

const document = {
  content: "",
  type: 'PLAIN_TEXT',
};

const NaturalLanguageUnderstandingV1 = require('watson-developer-cloud/natural-language-understanding/v1.js');
const natural_language_understanding = new NaturalLanguageUnderstandingV1({
  'username': username,
  'password': password,
  'version': 'v1',
  'version_date': NaturalLanguageUnderstandingV1.VERSION_DATE_2017_02_27
});

var inputMain = {
  '_id': '1',
  'text': 'IBM is an American multinational technology company headquartered in Armonk, New York, United States, with operations in over 170 countries.',
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
  'text': 'IBM is an American multinational technology company headquartered in Armonk, New York, United States, with operations in over 170 countries.',
  'sentiment_gt':''
  };

  var resOutput = {
    'vendor': 'IBM',
    'result': {}
  };

module.exports = function(req, response){
  var now = new Date().getTime();
  var input = req.body.textInput;
  var gt = req.body.groundTruth;
  var resOutputs = new Array();
  var ibmMap = {};
  var googleMap = {};

  ibmMap[now] = {'TP': 0, 'FN': 0, 'FP':0, 'TN':0};
  googleMap[now] = {'TP': 0, 'FN': 0, 'FP':0, 'TN':0};

  inputMain.text = input;
  inputMain._id = now.toString();
  inputMainDB._id = now.toString();
  inputMainDB.text = input;

  console.log('input:', input);
  console.log('ground truth:', gt);
  console.log('date:', now);
  console.log('Got WCS Sentiment query :', inputMain);

  return new Promise((resolve,reject)=>{

    // call ibm analyze
		natural_language_understanding.analyze(inputMain, (err,res)=>{
			if (err){
				reject('Error: ', err);
			}else{

        res["test_data_id"]=now.toString();
        res["date_analyzed"]=dateTime.format(now, 'DD/MM/YYYY');
        res["score"]=(res.sentiment.document.score).toFixed(2);
        res["sentiment_label"]=res.sentiment.document.label;
        var label = res.sentiment.document.label;

        res["sme_update"]="";
        res["sme_comment"]="";
        res["dataset_id"]="";
        res["sentiment_gt"]="";

        resOutput = new Object();
        resOutput.vendor = "IBM";
        resOutput.result = res;

        if ((gt.toLowerCase() == "positive") && (label.toLowerCase() == "positive"))
        {
          ibmMap[now].TP=ibmMap[now].TP+1;
        }
        else if ((gt.toLowerCase() == "positive") && (label.toLowerCase() == "negative"))
        {
          ibmMap[now].FN=ibmMap[now].FN+1;
        }
        else if ((gt.toLowerCase() == "negative") && (label.toLowerCase() == "positive"))
        {
          ibmMap[now].FP=ibmMap[now].FP+1;
        }
        else if ((gt.toLowerCase() == "negative") && (label.toLowerCase() == "negative"))
        {
          ibmMap[now].TN=ibmMap[now].TN+1;
        }

        console.log("*************** IBM map ******************");
        console.log ("TP ", ibmMap[now].TP);
        console.log ("FN ", ibmMap[now].FN);
        console.log ("FP ", ibmMap[now].FP);
        console.log ("TN ", ibmMap[now].TN);
        console.log("**************** IBM map *****************");

        var accuracy = (ibmMap[now].TP + ibmMap[now].TN)/(ibmMap[now].TP + ibmMap[now].TN+ibmMap[now].FP+ibmMap[now].FN);

        var precision = ibmMap[now].TP/(ibmMap[now].TP + ibmMap[now].FP);

        console.log ("accuracy ", accuracy);
        console.log ("precision ", precision);

        if (isNaN(accuracy))
        accuracy = 0;

        if (isNaN(precision))
        precision = 0;

        resOutput.accuracy=(accuracy).toFixed(2);
        resOutput.precision=(precision).toFixed(2);

        resOutputs[0] = resOutput;
        console.log('resOutput 0' + JSON.stringify(resOutput));
        // analyze google data
        // Call google analyze

        var document = {
          content: "",
          type: 'PLAIN_TEXT',
        };
        document.content = input;
        var id = now.toString();
        client
            .analyzeSentiment({document: document})
            .then(results => {
              const resp = results[0];
              const sentiment = results[0].documentSentiment;

              console.log(`Sentiment score: ${sentiment.score}`);
              console.log(`Sentiment magnitude: ${sentiment.magnitude}`);

              console.log('Inserting to db results ' + now);
              resp["test_data_id"]=now.toString();
              resp["date_analyzed"]=dateTime.format(now, 'DD/MM/YYYY');
              resp["score"]=(sentiment.score).toFixed(2);
              resp["sme_update"]="";
              resp["sme_comment"]="";
              resp["dataset_id"]="";
              resp["sentiment_gt"]="";

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
              resp["sentiment_label"] = sentiment_label;
              var label = sentiment_label;

              if ((gt.toLowerCase() == "positive") && (label.toLowerCase() == "positive"))
              {
                googleMap[now].TP=googleMap[now].TP+1;
              }
              else if ((gt.toLowerCase() == "positive") && (label.toLowerCase() == "negative"))
              {
                googleMap[now].FN=googleMap[now].FN+1;
              }
              else if ((gt.toLowerCase() == "negative") && (label.toLowerCase() == "positive"))
              {
                googleMap[now].FP=googleMap[now].FP+1;
              }
              else if ((gt.toLowerCase() == "negative") && (label.toLowerCase() == "negative"))
              {
                googleMap[now].TN=googleMap[now].TN+1;
              }

              console.log("*************** Google map ******************");
              console.log ("TP ", googleMap[now].TP);
              console.log ("FN ", googleMap[now].FN);
              console.log ("FP ", googleMap[now].FP);
              console.log ("TN ", googleMap[now].TN);
              console.log("**************** Google map *****************");

              var accuracy = (googleMap[now].TP + googleMap[now].TN)/(googleMap[now].TP + googleMap[now].TN+googleMap[now].FP+googleMap[now].FN);

              var precision = googleMap[now].TP/(googleMap[now].TP + googleMap[now].FP);

              if (isNaN(accuracy))
              accuracy = 0;

              if (isNaN(precision))
              precision = 0;

              console.log ("accuracy ", accuracy);
              console.log ("precision ", precision);

              resOutput = new Object();
              resOutput.vendor = "Google";
              resOutput.accuracy=(accuracy).toFixed(2);
              resOutput.precision=(precision).toFixed(2);
              resOutput.result = resp;
              resOutputs[1] = resOutput;
              console.log('resOutput 1' + JSON.stringify(resOutput));
              console.log('resOutputs ' + JSON.stringify(resOutputs));
              resolve(resOutputs);
              response.status(200).send(resOutputs);
        });
			}
		});
	});
}
