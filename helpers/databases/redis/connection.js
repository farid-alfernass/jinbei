const Redis = require('ioredis');
const logger = require('../../utils/logger');
let redisClient;

const createConnectionPool = async (config) => {
  const nodes = [{
    host: config.host,
    port: config.port
  }];
  redisClient = new Redis.Cluster(nodes,{
    redisOptions: {
      password: config.password,
      showFriendlyErrorStack: true,
      reconnectOnError: function(err) {
        return err.message.includes('READONLY');
      },
    },
    enableOfflineQueue: true,
    enableReadyCheck: true,
    slotsRefreshTimeout: 1000,
  });

  redisClient.on('error', (err) => {
    logger.log(__filename, 'redis', `Failed to connect to Redis: ${err}`, 'error');
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
