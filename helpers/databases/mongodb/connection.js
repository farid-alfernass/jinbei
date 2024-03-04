const { MongoClient } = require('mongodb');
const logger = require('../../utils/logger');
const wrapper = require('../../utils/wrapper');

let connectionPool = new Map();

const init = async (config) => {
  try {
    const poolKey = JSON.stringify(config);
    const mongoConnection = new MongoClient(config, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 50,
      minPoolSize: 1
    });
    await mongoConnection.connect();
    logger.info('mongodb connection', 'connected', 'database initiation');
    connectionPool.set(poolKey, mongoConnection);
  } catch (err) {
    logger.error('mongodb connection', 'connection error', 'database initiation', err);
  }
};

const getConnection = async (config) => {
  const poolKey = JSON.stringify(config);
  if (!connectionPool.has(poolKey)) {
    await init(config);
  }
  const mongoConnection = connectionPool.get(poolKey);
  return wrapper.data({ db: mongoConnection });
};

module.exports = {
  init,
  getConnection
};
