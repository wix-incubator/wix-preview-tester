#!/usr/bin/env node

import { exec } from 'child_process';
import puppeteer from 'puppeteer';
import url from 'url';
import { setTestsConfig } from './index.mjs';

const getQueryParamsFromShortUrl = async (shortUrl) => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(shortUrl);
  await page.waitForSelector('body');
  const fullUrl = page.url();
  const parsedUrl = url.parse(fullUrl, true);
  const queryParams = parsedUrl.query;
  await browser.close();
  return queryParams;
};

(async function refreshTestsConfigs() {
  console.log('????');
  const WixPreviewProcess = exec('wix preview --source local');
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
