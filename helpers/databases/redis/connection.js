const Redis = require('ioredis');
const logger = require('../../utils/logger');
const connectionPool = [];

const createConnectionPool = async (config) => {
  const currConnection = connectionPool.findIndex(conf => conf.config.toString() === config.toString());
  if (currConnection === -1) {
    const client = new Redis({
      retryStrategy: function (times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      reconnectOnError: function (error) {
        const targetError = 'READONLY';
        if (error.message.slice(0, targetError.length) === targetError) {
          // Only reconnect when the error starts with "READONLY"
          return true; // or `return 1;`
        }
      }
    });

    client.on('error', (error) => {
      if (error.code === 'ECONNREFUSED') {
        logger.log('redis', 'The server refused the connection', 'error');
      }
      if (error.code === 'ECONNRESET') {
        logger.log('redis', 'The server reset the connection', 'error');
      }
      if (error.code === 'ETIMEDOUT') {
        logger.log('redis', 'The server timeouted the connection', 'error');
      }
    });

    connectionPool.push({ config, client });
  }
};

const getConnection = async () => {
  return connectionPool;
};

const init = async () => {
  try {
    await getConnection();
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
