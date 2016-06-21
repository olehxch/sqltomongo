'use strict'

const dbConn = require('./mongodb')

/**
 * Just clears database and populates it with 
 * initial collections & entries
 */
function init(db, cb) {
    const users = db.collection('users')

    users.deleteMany({}, (err, res) => {
        if(err) return db(err)

        console.log("Collection 'users' cleared")
        users.insertMany([
            { name: 'John', age: 26, country: 'USA', address: { city: 'NY', district: 2 }},
            { name: 'Aasborn', age: 24, country: 'Norvegy'},
            { name: 'Jackie', age: 31, country: 'Ireland'},
        ], (err, res) => {
            if(err) return cb(err)

            console.log("Collection 'users' populated")
            cb(null, res)
        })
    })    
}

dbConn.then( db => {
    console.log("Connected to database server")

    init(db, (err, ok) => {
        console.log(err || 'Data updated successfully!')
        process.exit()
    })
})
.catch( err => {
    console.log(err.message)
    process.exit(1)
    // handle exception case when not connected to database
    // currently do nothing
})
