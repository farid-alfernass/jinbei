
const jwt = require('jsonwebtoken');
const validate = require('validate.js');
const config = require('../infra/configs/global_config');
const wrapper = require('../helpers/utils/wrapper');
const { ERROR } = require('../helpers/http-status/status_code');
const { UnauthorizedError, ForbiddenError, NotFoundError } = require('../helpers/error');
const fs = require('fs');
const decodeKey = keyPath => fs.readFileSync(keyPath, 'utf8');

// const decodeKey = (secret) => Buffer.from(secret, 'base64');

const Redis = require('../helpers/databases/redis/redis');
const redisClient = new Redis(config.get('/redis'));

const generateToken = async (payload) => {
  const privateKey = decodeKey(config.get('/jwt/privateKey'));
  return jwt.sign(payload, privateKey, config.get('/jwt/signOptions'));
};

const generateRefreshToken = async (payload) => {
  const privateKey = decodeKey(config.get('/jwt/refresh/privateKey'));
  const token = jwt.sign(payload, privateKey, config.get('/jwt/refresh/signOptions'));
  return token;
};

const getToken = (headers) => {
  if (headers && headers.authorization && headers.authorization.includes('Bearer')) {
    const parted = headers.authorization.split(' ');
    if (parted.length === 2) {
      return parted[1];
    }
  }
  return undefined;
};

const verifyToken = async (req, res) => {
  const result = {
    err: null,
    data: null
  };

  const token = getToken(req.headers);
  if (!token) {
    result.err = new ForbiddenError('Invalid token!');
    return wrapper.response(res, 'fail', result, 'Invalid token!', ERROR.FORBIDDEN);
  }

  const checkedToken = await verifyAccessToken(token);
  if (checkedToken.err){
    return wrapper.response(res, 'fail', checkedToken, checkedToken.err.message, ERROR.UNAUTHORIZED);
  }

  req.userId = checkedToken.data.userId;
  req.userMeta = checkRefreshToken.data.userMeta;
};

const verifyAccessToken = async (token) => {
  let decodedToken;
  try {
    decodedToken = jwt.verify(token, decodeKey(config.get('/jwt/publicKey')), config.get('/jwt/verifyOptions'));
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return wrapper.errorResponseResponse(new UnauthorizedError('Access token expired!'));
    }
    return wrapper.errorResponseResponse(new UnauthorizedError('Token is not valid!'));
  }
  const userId = decodedToken.sub;
  const user = decodedToken.metadata;

  const blacklistedToken = await checkBlacklistedToken(userId, token);
  if (blacklistedToken.data) {
    return wrapper.errorResponseResponse(new ForbiddenError('Blacklisted token!'));
  }

  return wrapper.data({
    userId: userId,
    accessToken: token,
    userMeta: user,
  });
};

const checkBlacklistedToken = async (userId, token) => {
  const blacklistedToken = await redisClient.getData(`blacklist-token:${userId}`);
  if (blacklistedToken.err || !blacklistedToken.data) {
    return wrapper.errorResponseResponse(new NotFoundError('blacklist token not found'));
  }
  if (JSON.parse(blacklistedToken.data).data !== token) {
    return wrapper.errorResponseResponse(new NotFoundError('blacklist token not matched'));
  }
  return wrapper.data('ok');
};

const verifyRefreshToken = async (token) => {
  let decodedToken;
  try {
    decodedToken = jwt.verify(token, decodeKey(config.get('/jwt/refresh/publicKey')), config.get('/jwt/verifyOptions'));
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return wrapper.errorResponseResponse(new UnauthorizedError('Refresh token expired!'));
    }
    return wrapper.errorResponseResponse(new UnauthorizedError('Token is not valid!'));
  }
  const userId = decodedToken.sub;
  const refreshToken = await checkRefreshToken(userId, token);
  if (refreshToken.err) {
    return wrapper.errorResponseResponse(refreshToken.err);
  }
  return wrapper.data({userId: userId});
};

const checkRefreshToken = async (userId, token) => {
  const refreshToken = await redisClient.getData(`refresh-token:${userId}`);
  if (refreshToken.err || !refreshToken.data) {
    return wrapper.errorResponseResponseResponse(new NotFoundError('refresh token not found'));
  }
  if (JSON.parse(refreshToken.data).data !== token) {
    return wrapper.errorResponseResponse(new NotFoundError('refresh token not matched'));
  }
  return wrapper.data('ok');
};

module.exports = {
  verifyToken,
  generateToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  checkRefreshToken
};
