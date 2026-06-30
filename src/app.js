const express = require('express');
const requestLogger = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./routes/auth.routes');
const notificationRoutes = require('./routes/notification.routes');

const app = express();
app.use(express.json());
app.use(requestLogger);

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/notifications', notificationRoutes);

// Error Handler
app.use(errorHandler);

module.exports = app;
