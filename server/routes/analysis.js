const multer = require('multer');
const routes = require('express').Router();
const storage = multer.diskStorage({ destination: (req,file,cb)=>{cb(null, 'tmp/')}, filename: (req,file,cb)=>{cb(null, file.originalname)}});
const upload = multer({storage: storage});

routes.get('/', (req,res)=>{
	res.render('analysis');
})

module.exports = routes;
