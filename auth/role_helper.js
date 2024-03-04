const { UnauthorizedError } = require('../helpers/error/index');
const { sendResponse } = require('../helpers/utils/response');
const wrapper = require('../helpers/utils/wrapper');
const logger = require('../helpers/utils/logger');

const checkRole = () => {
  return function (req, res, next) {
    const { userMeta } = req;
    try {
      if (!userMeta) {
        const errorMessage = `Insufficient privileges for ${userMeta.userId}`;
        sendResponse(wrapper.errorResponse(new UnauthorizedError(errorMessage)), res);    }
      if (!userMeta.isAdmin) {
        const errorMessage = `Insufficient privileges for ${userMeta.userId}`;
        sendResponse(wrapper.errorResponse(new UnauthorizedError(errorMessage)), res);
      } else {
        next();
      }
    } catch (error) {
      logger.error('checkRole','Error in role check middleware', error);
      sendResponse(wrapper.errorResponse(new UnauthorizedError('Unauthorized')), res);
    }
  };
};

module.exports = {
  checkRole
};
