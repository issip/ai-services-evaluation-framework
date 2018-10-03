'use strict'
const SpeechToTextV1 = require('watson-developer-cloud/speech-to-text/v1');
// Imports the Google Cloud client library
const speech = require('@google-cloud/speech');
const username = process.env.IBM_SPEECH_TEXT_USERNAME;
const password = process.env.IBM_SPEECH_TEXT_PASSWORD;
const cloudant = require('../../custom_modules/cloudant/cloudantWrapper');
const cloudantInsert = require('../../custom_modules/cloudant/cloudantInsert');
const db_ibm_results = cloudant.db.use(process.env.CLOUDANT_DBNAME_ISSIP_IBM_RESULTS_STT);
const db_google_results = cloudant.db.use(process.env.CLOUDANT_DBNAME_ISSIP_GOOGLE_RESULTS_STT);
const db_data = cloudant.db.use(process.env.CLOUDANT_DBNAME_ISSIP_STT_DATA);
const dateTime = require('date-and-time');

// Creates a client
const client = new speech.SpeechClient();
const fs = require('fs');

var speech_to_text = new SpeechToTextV1 ({
  username: username,
  password: password
});

var resOutput = {
  'vendor': 'IBM',
  'text': ''
};

module.exports = function(req, response){
  var now = new Date().getTime();
  var input = "input.wav";

  return new Promise((resolve,reject)=>{

    db_data.list({include_docs: true}, function(err, dataBody) {
      if(err){
        //response.status(404).send("Error occured" + err);
        console.log("Error occured" + err);
      }
      if(!err){
        var listData = dataBody.rows;
        listData.forEach((record,index)=>{
//retrieve the attachment file.
db_data.attachment.get(record._id, input, function(err, attachbody) {
  if (!err) {
    console.log ("attachbody" + attachbody);
    fs.writeFileSync(input, attachbody);
    
    // call ibm speech to text analyze
    //var files = ['male.wav'];
    var params = {
	  model: 'en-US_NarrowbandModel',
    audio: fs.createReadStream(input),
    content_type: 'audio/wav',
    timestamps: true,
    word_alternatives_threshold: 0.9,
    keywords: ['colorado', 'tornado', 'tornadoes'],
    keywords_threshold: 0.5
  };

  speech_to_text.recognize(params, function(error, output) {
    if (error)
      console.log('Error:', error);
    else
      console.log(JSON.stringify(output, null, 2));

      resOutput = new Object();
      resOutput.vendor = "IBM";
      resOutput.text = output.results[0].alternatives[0].transcript;
      resOutputs[0] = resOutput;
      console.log('resOutput 1' + JSON.stringify(resOutput));


  // call google speech to text analyze
  // The name of the audio file to transcribe

// Reads a local audio file and converts it to base64
console.log('Analyzing google speech to text');
const file = fs.readFileSync(input);
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
    const transcription = response1.results
      .map(result => result.alternatives[0].transcript)
      .join('\n');
    console.log(`Transcription: ${transcription}`);
    resOutput = new Object();
    resOutput.vendor = "Google";
    resOutput.text = transcription;
    resOutputs[1] = resOutput;
    console.log('resOutput 1' + JSON.stringify(resOutput));
    console.log('resOutputs ' + JSON.stringify(resOutputs));
    resolve(resOutputs);
    response.status(200).send(resOutputs);
  })
  .catch(err => {
    console.error('ERROR:', err);
  });
});
	}
});
});
}
});
});
}
