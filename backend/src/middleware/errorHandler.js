const logger = require('../config/logger');

const errorHandler = (err, req, res, next) => {
  logger.error({ message: err.message, stack: err.stack, path: req.path });
  const status = err.status || 500;
  res.status(status).json({
    error: {
      message: err.message || 'Internal Server Error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
};

module.exports = { errorHandler };
