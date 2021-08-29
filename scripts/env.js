// tiny wrapper with default env vars
module.exports = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: process.env.PORT || 8080,
  HOSTNAME: process.env.HOSTNAME || "localhost",
};
process.env.NODE_ENV = module.exports.NODE_ENV;
process.env.PORT = module.exports.PORT;
process.env.HOSTNAME = module.exports.HOSTNAME;
