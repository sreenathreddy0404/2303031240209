const app = require('./src/app');
const connectDB = require('./src/config/db');
const logger = require('./src/config/logger');
require('dotenv').config();

const PORT = process.env.PORT || 3000;

// Connect to Database and start Server
connectDB().then(() => {
  app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
  });
});
