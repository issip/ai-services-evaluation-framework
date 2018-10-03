'use strict'

const cloudant = require('cloudant');
module.exports = cloudant({account: process.env.CLOUDANT_USERNAME, password: process.env.CLOUDANT_PASSWORD});
//module.exports = cloudant({account: "dgjsagd", password: "dsafasf"});
