# Getting Started with OrbitDB

## Install

Install `orbit-db` and [ipfs](https://www.npmjs.com/package/ipfs) from npm:

```
npm install orbit-db ipfs
```

## Setup

Require OrbitDB and IPFS in your program and create the instances:

```javascript
const IPFS = require('ipfs')
const OrbitDB = require('orbit-db')

const ipfs = new IPFS()
ipfs.on('ready', () => {
  const orbitdb = new OrbitDB(ipfs)
})
```

`orbitdb` is now the [OrbitDB](#orbitdb) instance we can use to interact with the databases.

## Create a database

First, choose the data model you want to use and create a database instance:

```javascript
const ipfs = new IPFS()
ipfs.on('ready', async () => {
  const orbitdb = new OrbitDB(ipfs)
  const db = await orbitdb.keyvalue('first-database')
})
```

### Address

When a database is created, it will be assigned an address by OrbitDB. The address consists of three parts:
```
/orbitdb/Qmd8TmZrWASypEp4Er9tgWP4kCNQnW4ncSnvjvyHQ3EVSU/first-database
```

The first part, `/orbitdb`, specifies the protocol in use. The second part, an IPFS multihash `Qmd8TmZrWASypEp4Er9tgWP4kCNQnW4ncSnvjvyHQ3EVSU`, is the database manifest which contains the database info such as the name and type, and a pointer to the access controller. The last part, `first-database`, is the name of the database.

In order to replicate the database with peers, the address is what you need to give to other peers in order for them to start replicating the database.

The database address can be access as a member variable of the database instance:
```
db.address
```

For example:
```javascript
const ipfs = new IPFS()
ipfs.on('ready', async () => {
  const orbitdb = new OrbitDB(ipfs)
  const db = await orbitdb.keyvalue('first-database')
  console.log(db.address.toString())
  // /orbitdb/Qmd8TmZrWASypEp4Er9tgWP4kCNQnW4ncSnvjvyHQ3EVSU/first-database
})
```

#### Manifest

The second part of the address, the IPFS multihash `Qmdgwt7w4uBsw8LXduzCd18zfGXeTmBsiR8edQ1hSfzcJC`, is the manifest of a database. It's an IPFS object that contains information about the database. 

The database manifest can be fetched from IPFS and it looks like this:

```json
{
  "Data": "{\"name\":\"a\",\"type\":\"feed\",\"accessController\":\"/ipfs/QmdjrCN7SqGxRapsm6LuoS4HrWmLeQHVM6f1Zk5A3UveqA\"}",
  "Hash": "Qmdgwt7w4uBsw8LXduzCd18zfGXeTmBsiR8edQ1hSfzcJC",
  "Size": 102,
  "Links": []
}
```

### Key

Each entry in a database is signed by who created that entry. The signing key, the key that a peer uses to sign entries, can be accessed as a member variable of the database instance:
```
db.key
```

The key contains the keypair used to sign the database entries. The public key can be retrieved with:
```
db.key.getPublic('hex')
```

The key can also be access from the OrbitDB instance: `orbitdb.key.getPublic('hex')`.

If you want to give access to other peers to write to a database, you need to get their the public key in hex and add it to the access controller upon creating the database. If you want others to give you the access to write, you'll need to give them your public key (output of `orbitdb.key.getPublic('hex')`).

### Access Control

You can specify the peers that have write-access to a database. You can define a set of peers that can write to a database or allow anyone write to a database. By default and if not specified otherwise, the creator of the database will be given write-access.

***Note!*** OrbitDB currently supports only write-access and the keys of the writers need to be known when creating a database. That is, the access rights can't be changed after a database has been created. In the future we'll support dynamic access rights in a way that access rights can be added and removed to a database at any point in time.

Access rights are setup by passing an `access` object that defines the access rights of the database when created. OrbitDB currently supports write-access. The access rights are specified as an array of public keys of the peers who can write to the database.

```javascript
const ipfs = new IPFS()
ipfs.on('ready', async () => {
  const orbitdb = new OrbitDB(ipfs)

  const access = {
    // Give write access to ourselves
    write: [orbitdb.key.getPublic('hex')],
  }

  const db = await orbitdb.keyvalue('first-database', access)
  console.log(db.address.toString())
  // /orbitdb/Qmd8TmZrWASypEp4Er9tgWP4kCNQnW4ncSnvjvyHQ3EVSU/first-database
})
```

To give write access to another peer, you'll need to get their public key with some means. 

This means they'll need to give you the output of their OrbitDB instance's key: `orbitdb.key.getPublic('hex')`. The keys look like this: `042c07044e7ea51a489c02854db5e09f0191690dc59db0afd95328c9db614a2976e088cab7c86d7e48183191258fc59dc699653508ce25bf0369d67f33d5d77839`

```javascript
const ipfs = new IPFS()
ipfs.on('ready', async () => {
  const orbitdb = new OrbitDB(ipfs)

  const access = {
    // Setup write access
    write: [
      // Give access to ourselves
      orbitdb.key.getPublic('hex'),
      // Give access to the second peer
      '042c07044e7ea51a489c02854db5e09f0191690dc59db0afd95328c9db614a2976e088cab7c86d7e48183191258fc59dc699653508ce25bf0369d67f33d5d77839',
    ],
  }

  const db = await orbitdb.keyvalue('first-database', access)
  console.log(db.address.toString())
  // /orbitdb/Qmdgwt7w4uBsw8LXduzCd18zfGXeTmBsiR8edQ1hSfzcJC/first-database
})
```

#### Public databases

The access control mechanism also support "public" database to which anyone can write to. This can be done by adding a `*` to the write access array:

```javascript
const ipfs = new IPFS()
ipfs.on('ready', async () => {
  const orbitdb = new OrbitDB(ipfs)

  const access = {
    // Give write access to everyone
    write: ['*'],
  }

  const db = await orbitdb.keyvalue('first-database', access)
  console.log(db.address.toString())
  // /orbitdb/QmRrauSxaAvNjpZcm2Cq6y9DcrH8wQQWGjtokF4tgCUxGP/first-database
})
```

Note how the access controller hash is different compared to the previous example!

## Add an entry

```javascript
const ipfs = new IPFS()
ipfs.on('ready', async () => {
  const orbitdb = new OrbitDB(ipfs)
  const db = await orbitdb.keyvalue('first-database')
  await db.put('name', 'hello')
})
```

## Get an entry

```javascript
const ipfs = new IPFS()
ipfs.on('ready', async () => {
  const orbitdb = new OrbitDB(ipfs)
  const db = await orbitdb.keyvalue('first-database')
  await db.put('name', 'hello')
  const value = db.get('name')
})
```

## Replicating a database

TODO
- how to replicate a database between peers

## Multiple writers

TODO
- how to work with a database that multiple peers write to

## Choosing a data model

TODO
- how to choose the right database type
- differences between the data models
