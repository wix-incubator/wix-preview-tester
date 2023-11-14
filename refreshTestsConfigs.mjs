#!/usr/bin/env node

import { refreshTestsConfigs } from './index.mjs';

refreshTestsConfigs().catch((error) => {
  console.error('Failed to refreshTestsConfigs with error: ', error);
  process.exit(1);
});