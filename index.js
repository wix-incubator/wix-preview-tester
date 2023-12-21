const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const axios = require('axios');
const url = require('url');

const rootDirectory = process.cwd();
const configFileName = 'wix-preview-tester.config.json';
const configFilePath = path.join(rootDirectory, configFileName);

const getQueryParamsFromShortUrl = async (shortUrl) => {
  const responseURL = await axios
    .get(shortUrl)
    .then((response) => response.request.res.responseUrl)
    .catch((error) => {
      console.error('error occurred while getting query params from short url', error);
    });
  return url.parse(responseURL, true).query;
};

const getTestsConfig = () => {
  if (!fs.existsSync(configFilePath)) {
    return { siteRevision: "", branchId: "" };
  }

  const configFile = fs.readFileSync(configFilePath, 'utf8');
  const config = JSON.parse(configFile);
  return config;
};


const getConfig = () => {
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
          return reject(error);
        }
      }
    });
    WixPreviewProcess.stderr.on('data', async (data) => {
      return reject(data);
    });
  });
}

module.exports = {
  refreshTestsConfigs,
  setTestsConfig,
  getTestsConfig,
};
