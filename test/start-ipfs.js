'use strict'

const IPFS = require('ipfs')

const startIpfs = (config = {}, start = true) => {
  return new Promise((resolve, reject) => {
    const ipfs = new IPFS(config)
    ipfs.on('error', reject)
    ipfs.on('ready', () => resolve(ipfs))
  })
}

module.exports = startIpfs
