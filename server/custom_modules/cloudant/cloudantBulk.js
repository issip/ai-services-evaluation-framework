'use strict'

module.exports = function(db, body, callback){
	console.log("Adding multiple documents to Cloudant DB:");
	let jsonObj = {}
	jsonObj.docs = body;
	db.bulk(jsonObj, (err,result)=>{
		if(typeof callback !== 'undefined'){
			callback(err, result);
		}
	});	
}