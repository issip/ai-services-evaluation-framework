'use strict'

module.exports = function(db, body, callback){
	if(body._id){
		db.get(body._id, (err, document) => {
			console.log('document', document);
			if(document){
				body._rev = document._rev;
			}
			console.log('body', body);
			db.insert(body, (err, result) => {
				if(typeof callback !== 'undefined'){
					callback(err, result);
				}
			});
		});		
	}
}
