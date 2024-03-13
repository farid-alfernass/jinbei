const Redis = require('ioredis');
const logger = require('../../utils/logger');
let redisClient;

const createConnectionPool = async (config) => {
  redisClient = new Redis({
    host: config.host,
    port: config.port,
    password: config.password,
    retryStrategy: times => Math.min(times * 50, 2000),
    reconnectOnError: error => error.message.startsWith('READONLY'),
    enableOfflineQueue: true,
    enableReadyCheck: true,
    slotsRefreshTimeout: 1000,
  });

  redisClient.on('error', (err) => {
    logger.log(__filename, 'redis', `Failed to connect to Redis Cluster: ${err}`, 'error');
  });
  return redisClient;
};

const getConnection = async (config) => {
  if (!redisClient || redisClient.status === 'end') {
    redisClient = await createConnectionPool(config);
  }
  return redisClient;
};

const init = async (config) => {
  try {
    await getConnection(config);
    logger.log(__filename, 'redis-init', 'Successfully connected to Redis', 'info');
  } catch (err) {
    logger.log(__filename, 'redis-init', `Failed to connect to Redis: ${err}`, 'error');
  }
};

module.exports = {
  createConnectionPool,
  getConnection,
  init
};
