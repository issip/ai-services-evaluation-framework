'use strict'

module.exports = function(cloudant, dbName, designDoc1, designDoc2){
	cloudant.db.destroy(dbName, function(err) {
		console.log("Deleted");
		cloudant.db.create(dbName, (err) => {
			if (err) {
				return console.log("error creating db " + dbName);
			}
			console.log("Created db " + dbName);

			var db = cloudant.db.use(dbName)
		    // ...and insert a document in it.
		    db.insert(designDoc1, function(error, result) {
		      if (error) {
		        return console.log("error in design doc1 insert", error.message);
		      }
		      console.log('inserted the designDoc1.');
		    });

				if (designDoc2) {
					db.insert(designDoc2, function(error1, result) {
		      	if (error1) {
		        	return console.log("error in design doc2 insert", error1.message);
		      	}
		      	console.log('inserted the designDoc2.');
		    	});
				}
		}) ;
	});
}
