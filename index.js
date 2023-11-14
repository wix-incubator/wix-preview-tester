const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const puppeteer = require('puppeteer');
const url = require('url');

const configFileName = 'wix-preview-tester.config.json';
// TODO これがおかしい 実行したプロジェクトのルートになるようにする
const configFilePath = path.join(__dirname, configFileName);

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

const getTestsConfig = () => {
  const configFile = fs.readFileSync(configFilePath, 'utf8');
  const config = JSON.parse(configFile);
  return config;
};


const getConfig = () => {
  console.log('kiyo: getConfig');
  try {
    const configFile = fs.readFileSync(configFilePath, 'utf8');
    return JSON.parse(configFile);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return {};
    }
  }
};

const setTestsConfig = (config) => {
  console.log('kiyo: setTestsConfig');
  const configs = getConfig();
  const updatedConfigs = {
    ...configs,
    ...config,
  };
  return fs.writeFileSync(
    configFilePath,
    JSON.stringify(updatedConfigs, null, 2),
  );
};

const refreshTestsConfigs = async () => {
  console.log('kiyo: refreshTestsConfigs');
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
}

module.exports = {
  refreshTestsConfigs,
  setTestsConfig,
  getTestsConfig,
};
