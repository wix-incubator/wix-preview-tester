#!/usr/bin/env node

const { exec } = require('child_process');
const { getQueryParamsFromShortUrl } = require('./getQueryParamsFromShortURL');
const { setTestsConfig } = require('.');

(async function refreshTestsConfigs() {

  const WixPreviewProcess = exec('wix preview --source local');
  // @ts-expect-error
  WixPreviewProcess.stdin.setEncoding('utf8');

  return new Promise((resolve, reject) => {
    WixPreviewProcess.stdout.on('data', async (data) => {
      const stringData = data.toString();
      if (stringData.includes('Your preview deployment is now available at')) {
        const shortenedURL = stringData.substring(
          stringData.indexOf('http'),
          stringData.length,
        );
        try {
          const queryParams = await getQueryParamsFromShortUrl(shortenedURL);
          setTestsConfig(queryParams);
          return resolve(queryParams);
        } catch (error) {
          console.error('Failed to refreshTestsConfigs with error: ', error);
          return reject('Failed to refreshTestsConfigs with error: ');
        }
      }
    });
    WixPreviewProcess.stderr.on('data', async (data) => {
      console.error('WixPreviewProcess Failed with error: ', data);
      return reject('WixPreviewProcess Failed with error: ');
    });
  });
})();
