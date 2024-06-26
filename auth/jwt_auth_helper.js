
const jwt = require('jsonwebtoken');
const config = require('../infra/configs/global_config');
const wrapper = require('../helpers/utils/wrapper');
const { ERROR } = require('../helpers/http-status/status_code');
const { UnauthorizedError, ForbiddenError, NotFoundError } = require('../helpers/error');
const fs = require('fs');
// const decodeKey = keyPath => fs.readFileSync(keyPath, 'utf8');

const decodeKey = (secret) => Buffer.from(secret, 'base64');

const Redis = require('../helpers/databases/redis/redis');
const redisClient = new Redis({
  connection: {
    host: process.env.REDIS_CLIENT_HOST,
    port: process.env.REDIS_CLIENT_PORT,
    password: process.env.REDIS_CLIENT_PASSWORD,
    auth_pass: process.env.REDIS_CLIENT_PASSWORD,
  }
});

const generateToken = async (payload) => {
  const privateKey = decodeKey(process.env.PRIVATE_KEY_PATH);
  return jwt.sign(payload, privateKey, {
    algorithm: process.env.JWT_SIGNING_ALGORITHM,
    audience: process.env.JWT_AUDIENCE,
    issuer: process.env.JWT_ISSUER,
    expiresIn: process.env.JWT_EXPIRATION_TIME
  });
};

const generateRefreshToken = async (payload) => {
  const privateKey = decodeKey(process.env.PRIVATE_KEY_REFRESH_PATH);
  const token = jwt.sign(payload, privateKey, {
    algorithm: process.env.JWT_SIGNING_ALGORITHM,
    audience: process.env.JWT_AUDIENCE,
    issuer: process.env.JWT_ISSUER,
    expiresIn: process.env.REFRESH_JWT_EXPIRATION_TIME
  });
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
  req.userMeta = checkedToken.data.userMeta;
};

const verifyAccessToken = async (token) => {
  let decodedToken;
  try {
    decodedToken = jwt.verify(token, decodeKey(process.env.PUBLIC_KEY_PATH), {
      algorithm: process.env.JWT_SIGNING_ALGORITHM,
      audience: process.env.JWT_AUDIENCE,
      issuer: process.env.JWT_ISSUER
    });
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return wrapper.errorResponse(new UnauthorizedError('Access token expired!'));
    }
    return wrapper.errorResponse(new UnauthorizedError('Token is not valid!'));
  }
  const userId = decodedToken.sub;
  const user = decodedToken.metadata;

  const blacklistedToken = await checkBlacklistedToken(userId, token);
  if (blacklistedToken.data) {
    return wrapper.errorResponse(new ForbiddenError('Blacklisted token!'));
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
    return wrapper.errorResponse(new NotFoundError('blacklist token not found'));
  }
  if (JSON.parse(blacklistedToken.data).data !== token) {
    return wrapper.errorResponse(new NotFoundError('blacklist token not matched'));
  }
  return wrapper.data('ok');
};

const verifyRefreshToken = async (token) => {
  let decodedToken;
  try {
    decodedToken = jwt.verify(token, decodeKey(process.env.PUBLIC_KEY_REFRESH_PATH), {
      algorithm: process.env.JWT_SIGNING_ALGORITHM,
      audience: process.env.JWT_AUDIENCE,
      issuer: process.env.JWT_ISSUER
    });
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return wrapper.errorResponse(new UnauthorizedError('Refresh token expired!'));
    }
    return wrapper.errorResponse(new UnauthorizedError('Token is not valid!'));
  }
  const userId = decodedToken.sub;
  const refreshToken = await checkRefreshToken(userId, token);
  if (refreshToken.err) {
    return wrapper.errorResponse(refreshToken.err);
  }
  return wrapper.data({userId: userId});
};

const checkRefreshToken = async (userId, token) => {
  const refreshToken = await redisClient.getData(`refresh-token:${userId}`);
  if (refreshToken.err || !refreshToken.data) {
    return wrapper.errorResponseResponse(new NotFoundError('refresh token not found'));
  }
  if (JSON.parse(refreshToken.data).data !== token) {
    return wrapper.errorResponse(new NotFoundError('refresh token not matched'));
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
