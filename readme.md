### Alternative MongoDB client with SQL-like queries

Before you continue to use app, you can run script to populate your database with default data

```
node initdb
```

How to run console version of client
```
node app
```

#### Commands
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

#### Examples
```
SELECT _id, name FROM Users
```

```
SELECT _id, name FROM Users
    WHERE name = John
    ORDER BY _id ASC
    LIMIT 10
```
