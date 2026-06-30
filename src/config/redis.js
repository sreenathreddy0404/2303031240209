const { createClient } = require('redis');
const logger = require('./logger');

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://127.0.0.1:6379'
});

redisClient.on('error', (err) => logger.error(`Redis Client Error: ${err.message}`));
redisClient.on('connect', () => logger.info('Redis Client Connected'));

const connectRedis = async () => {
  try {
    await redisClient.connect();
  } catch (error) {
    logger.error(`Could not connect to Redis: ${error.message}`);
  }
};

module.exports = { redisClient, connectRedis };
