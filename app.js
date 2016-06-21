'use strict'

const prompt = require('prompt')
const dbConn = require('./mongodb')
const colors = require('colors/safe')

const parseSql = require('node-sqlparser').parse
let _db // use this to close database connection when SIGINT

const green = colors.green
const red = colors.red
const grey = colors.grey

/**
 * Wait for input query and exec it when connection 
 * to database is estabilished and ok
 */
dbConn.then( db => {
    _db = db
    console.log( green("Connected to database server") )

    run(db)
})
.catch( err => {
    console.log( red(err) )
    // handle exception case when not connected to database
    // currently do nothing
})

/**
 * Run REPL in a loop
 */
function run(db) {
    readQuery()
        .then(parseQuery)
        .then( query => {
            if(!query) return null
            
            return execQuery(db, query)
        })
        .then( data => {
            if(data) console.log( grey(JSON.stringify(data, null, 4)) )
            run(db)
        })
        .catch( err => {
            console.log( red(err.message) )
            run(db)
        })
}

/**
 * Read input from console and execute query
 */
function readQuery() {
    return new Promise( (resolve, reject) => {
        prompt.message = '>'
        prompt.start()
        prompt.get(['query'], function (err, result) {
            if (err) return quit()

            // handle quit command
            if(result.query === 'quit') quit()

            resolve(result.query.trim())
        })    
    })
}

/**
 * Just executes query and returns some result
 */
function execQuery(db, query) {
    return new Promise( (resolve, reject) => {
        const aggr = []
        const cursor = db.collection(query.collection).find(query.where, {
            limit: query.limit
        }).sort(query.sort)

        cursor.each( (err, doc) => {
            if(err) return reject(err)

            if(!doc) {
                return resolve(aggr)
            }

            if(doc) {
                // filter selected fields
                if(query.fields.length > 0) {
                    const o = {}

                    for(const proj of query.fields) {
                        if(doc[proj]) o[proj] = doc[proj]
                    }

                    if(Object.keys(o).length > 0) aggr.push(o)
                } else {
                    // just add all fields
                    aggr.push(doc)
                }
            }
        })
    })
}

/**
 * A helper object to map SQL-like naming to MongoDB query syntax
 */
const exprMapper = {
    '=': '$eq',
    '<>': '$ne',
    '>': '$gt',
    '<': '$lt',
    '>=': '$ge',
    '<=': '$le',

    'and': '$and',
    'or': '$or',
    // 'xor': '', xor not supported
}

/**
 * Parses object with WHERE clause recursively
 * and generates MongoDB `find` query object
 */
function parseWhere(root) {
    if(root.type === 'binary_expr') {
        const operator = root.operator;

        // extract leaf binary expressions
        if(operator === 'AND') {

            const [left, e1] = parseWhere(root.left)
            const [right, e2] = parseWhere(root.right)

            console.log('and', left, e1)

            return { 
                [left]: e1,
                [right]: e2
            }
        } else if(operator === 'OR') {
            const [left, e1] = parseWhere(root.left)
            const [right, e2] = parseWhere(root.right)

            return  { '$or' : [ 
                        { [left]: e1 }, 
                        { [right]: e2 }
                    ]}
        } else {
            const field = root.left.column
            const expr = exprMapper[operator]

            return [ field, { [expr]: root.right.value } ]
        }
    } else return {}
}

/**
 * SELECT [<Projections>] [FROM <Target>]
 *  [WHERE <Condition>*]
 *  [ORDER BY <Fields>* [ASC|DESC] *]
 *  [LIMIT <MaxRecords>]
 */
function parseQuery(query) {
    return new Promise( (resolve, reject) => {
        if(!query) return resolve()
        const astObj = parseSql(query)
        
        // console.log(JSON.stringify(astObj, null, 4))
        
        if(astObj.type != 'select') return reject(new Error('This version only supports \'SELECT\' queries'))
        if(!astObj.from) return reject(new Error('You should specify a collection in \'FROM\' clause'))

        const o = {}
        o.collection = astObj.from[0].table
        o.fields = []
        o.where = {}
        o.sort =  {}
        o.limit = astObj.limit ? parseInt(astObj.limit[1].value) : null

        if(astObj.columns !== '*') {
            o.fields = map(astObj.columns, e => e.expr.column)
        }

        if(astObj.where) {
            // just to catch strange errors when parsing queries
            try {
                o.where = parseWhere(astObj.where)
            } catch(ex) { console.log( red(ex.stack) ) }

            console.log('where: ', JSON.stringify(o.where, null, 4))
        }

        if(astObj.orderby) {
            for(const i in astObj.orderby) {
                const elem = astObj.orderby[i]
                o.sort[ elem.expr.column ] = elem.type === 'DESC' ? -1 : 1
            }
        }

        resolve(o)
    })
}

/**
 * Just a helper function to map over array
 */
function map(a, cb) {
    const _new = []

    for(const i in a) {
        _new.push(cb(a[i], i, a))
    }

    return _new
}

/**
 * Gracefully closes connection to database and exits
 */
function quit() {
    if(_db) _db.close()
    prompt.stop()
    process.exit() 
}

/**
 * Handle CTRL+C
 */
process.on("SIGINT", () => {
    quit()
})
