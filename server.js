const app = require('./src/app');
const connectDB = require('./src/config/db');
const { connectRedis } = require('./src/config/redis');
const logger = require('./src/config/logger');
require('dotenv').config();

const PORT = process.env.PORT || 3000;

// Connect to Databases and start Server
const startServer = async () => {
  await connectDB();
  await connectRedis();
  app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
  });
}

startServer();
