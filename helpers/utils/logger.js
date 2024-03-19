const winston = require('winston');
const LogstashTransport = require('winston-logstash/lib/winston-logstash-latest');
const ecsFormat = require('@elastic/ecs-winston-format');
const config = require('../../infra/configs/global_config');
const morgan  = require('morgan');
const apm = require('elastic-apm-node');

const serviceName = {
  service: process.env.SERVICE_NAME,
  version: process.env.APP_VERSION,
};

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
  const logObject = { context, message, scope, data,...apm.currentTraceIds };
  logger.error(logObject);
};

const warn = (context, message, scope, data) => {
  const logObject = { context, message, scope, data,...apm.currentTraceIds };
  logger.warn(logObject);
};

const info = (context, message, scope, data) => {
  const logObject = { context, message, scope, data,...apm.currentTraceIds };
  logger.info(logObject);
};

const debug = (context, message, scope, data) => {
  const logObject = { context, message, scope, data,...apm.currentTraceIds };
  logger.debug(logObject);
};

const log = (context, message, scope, data) => {
  const logObject = { context, message, scope, data,...apm.currentTraceIds };
  logger.debug(logObject);
};

const getRealIp = (req) => {
  if (typeof req.headers['x-original-forwarded-for'] === 'string') {
    return req.headers['x-original-forwarded-for'].split(',')[0];
  } else if (typeof req.headers['x-forwarded-for'] === 'string') {
    return req.headers['x-forwarded-for'].split(',')[0];
  }
  return req.socket.remoteAddress;

};

const initLogger = () => {
  return morgan((tokens, req, res) => {
    const urlOriginal = `${tokens.url(req, res)}`;
    const responseStatus = tokens.status(req, res);
    const message = `${tokens.method(req, res)} ${urlOriginal} - ${responseStatus}`;
    const clientIp = getRealIp(req);
    const meta = {
      'service.name': serviceName.service,
      'service.version': serviceName.version,
      'log.logger': 'restify',
      tags: ['audit-log'],
      'url.original': urlOriginal,
      'http.request.method': tokens.method(req, res),
      'user_agent.original': tokens['user-agent'](req, res),
      'http.response.status_code': responseStatus,
      'http.response.body.bytes': tokens.res(req, res, 'content-length'),
      'event.duration': parseInt(tokens['response-time'](req, res, '0')) * 1000000, // in milisecond (ms) so need to convert to ns
      'http.response.date': tokens.date(req, res, 'iso'),
      'client.address': req.socket.remoteAddress,
      'client.ip': clientIp,
      'user.id': req.userId || '',
      'user.roles': req.role ? [req.role] : undefined,
    };
    const obj = {
      context: 'service-info',
      scope: 'audit-log',
      message: message,
      meta: meta,
      ...apm.currentTraceIds
    };
    if (responseStatus === '503' && ['/healthz', '/readyz'].includes(urlOriginal)) {
      logger.warn(obj);
    } else if (typeof responseStatus === 'string' && responseStatus.startsWith('5')) {
      logger.error(obj);
    } else if (typeof responseStatus === 'string' && responseStatus.startsWith('4')) {
      logger.warn(obj);
    } else if (['/healthz', '/readyz'].includes(urlOriginal)) {
      logger.debug(obj);
    }

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
};
