'use strict'

module.exports = function(db, body, callback){
	db.insert(body, (err, result) => {
		if(typeof callback !== 'undefined'){
			callback(err, result);	
		}
	});
}
