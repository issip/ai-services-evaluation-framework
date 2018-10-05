'use strict'
const cloudant = require('../../custom_modules/cloudant/cloudantWrapper');
const cloudantInsert = require('../../custom_modules/cloudant/cloudantInsert');
const cloudantCreateDB = require('../../custom_modules/cloudant/cloudantCreateDBWithDesignDoc');

var dataset_design_doc = {
		"_id": "_design/datasetIdQuery",
		  "views": {
		    "dataset_id": {
		      "map": "function (doc) {\n  if (doc.dataset_id)\n  emit(doc.dataset_id, doc);\n}"
		    }
		  },
		  "language": "javascript"
};

var data_design_doc = {
	"_id": "_design/dataIdQuery",
	"views": {
	"data_id": {
		"map": "function (doc) {\n  if (doc._id && doc.data_id)\n  emit(doc.data_id, doc, doc._id);\n}"
		}
	},
	"language": "javascript"
};

var api_design_doc = {
	"_id": "_design/apiQuery",
	"views": {
		"api": {
			"map": "function (doc) {\n   if (doc.api && doc._id)\n    emit(doc.api, doc, doc._id);\n}"
		}
	},
	"language": "javascript"
};

const db_ibm_results_sent = process.env.CLOUDANT_DBNAME_ISSIP_IBM_RESULTS_SENT;
const db_google_results_sent = process.env.CLOUDANT_DBNAME_ISSIP_GOOGLE_RESULTS_SENT;
const db_data_sent = process.env.CLOUDANT_DBNAME_ISSIP_DATA_SENT;
const db_dataset_sent = process.env.CLOUDANT_DBNAME_ISSIP_DATASET_SENT;
const db_dataset_stt = process.env.CLOUDANT_DBNAME_ISSIP_DATASET_STT;
const db_data_stt = process.env.CLOUDANT_DBNAME_ISSIP_STT_DATA;
const db_datapath_stt = process.env.CLOUDANT_DBNAME_ISSIP_STT_DATA_PATH;
const db_ibm_results_stt = process.env.CLOUDANT_DBNAME_ISSIP_IBM_RESULTS_STT;
const db_google_results_stt = process.env.CLOUDANT_DBNAME_ISSIP_GOOGLE_RESULTS_STT;
const db_api_version = process.env.CLOUDANT_DBNAME_ISSIP_VERSION;

module.exports = function(req, response){
	cloudantCreateDB(cloudant, db_google_results_stt, dataset_design_doc, data_design_doc);
	cloudantCreateDB(cloudant, db_ibm_results_stt, dataset_design_doc, data_design_doc);

	setTimeout(function() {
		cloudantCreateDB(cloudant, db_api_version, api_design_doc);
		cloudantCreateDB(cloudant, db_data_sent, dataset_design_doc);
	}, 2000);

	setTimeout(function() {
		cloudantCreateDB(cloudant, db_dataset_sent, dataset_design_doc);
		cloudantCreateDB(cloudant, db_dataset_stt, dataset_design_doc);
	}, 4000);

	setTimeout(function() {
		cloudantCreateDB(cloudant, db_google_results_sent, dataset_design_doc);
		cloudantCreateDB(cloudant, db_ibm_results_sent, dataset_design_doc);
	}, 6000);

	setTimeout(function() {
		cloudantCreateDB(cloudant, db_data_stt, dataset_design_doc);
		cloudantCreateDB(cloudant, db_datapath_stt, dataset_design_doc);
	}, 8000);

  response.status(200);
}
