'use strict'
const cfenv = require('cfenv');
const dotenv = require('dotenv').config();
const express = require('express');
const path = require('path');
const https = require('https');
const passport = require('passport');
const BasicStrategy = require('passport-http').BasicStrategy;
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
var envs = require('envs');

const appEnv = cfenv.getAppEnv();
const app = express();
const routes = require('./routes/index');
const reports = require('./routes/reports');
const analysis = require('./routes/analysis');
const admin = require('./routes/admin');

//app.set('GOOGLE_APPLICATION_CREDENTIALS', envs('google-cred.json')); //uncomment if google-cred.json has valid google credentials
app.use(requireHTTPS) //force https only policy
app.set('view engine','ejs');
app.use(express.static(process.cwd()));
app.set('views',`${__dirname}/../client/build/html/`);
app.use(express.static(path.join(__dirname,'../client/build/')));
app.use(express.static(path.join(__dirname,'../client/src/libs/')));
app.use('/uploads', express.static('./uploads'));
app.use(bodyParser.json({limit: "50mb"})); //used to parse application/json
app.use(bodyParser.urlencoded({limit: "50mb", extended: true, parameterLimit:50000}));
app.use(fileUpload());

passport.use(new BasicStrategy(
	function(username, password, done){
			const user = {username: '', password: ''};
			if (!user) {return done(null, false);}
			if (username != user.username) {return done(null, false);}
			if (password != user.password) {return done(null, false);}
			return done(null, user);
	}
));

if(process.env.HOST_ENV === 'local'){
	app.use('/', routes);
	app.use('/reports', reports);
	app.use('/analysis', analysis);
	app.use('/admin', admin);
}else{
	app.use('/', passport.authenticate('basic',{session:false}), routes);
	app.use('/reports', passport.authenticate('basic',{session:false}), reports);
	app.use('/analysis', passport.authenticate('basic',{session:false}), analysis);
}

app.listen(appEnv.port,(err)=>{
	if(err){
		throw err;
	}else{
		console.log("Server starting on port:", appEnv.port);
	}
})

function requireHTTPS(req,res,next){
  if (req.headers && req.headers.$wssp === "80") {
    return res.redirect('https://'+ req.get('host') + req.url);
  }
  next();
}
