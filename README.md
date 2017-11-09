# orbit-db

[![](https://img.shields.io/badge/freenode-%23orbitdb-blue.svg?style=flat-square)](http://webchat.freenode.net/?channels=%23orbitdb)
[![CircleCI Status](https://circleci.com/gh/orbitdb/orbit-db.svg?style=shield)](https://circleci.com/gh/orbitdb/orbit-db)
[![npm version](https://badge.fury.io/js/orbit-db.svg)](https://www.npmjs.com/package/orbit-db)
[![node](https://img.shields.io/node/v/orbit-db.svg)](https://www.npmjs.com/package/orbit-db)
[![Project Status](https://badge.waffle.io/orbitdb/orbit-db.svg?columns=In%20Progress&title=In%20Progress)](https://waffle.io/orbitdb/orbit-db)

> A peer-to-peer database for the decentralized web

`orbit-db` is a serverless, distributed, peer-to-peer database. `orbit-db` uses [IPFS](https://ipfs.io) as its data storage and [IPFS Pubsub](https://github.com/ipfs/go-ipfs/blob/master/core/commands/pubsub.go#L23) to automatically sync databases with peers. It's an eventually consistent database that uses [CRDTs](https://en.wikipedia.org/wiki/Conflict-free_replicated_data_type) for conflict-free database merges making `orbit-db` and excellent choice for offline-first applications.

Data in `orbit-db` can be stored in a

- **[Key-Value Store](https://github.com/orbitdb/orbit-db-kvstore)**
- **[Eventlog](https://github.com/orbitdb/orbit-db-eventstore)** (append-only log)
- **[Feed](https://github.com/orbitdb/orbit-db-feedstore)** (add and remove log)
- **[Documents](https://github.com/orbitdb/orbit-db-docstore)** (indexed by custom fields)
- **[Counters](https://github.com/orbitdb/orbit-db-counterstore)**

This is the Javascript implementation and it works both in **Node.js** and **Browsers**.

To get started, try out the **[OrbitDB CLI](https://github.com/orbitdb/orbit-db-cli)** or check the [live demo](https://ipfs.io/ipfs/QmUETzzv9FxBwPn4H6q3i6QXTzicvV3MMuKN53JQU3yMSG/)!

<a href="https://asciinema.org/a/JdTmmdBCZarkBkPqbueicwMrG" target="_blank"><img src="https://asciinema.org/a/JdTmmdBCZarkBkPqbueicwMrG.png" width="50%"/></a>

## Table of Contents

- [Usage](#usage)
- [API](#api)
- [Examples](#examples)
- [Development](#development)
- [Background](#background)
- [Contributing](#contributing)
- [License](#license)

## Usage

Read the **[GETTING STARTED](https://github.com/orbitdb/orbit-db/blob/master/GUIDE.md)** guide for a more in-depth tutorial and to understand how OrbitDB works.

### CLI

For the CLI tool to manage orbit-db database, see **[OrbitDB CLI](https://github.com/orbitdb/orbit-db-cli)**.

It can be installed from Npm with:

```
npm install orbit-db-cli -g
```

### As a library

Install dependencies:

```
npm install orbit-db ipfs
```

Use it as a module:

```javascript
const IPFS = require('ipfs')
const OrbitDB = require('orbit-db')

const ipfs = new IPFS()

ipfs.on('error', (e) => console.error(e))
ipfs.on('ready', async () => {
  // Create a database
  const orbitdb = new OrbitDB(ipfs)
  const db = await orbitdb.eventlog('feed name')
  // Add an entry to the database
  const hash = await db.add('hello world')
  // Get last 5 entries
  const latest = db.iterator({ limit: 5 }).collect()
  console.log(JSON.stringify(latest, null, 2))
})
```

*For more details, see examples for [kvstore](https://github.com/orbitdb/orbit-db-kvstore#usage), [eventlog](https://github.com/haadcode/orbit-db-eventstore#usage), [feed](https://github.com/haadcode/orbit-db-feedstore#usage), [docstore](https://github.com/shamb0t/orbit-db-docstore#usage) and [counter](https://github.com/haadcode/orbit-db-counterstore#usage).*

## API

See [API documentation](https://github.com/orbitdb/orbit-db/blob/master/API.md#orbit-db-api-documentation) for the full documentation.

- [Getting Started](https://github.com/orbitdb/orbit-db/blob/master/API.md#getting-started)
- [orbitdb](https://github.com/orbitdb/orbit-db/blob/master/API.md#orbitdb)
  - [kvstore(name)](https://github.com/orbitdb/orbit-db/blob/master/API.md#kvstorename)
  - [eventlog(name)](https://github.com/orbitdb/orbit-db/blob/master/API.md#eventlogname)
  - [feed(name)](https://github.com/orbitdb/orbit-db/blob/master/API.md#feedname)
  - [docstore(name, options)](https://github.com/orbitdb/orbit-db/blob/master/API.md#docstorename-options)
  - [counter(name)](https://github.com/orbitdb/orbit-db/blob/master/API.md#countername)
  - [disconnect()](https://github.com/orbitdb/orbit-db/blob/master/API.md#disconnect)
  - [events](https://github.com/orbitdb/orbit-db/blob/master/API.md#events)

## Examples

### Install dependencies

```
git clone https://github.com/orbitdb/orbit-db.git
cd orbit-db
npm install
```

### Browser example

```
npm run build
npm run examples:browser
```

<img src="https://raw.githubusercontent.com/orbitdb/orbit-db/feat/ipfs-pubsub/screenshots/orbit-db-demo1.gif" width="33%">

Check the code in [examples/browser/browser.html](https://github.com/orbitdb/orbit-db/blob/master/examples/browser/browser.html).

### Node.js example

```
npm run examples:node
```

<img src="https://raw.githubusercontent.com/orbitdb/orbit-db/feat/ipfs-pubsub/screenshots/orbit-db-demo3.gif" width="66%">

**Eventlog**

See the code in [examples/eventlog.js](https://github.com/orbitdb/orbit-db/blob/master/examples/eventlog.js) and run it with:
```
LOG=debug node examples/eventlog.js
```

## Development

#### Run Tests
```
npm test
```

#### Build
```
npm run build
```

#### Benchmark
```
node benchmarks/benchmark-add.js
```

## Background

OrbitDB uses an append-only log as its operations log, implemented in [ipfs-log](https://github.com/haadcode/ipfs-log).

To understand a little bit about the architecture, check out a visualization of the data flow at https://github.com/haadcode/proto2 or a live demo: http://celebdil.benet.ai:8080/ipfs/Qmezm7g8mBpWyuPk6D84CNcfLKJwU6mpXuEN5GJZNkX3XK/.

**TODO:**
- list of modules used
- orbit-db-pubsub
- crdts

## Contributing

We would be happy to accept PRs! If you want to work on something, it'd be good to talk beforehand to make sure nobody else is working on it. You can reach us on IRC [#orbitdb](http://webchat.freenode.net/?channels=%23orbitdb) on Freenode, or in the comments of the [issues section](https://github.com/orbitdb/orbit-db/issues).

A good place to start are the issues labelled ["help wanted"](https://github.com/orbitdb/orbit-db/issues?q=is%3Aopen+is%3Aissue+label%3A%22help+wanted%22+sort%3Areactions-%2B1-desc) or the project's [status board](https://waffle.io/orbitdb/orbit-db).

## Sponsors

The development of OrbitDB has been sponsored by:

* [Protocol Labs](https://protocol.ai/)

If you want to sponsor developers to work on OrbitDB, please reach out to @haadcode.

## License

[MIT](LICENSE) ©️ 2016 Haadcode
