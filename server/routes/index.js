const multer = require('multer');
const routes = require('express').Router();
const storage = multer.diskStorage({ destination: (req,file,cb)=>{cb(null, 'tmp/')}, filename: (req,file,cb)=>{cb(null, file.originalname)}});
const upload = multer({storage: storage});

routes.get('/', (req,res)=>{
	res.render('index');
})

//routes.post('/msSentimentAnalysis',require('./watson_api/ms_sentimentAnalysis'));

routes.post('/getDSReport',require('./watson_api/wcs_getDSReport'));
routes.post('/analyzeSentimentNoDB',require('./watson_api/wcs_analyzeSentimentNoDB.js'));
routes.post('/importDSSentiment',require('./watson_api/wcs_importDSSentiment.js'));
routes.post('/analyzeDSSentiment',require('./watson_api/wcs_analyzeDSSentiment.js'));
routes.post('/ibmSentimentAnalysis',require('./watson_api/wcs_sentimentAnalysis'));

routes.post('/getDSSTTReport',require('./watson_api/wcs_getDSSTTReport'));
routes.post('/importDSSTT',require('./watson_api/wcs_importDSSTT.js'));
routes.post('/analyzeDSSTT',require('./watson_api/wcs_analyzeDSSTT.js'));

routes.post('/dbSetup',require('./watson_api/db_setup.js'));

module.exports = routes;
