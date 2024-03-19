const winston = require('winston');
const LogstashTransport = require('winston3-logstash-transport');
const ecsFormat = require('@elastic/ecs-winston-format');
const config = require('../../infra/configs/global_config');
const morgan  = require('morgan');

const logger = winston.createLogger({
  level: config.get('/appEnv') !== 'production' ? 'debug' : 'http',
  format: winston.format.combine( ecsFormat({ convertReqRes: true }), winston.format.timestamp(),  winston.format.json() ),
  transports: [
    new winston.transports.Console(),
    new LogstashTransport({
      host: process.env.LOGSTASH_HOST,
      port: process.env.LOGSTASH_PORT,
      node_name: process.env.LOGSTASH_NODE_NAME,
      ssl_enable: false,
      max_connect_retries: 10
    })
  ],
  exitOnError: false
});

const enableLogging = () => {
  logger.silent = false;
};

const error = (context, message, scope, data) => {
  const logObject = { context, message, scope, data };
  logger.error(logObject);
};

const warn = (context, message, scope, data) => {
  const logObject = { context, message, scope, data };
  logger.warn(logObject);
};

const info = (context, message, scope, data) => {
  const logObject = { context, message, scope, data };
  logger.info(logObject);
};

const debug = (context, message, scope, data) => {
  const logObject = { context, message, scope, data };
  logger.debug(logObject);
};

const log = (context, message, scope, data) => {
  const logObject = { context, message, scope, data };
  logger.debug(logObject);
};

const init = () => {
  return morgan((tokens, req, res) => {
    const logData = {
      method: tokens.method(req, res),
      url: tokens.url(req, res),
      code: tokens.status(req, res),
      contentLength: tokens.res(req, res, 'content-length'),
      responseTime: `${tokens['response-time'](req, res, '0')}`, // in milisecond (ms)
      date: tokens.date(req, res, 'iso'),
      ip: tokens['remote-addr'](req,res)
    };
    const obj = {
      context: 'service-info',
      scope: 'audit-log',
      message: 'Logging service...',
      meta: logData
    };
    logger.info(obj);
    return;
  });
};

const initLogger = () => {
  return morgan((tokens, req, res) => {
    const logData = {
      method: tokens.method(req, res),
      url: tokens.url(req, res),
      code: tokens.status(req, res),
      contentLength: tokens.res(req, res, 'content-length'),
      responseTime: `${tokens['response-time'](req, res, '0')}`, // in milisecond (ms)
      date: tokens.date(req, res, 'iso'),
      ip: tokens['remote-addr'](req,res)
    };
    const obj = {
      context: 'service-info',
      scope: 'audit-log',
      message: 'Logging service...',
      meta: logData
    };
    logger.info(obj);
    return;
  });
};

module.exports = {
  enableLogging,
  error,
  warn,
  info,
  debug,
  log,
  initLogger,
  init
};
