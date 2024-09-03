#!/usr/bin/env node

const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const { refreshTestsConfigs } = require('./index.js');

const argv = yargs(hideBin(process.argv))
  .option('ua', {
    alias: 'user-agent',
    describe: 'User-Agent string to use for requests',
    type: 'string',
    default: 'wix-preview-tester'
  })
  .help()
  .argv;

refreshTestsConfigs({ ...argv }).catch((error) => {
  console.error('Failed to refreshTestsConfigs with error: ', error);
  process.exit(1);
});