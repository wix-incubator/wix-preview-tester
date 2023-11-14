const puppeteer = require('puppeteer');
const url = require('url');

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

module.exports = {
  getQueryParamsFromShortUrl,
};
