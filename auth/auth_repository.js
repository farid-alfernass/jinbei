const config = require('../infra/configs/global_config');

class User {
  constructor(username, password) {
    this.username = username;
    this.password = password;
  }

  isValidPassword(password) {
    return this.password === password;
  }
}

module.exports.findByUsername = (username, cb) => {
  const userDatas = [
    {
      username: process.env.BASIC_AUTH_USERNAME,
      password: process.env.BASIC_AUTH_PASSWORD
    }
  ];
  let userData;

  userData = userDatas.map((value) => {
    if (value.username === username) {
      return value;
    }
    return '';
  });
  const user = new User(userData[0].username, userData[0].password);
  cb(user);
};
