const wrapper = require('../../utils/wrapper');
const pool = require('./connection');
const validate = require('validate.js');

class Redis {

  constructor(config) {
    this.config = config.connection;
  }

  async setData(key, value) {
    let client = await pool.getConnection(this.config);
    if (validate.isEmpty(client)) {
      client = await pool.createConnectionPool(this.config);
    }
    const convertToString = JSON.stringify({
      data: value,
    });
    const clientRedis = client;
    clientRedis.on('error', (err) => {
      return wrapper.errorResponse(`Failed to set data on Redis: ${err}`);
    });
    clientRedis.set(key, convertToString);
  }

  async setDataEx(key, value, duration) {
    let client = await pool.getConnection(this.config);
    if (validate.isEmpty(client)) {
      client = await pool.createConnectionPool(this.config);
    }
    const convertToString = JSON.stringify({
      data: value,
    });
    const clientRedis = client;
    clientRedis.on('error', (err) => {
      return wrapper.errorResponse(`Failed to set data on Redis: ${err}`);
    });

    clientRedis.set(key, convertToString, 'EX', duration);
  }

  async getData(key) {
    let client = await pool.getConnection(this.config);
    if (validate.isEmpty(client)) {
      client = await pool.createConnectionPool(this.config);
    }
    const clientRedis = client;

    clientRedis.on('error', (err) => {
      return wrapper.errorResponse(`Failed Get data From Redis: ${err}`);
    });
    return new Promise((resolve, reject) => {
      clientRedis.get(key, (err, replies) => {
        if (err) {
          reject(wrapper.errorResponse(err));
        }
        resolve(wrapper.data(replies));
      });
    });
  }

  async getAllKeys(keyPattern) {
    let client = await pool.getConnection(this.config);
    if (validate.isEmpty(client)) {
      client = await pool.createConnectionPool(this.config);
    }
    const clientRedis = client;

    clientRedis.on('error', (err) => {
      return wrapper.errorResponse(`Failed Get data From Redis: ${err}`);
    });
    return new Promise((resolve, reject) => {
      clientRedis.keys(keyPattern, (err, replies) => {
        if (err) {
          reject(wrapper.errorResponse(err));
        }
        resolve(wrapper.data(replies));
      });
    });
  }

  async deleteKey(key) {
    let client = await pool.getConnection(this.config);
    if (validate.isEmpty(client)) {
      client = await pool.createConnectionPool(this.config);
    }
    const clientRedis = client;

    clientRedis.on('error', (err) => {
      return wrapper.errorResponse(`Failed Get data From Redis: ${err}`);
    });
    return new Promise((resolve, reject) => {
      clientRedis.del(key, (err, replies) => {
        if (err) {
          reject(wrapper.errorResponse(err));
        }
        resolve(wrapper.data(replies));
      });
    });
  }

  async setZeroAttemp(key, duration) {
    let client = await pool.getConnection(this.config);
    if (validate.isEmpty(client)) {
      client = await pool.createConnectionPool(this.config);
    }
    const clientRedis = client;

    clientRedis.on('error', (err) => {
      return wrapper.errorResponse(`Failed Get data From Redis: ${err}`);
    });
    return new Promise((resolve, reject) => {
      clientRedis.set(key, '0', 'EX', duration, (err, replies) => {
        if (err) {
          reject(wrapper.errorResponse(err));
        }
        resolve(wrapper.data(replies));
      });
    });
  }

  async publisher(key, value, timestamp) {
    let client = await pool.getConnection(this.config);
    if (validate.isEmpty(client)) {
      client = await pool.createConnectionPool(this.config);
    }
    const message = JSON.stringify({ value, timestamp });
    const clientRedis = client;
    clientRedis.on('error', (err) => {
      return wrapper.errorResponse(`Failed to set data on Redis: ${err}`);
    });

    clientRedis.publish(key, message);
  }
  
  async incrAttempt(key) {
    let client = await pool.getConnection(this.config);
    if (validate.isEmpty(client)) {
      client = await pool.createConnectionPool(this.config);
    }
    const clientRedis = client;

    clientRedis.on('error', (err) => {
      return wrapper.errorResponse(`Failed Get data From Redis: ${err}`);
    });
    return new Promise((resolve, reject) => {
      clientRedis.incr(key, (err, replies) => {
        if (err) {
          reject(wrapper.errorResponse(err));
        }
        resolve(wrapper.data(replies));
      });
    });
  }

  async setReminder(key, value, expire, action) {
    let client = await pool.getConnection(this.config);
    if (validate.isEmpty(client)) {
      client = await pool.createConnectionPool(this.config);
    }
    const clientRedis = client;

    clientRedis.on('error', (err) => {
      return wrapper.errorResponse(`Failed Get data From Redis: ${err}`);
    });
    return new Promise((resolve, reject) => {
      clientRedis
        .multi()
        .set(`${action}-${key}`, value)
        .expire(`${action}-${key}`, expire)
        .exec((error, reply) => {
          if (error) {
            reject(error);
          } else {
            resolve(wrapper.data(reply));
          }
        });
    });
  }
}


module.exports = Redis;
