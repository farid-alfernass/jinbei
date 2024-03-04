const { ROLES_DETAIL } = require('./role_index');
const { UnauthorizedError } = require('../helpers/error/index');
const { sendResponse } = require('../helpers/utils/response');
const wrapper = require('../helpers/utils/wrapper');
const logger = require('../helpers/utils/logger');

const checkRole = (serviceName) => {
  return function (req, res, next) {
    const { userMeta } = req;
    const roleList = userMeta.roles;
    try {
      const isAuthorized = roleList.some((role) => ROLES_DETAIL[role]?.includes(serviceName));
      if (!isAuthorized) {
        const errorMessage = `Insufficient privileges for ${serviceName}`;
        sendResponse(wrapper.error(new UnauthorizedError(errorMessage)), res);
      } else {
        next();
      }
    } catch (error) {
      logger.error('checkRole','Error in role check middleware', error);
      sendResponse(wrapper.error(new UnauthorizedError('Unauthorized')), res);
    }
  };
};

module.exports = {
  checkRole
};
