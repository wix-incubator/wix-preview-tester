#!/usr/bin/env node

const { refreshTestsConfigs } = require('./index.js');

refreshTestsConfigs().catch((error) => {
  console.error('Failed to refreshTestsConfigs with error: ', error);
  process.exit(1);
});