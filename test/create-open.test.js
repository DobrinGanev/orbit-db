'use strict'

const assert = require('assert')
const fs = require('fs')
const path = require('path')
const rmrf = require('rimraf')
const mapSeries = require('p-map-series')
const OrbitDB = require('../src/OrbitDB')
const OrbitDBAddress = require('../src/orbit-db-address')
const first = require('./test-utils').first
const last = require('./test-utils').last
const config = require('./config')
const startIpfs = require('./start-ipfs')

const dbPath = './orbitdb/tests/create-open'
const ipfsPath = './orbitdb/tests/create-open/ipfs'

describe('orbit-db - Create & Open', function() {
  this.timeout(config.timeout)

  let ipfs, orbitdb, db, address
  let localDataPath

  before(async () => {
    config.daemon1.repo = ipfsPath
    rmrf.sync(config.daemon1.repo)
    rmrf.sync(dbPath)
    ipfs = await startIpfs(config.daemon1)
    orbitdb = new OrbitDB(ipfs, dbPath)
  })

  after(async () => {
    if(orbitdb) 
      orbitdb.stop()

    if (ipfs)
      await ipfs.stop()
  })

  describe('Create', function() {
    describe('Errors', function() {
      it('throws an error if given an invalid database type', async () => {
        let err
        try {
          db = await orbitdb.create('first', 'invalid-type')
        } catch (e) {
          err = e.toString()
        }
        assert.equal(err, 'Error: Invalid database type \'invalid-type\'')
      })

      it('throws an error if given an address instead of name', async () => {
        let err
        try {
          db = await orbitdb.create('/orbitdb/Qmc9PMho3LwTXSaUXJ8WjeBZyXesAwUofdkGeadFXsqMzW/first', 'feed')
        } catch (e) {
          err = e.toString()
        }
        assert.equal(err, 'Error: Given database name is an address. Please give only the name of the database!')
      })

      it('throws an error if database already exists', async () => {
        let err
        try {
          db = await orbitdb.create('first', 'feed')
          db = await orbitdb.create('first', 'feed')
        } catch (e) {
          err = e.toString()
        }
        assert.equal(err, `Error: Database '${db.address}' already exists!`)
      })

      it('throws an error if database type doesn\'t match', async () => {
        let err, log, kv
        try {
          log = await orbitdb.kvstore('keyvalue')
          kv = await orbitdb.eventlog(log.address.toString())
        } catch (e) {
          err = e.toString()
        }
        assert.equal(err, `Error: Database '${log.address}' is type 'keyvalue' but was opened as 'eventlog'`)
      })
    })

    describe('Success', function() {
      before(async () => {
        db = await orbitdb.create('second', 'feed')
        localDataPath = path.join(dbPath, db.address.root, db.address.path + '.orbitdb')
      })

      it('creates a feed database', async () => {
        assert.notEqual(db, null)
      })

      it('database has the correct address', async () => {
        assert.equal(db.address.toString().indexOf('/orbitdb'), 0)
        assert.equal(db.address.toString().indexOf('Qm'), 9)
        assert.equal(db.address.toString().indexOf('second'), 56)
      })

      it('saves the database locally', async () => {
        assert.equal(fs.existsSync(localDataPath), true)
      })

      it('saves database manifest reference locally', async () => {
        const buffer = fs.readFileSync(localDataPath)
        const data = JSON.parse(buffer)
        assert.equal(data.manifest, db.address.root)
        assert.equal(db.address.path, 'second')
      })

      it('saves database manifest file locally', async () => {
        const dag = await ipfs.object.get(db.address.root)
        const manifest = JSON.parse(dag.toJSON().data)
        assert.notEqual(manifest, )
        assert.equal(manifest.name, 'second')
        assert.equal(manifest.type, 'feed')
        assert.notEqual(manifest.accessController, null)
        assert.equal(manifest.accessController.indexOf('/ipfs'), 0)
      })

      it('can pass local database directory as an option', async () => {
        const dir = './orbitdb/tests/another-feed'
        db = await orbitdb.create('third', 'feed', { directory: dir })
        localDataPath = path.join(dir, db.address.root, db.address.path + '.orbitdb')
        assert.equal(fs.existsSync(localDataPath), true)
      })

      it('creates an access controller and adds an admin', async () => {
        db = await orbitdb.create('fourth', 'feed')
        assert.deepEqual(db.access.admin, [orbitdb.key.getPublic('hex')])
        assert.deepEqual(db.access.write, [orbitdb.key.getPublic('hex')])
        assert.deepEqual(db.access.read, [])
      })

      it('creates an access controller and adds writers', async () => {
        db = await orbitdb.create('fourth', 'feed', { write: ['another-key', 'yet-another-key'] })
        assert.deepEqual(db.access.write, ['another-key', 'yet-another-key', orbitdb.key.getPublic('hex')])
      })
    })
  })

  describe('Open', function() {
    before(async () => {
      db = await orbitdb.open('abc', { create: true, type: 'feed' })
    })

    it('throws an error if trying to open a database with name only and \'create\' is not set to \'true\'', async () => {
      let err
      try {
        db = await orbitdb.open('XXX', { create: false })
      } catch (e) {
        err = e.toString()
      }
      assert.equal(err, "Error: 'options.create' set to 'false'. If you want to create a database, set 'options.create' to 'true'.")
    })

    it('throws an error if trying to open a database with name only and \'create\' is not set to true', async () => {
      let err
      try {
        db = await orbitdb.open('YYY', { create: true })
      } catch (e) {
        err = e.toString()
      }
      assert.equal(err, "Error: Database type not provided! Provide a type with 'options.type' (eventlog|feed|docstore|counter|keyvalue)")
    })

    it('opens a database - name only', async () => {
      db = await orbitdb.open('abc', { create: true, type: 'feed', overwrite: true })
      assert.equal(db.address.toString().indexOf('/orbitdb'), 0)
      assert.equal(db.address.toString().indexOf('Qm'), 9)
      assert.equal(db.address.toString().indexOf('abc'), 56)
    })

    it('opens the same database - from an address', async () => {
      db = await orbitdb.open(db.address)
      assert.equal(db.address.toString().indexOf('/orbitdb'), 0)
      assert.equal(db.address.toString().indexOf('Qm'), 9)
      assert.equal(db.address.toString().indexOf('abc'), 56)
    })

    it('doesn\'t open a database if we don\'t have it locally', async () => {
      const address = new OrbitDBAddress(db.address.root.slice(0, -1) + 'A', 'non-existent')
      return new Promise((resolve, reject) => {
        setTimeout(resolve, 1000)
        orbitdb.open(address)
          .then(() => reject(new Error('Shouldn\'t open the database')))
      })
    })

    it('throws an error if trying to open a database locally and we don\'t have it', () => {
      const address = new OrbitDBAddress(db.address.root.slice(0, -1) + 'A', 'second')
      return orbitdb.open(address, { localOnly: true })
        .then(() => new Error('Shouldn\'t open the database'))
        .catch(e => {
          assert.equal(e.toString(), `Error: Database '${address}' doesn't exist!`)
        })
    })

    it('open the database and it has the added entries', async () => {
      db = await orbitdb.open('ZZZ', { create: true, type: 'feed' })
      await db.add('hello1')
      await db.add('hello2')

      db = await orbitdb.open(db.address)
      await db.load()
      const res = db.iterator({ limit: -1 }).collect()

      assert.equal(res.length, 2)
      assert.equal(res[0].payload.value, 'hello1')
      assert.equal(res[1].payload.value, 'hello2')
    })
  })
})
