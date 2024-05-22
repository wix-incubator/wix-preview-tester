const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const axios = require('axios');
const url = require('url');

const rootDirectory = process.cwd();
const configFileName = 'wix-preview-tester.config.json';
const configFilePath = path.join(rootDirectory, configFileName);

const getQueryParamsFromShortUrl = async (shortUrl) => {
  try {
    const response = await axios.get(shortUrl, { timeout: 60000 });
    const responseURL = response?.request?.res?.responseUrl || response?.request?.responseURL;

    if (!responseURL) {
      throw new Error('Failed to get response URL');
    }

    console.log('Preview URL: ', responseURL);
    return url.parse(responseURL, true).query;
  } catch (error) {
    console.error('Error occurred while getting query params from short URL:', error.message);
    throw error;
  }
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
  const WixPreviewProcess = exec('wix preview --source local', { stdio: 'pipe' });

  return new Promise((resolve, reject) => {
    WixPreviewProcess.stdout.on('data', async (data) => {
      const stringData = data.toString();
      if (stringData.includes('Your preview deployment is now available at')) {
        const shortenedURL = stringData.substring(stringData.indexOf('http')).trim();
        try {
          const queryParams = await getQueryParamsFromShortUrl(shortenedURL);
          setTestsConfig(queryParams);
          resolve(queryParams);
        } catch (error) {
          reject(error);
        }
      }
    });

    WixPreviewProcess.stderr.on('data', (data) => {
      reject(data.toString());
    });

    WixPreviewProcess.on('error', (error) => {
      reject(error);
    });
  });
};


module.exports = {
  refreshTestsConfigs,
  setTestsConfig,
  getTestsConfig,
};
