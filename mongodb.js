'use strict'

/**
 * Database connector
 */

const MongoClient = require('mongodb').MongoClient
const config = require('./config')
 
module.exports = new Promise( (resolve, reject) => {
    MongoClient.connect(config.MONGODB, function(err, db) {
        if(err) return reject(err)
        resolve(db)
    })
})
