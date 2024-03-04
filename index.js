const BasicAuth = require('./auth/basic_auth_helper');
const JwtAuth = require('./auth/jwt_auth_helper');
const RoleCheck = require('./auth/role_helper');
const Wrapper = require('./helpers/utils/wrapper');
const APM = require('./helpers/components/monitoring/observability');
const Logger = require('./helpers/utils/logger');
const GS = require('./helpers/components/joshu/graceful_shutdown');
const MongoConnection = require('./helpers/databases/mongodb/connection');
const MongoDB = require('./helpers/databases/mongodb/db');

module.exports = {
  ...BasicAuth,
  ...JwtAuth,
  ...RoleCheck,
  ...Wrapper,
  ...APM,
  ...Logger,
  ...MongoConnection,
  ...GS,
  ...MongoDB
};
