const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const axios = require('axios');
const url = require('url');
const http = require('http');
const https = require('https');

const rootDirectory = process.cwd();
const configFileName = 'wix-preview-tester.config.json';
const configFilePath = path.join(rootDirectory, configFileName);

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const maxRetries = 10;
const retryDelay = 3000;

const createAxiosInstance = () => {
  return axios.create({
    maxRedirects: 0,
    validateStatus: (status) => status >= 200 && status < 400,
    httpAgent: new http.Agent({ keepAlive: true }),
    httpsAgent: new https.Agent({ keepAlive: true }),
  });
};

const getFinalURL = async (initialUrl) => {
  const instance = createAxiosInstance();

  instance.interceptors.request.use((request) => {
    console.log('Starting Request: ', request);
    return request;
  });

  instance.interceptors.response.use((response) => {
    console.log('Response: ', response);
    return response;
  });

  let response;
  let retries = 0;
  let currentUrl = initialUrl;

  while (retries < maxRetries) {
    try {
      response = await instance.get(currentUrl);
      if (response.status === 404) {
        console.error('Error: 404 Not Found');
        throw new Error('404 Not Found');
      }
      if (response.status !== 301 && response.status !== 302) break;
      currentUrl = response.headers.location;
      retries++;
      console.log(`Retry attempt: ${retries}, Current URL: ${currentUrl}`);
      await delay(retryDelay);
    } catch (error) {
      console.error("Error:", error.message);
      throw error;
    }
  }

  const responseURL = response?.request?.res?.responseUrl || response?.request?.responseURL ||
    `${response.request.protocol}//${response.request.host}${response.request.path}`;

  console.log(`Final resolved URL: ${responseURL}`);
  return responseURL;
};

const getQueryParamsFromShortUrl = async (shortUrl) => {
  console.log('Getting query params from short URL:', shortUrl);
  try {
    const finalURL = await getFinalURL(shortUrl);
    console.log('Preview URL: ', finalURL);
    return url.parse(finalURL, true).query;
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
