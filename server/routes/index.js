const multer = require('multer');
const routes = require('express').Router();
const storage = multer.diskStorage({ destination: (req,file,cb)=>{cb(null, 'tmp/')}, filename: (req,file,cb)=>{cb(null, file.originalname)}});
const upload = multer({storage: storage});

routes.get('/', (req,res)=>{
	res.render('index');
})

routes.post('/ibmSentimentAnalysis',require('./watson_api/wcs_sentimentAnalysis'));
routes.get('/ibmSentimentAnalysisReport',require('./watson_api/wcs_sentimentAnalysisReport'));
routes.post('/ibmImportTestData',require('./watson_api/wcs_importTestData'));
routes.post('/importDSSentiment', require('./watson_api/wcs_importDSSentiment'));
routes.post('/listResults',require('./watson_api/wcs_listResults'));
routes.post('/googleSentimentAnalysis',require('./watson_api/google_sentimentAnalysis'));
routes.post('/googleImportTestData',require('./watson_api/google_importTestData'));
routes.post('/msSentimentAnalysis',require('./watson_api/ms_sentimentAnalysis'));
//routes.post('/googleImportTestData',require('./watson_api/ms_importTestData'));
routes.post('/getTestDataById',require('./watson_api/wcs_getTestDataById'));
//routes.post('/speechToTextEnglish',require('./watson_api/speechToTextEnglish'));
routes.post('/speechToTextEnglish',require('./watson_api/speechToTextEnglish'));
routes.post('/analyzeSTTEnglish',require('./watson_api/analyzeSTTEnglish'));
routes.post('/getDSReport',require('./watson_api/wcs_getDSReport'));
routes.post('/getDSSTTReport',require('./watson_api/wcs_getDSSTTReport'));
routes.post('/analyzeSentimentNoDB',require('./watson_api/wcs_analyzeSentimentNoDB.js'));
routes.post('/importDSSentiment',require('./watson_api/wcs_importDSSentiment.js'));
routes.post('/analyzeDSSentiment',require('./watson_api/wcs_analyzeDSSentiment.js'));
routes.post('/importDSSTT',require('./watson_api/wcs_importDSSTT.js'));
routes.post('/analyzeDSSTT',require('./watson_api/wcs_analyzeDSSTT.js'));

module.exports = routes;
