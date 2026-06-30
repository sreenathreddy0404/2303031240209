const logger = require('../config/logger');

const errorHandler = (err, req, res, next) => {
  logger.error(`${err.message} \n ${err.stack}`);
  res.status(500).json({ success: false, message: 'Internal Server Error' });
};

module.exports = errorHandler;
