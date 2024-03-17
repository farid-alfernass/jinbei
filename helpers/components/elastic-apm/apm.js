const apm = require('elastic-apm-node');
const config = require('../../../infra/configs/global_config');

const init = () => {
  apm.start({
    serviceName: process.env.SERVICE_NAME,
    serviceVersion: process.env.APP_VERSION,
    secretToken: config.get('/apm/secretToken'),
    serverUrl: config.get('/apm/serverUrl'),
    captureExceptions: false,
    logUncaughtExceptions: true,
  });
};

module.exports = {
  init
};
