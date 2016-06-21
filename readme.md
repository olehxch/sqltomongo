### Alternative MongoDB client with SQL-like queries

Just install all dependencies

```
npm i
```

Before you continue to use app, you can run script to populate your database with default data

```
node initdb
```

How to run console version of client
```
node app
```

#### Commands & examples

```
SELECT _id, name FROM users

SELECT * FROM users WHERE age > 26 ORDER BY age ASC

SELECT * FROM users WHERE age > 26 and name <> 'John' ORDER BY age DESC

SELECT _id, name FROM Users
    WHERE name = John
    ORDER BY _id ASC
    LIMIT 10
```

To exit from repl just type
```
quit
```

#### Supported query format
```
SELECT [<Projections>] [FROM <Target>]
    [WHERE <Condition>*]
    [ORDER BY <Fields>* [ASC|DESC] *]
    [LIMIT <MaxRecords>]
```

#### Limitations
* Only SELECT is supported
* <Projections> supports only field query ( *, _id, name etc. )
* <Projections> don't support subfield queries ( name.first, name.* etc. )
