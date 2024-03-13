const Redis = require('ioredis');
const logger = require('../../utils/logger');
let connectionPool = [];

const createConnectionPool = async (config) => {
  const currConnection = connectionPool.findIndex(conf => conf.config.toString() === config.toString());
  if (currConnection === -1) {
    const client = new Redis({
      host: config.host,
      port: config.port,
      password: config.password,
      retryStrategy: times => Math.min(times * 50, 2000),
      reconnectOnError: error => error.message.startsWith('READONLY')
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

const getConnection = async (config) => {
  if(connectionPool.length === 0) {
    connectionPool = await createConnectionPool(config);
  }
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
