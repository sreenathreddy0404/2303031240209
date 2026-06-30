const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  studentID: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  notificationType: { type: String, enum: ['Event', 'Result', 'Placement'], default: 'Event' },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// Compound index for user query performance (Stage 3 optimization)
NotificationSchema.index({ studentID: 1, createdAt: -1 });

// TTL index to automatically delete notifications older than 90 days (Stage 2 database policy)
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

module.exports = mongoose.model('Notification', NotificationSchema);
