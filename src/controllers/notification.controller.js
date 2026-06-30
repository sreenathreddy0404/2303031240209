const Notification = require('../models/Notification');
const { redisClient } = require('../config/redis');
const logger = require('../config/logger');

// Cache Helpers
const getUnreadCountFromCache = async (studentId) => {
  try {
    if (redisClient.isOpen) {
      const count = await redisClient.get(`unread:${studentId}`);
      if (count !== null) return parseInt(count);
    }
  } catch (err) {
    logger.error(`Redis get error: ${err.message}`);
  }
  return null;
};

const setUnreadCountInCache = async (studentId, count) => {
  try {
    if (redisClient.isOpen) {
      await redisClient.set(`unread:${studentId}`, count, { EX: 60 });
    }
  } catch (err) {
    logger.error(`Redis set error: ${err.message}`);
  }
};

const invalidateUnreadCountCache = async (studentId) => {
  try {
    if (redisClient.isOpen) {
      await redisClient.del(`unread:${studentId}`);
    }
  } catch (err) {
    logger.error(`Redis del error: ${err.message}`);
  }
};

// 1. Get All Notifications (with Pagination)
exports.getNotifications = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const notifications = await Notification.find({ studentID: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Notification.countDocuments({ studentID: req.user.id });

    // Fetch unread count (utilizing cache if available)
    let unread_count = await getUnreadCountFromCache(req.user.id);
    if (unread_count === null) {
      unread_count = await Notification.countDocuments({ studentID: req.user.id, isRead: false });
      await setUnreadCountInCache(req.user.id, unread_count);
    }

    res.json({ success: true, data: notifications, page, limit, total, unread_count });
  } catch (error) {
    next(error);
  }
};

// 2. Mark Single Notification as Read
exports.markAsRead = async (req, res, next) => {
  try {
    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id, studentID: req.user.id },
      { isRead: true },
      { new: true }
    );
    if (!notif) return res.status(404).json({ success: false, message: 'Notification not found' });

    // Invalidate Redis cache
    await invalidateUnreadCountCache(req.user.id);

    res.json({ success: true, message: 'Notification marked as read.' });
  } catch (error) {
    next(error);
  }
};

// 3. Mark All Notifications as Read
exports.markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ studentID: req.user.id, isRead: false }, { isRead: true });

    // Invalidate Redis cache
    await invalidateUnreadCountCache(req.user.id);

    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) {
    next(error);
  }
};

// 4. Delete a Notification
exports.deleteNotification = async (req, res, next) => {
  try {
    const notif = await Notification.findOneAndDelete({ _id: req.params.id, studentID: req.user.id });
    if (!notif) return res.status(404).json({ success: false, message: 'Notification not found' });

    // Invalidate Redis cache
    await invalidateUnreadCountCache(req.user.id);

    res.json({ success: true, message: 'Notification deleted.' });
  } catch (error) {
    next(error);
  }
};

// 5. Get Unread Count (with Redis Caching)
exports.getUnreadCount = async (req, res, next) => {
  try {
    let unread_count = await getUnreadCountFromCache(req.user.id);
    if (unread_count === null) {
      unread_count = await Notification.countDocuments({ studentID: req.user.id, isRead: false });
      await setUnreadCountInCache(req.user.id, unread_count);
    }
    res.json({ success: true, unread_count });
  } catch (error) {
    next(error);
  }
};

// 6. Stage 3 Query: Placement notifications in last 7 days
exports.getPlacementStudents = async (req, res, next) => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const studentIds = await Notification.distinct('studentID', {
      notificationType: 'Placement',
      createdAt: { $gte: sevenDaysAgo }
    });
    res.json({ success: true, studentIds });
  } catch (error) {
    next(error);
  }
};

// 7. Create Mock Notification (Helper)
exports.createMockNotification = async (req, res, next) => {
  try {
    const { title, message, notificationType } = req.body;
    const notif = await Notification.create({
      studentID: req.user.id,
      title: title || 'Placement Update',
      message: message || 'You have been shortlisted for Phase 2.',
      notificationType: notificationType || 'Placement'
    });

    // Invalidate Redis cache
    await invalidateUnreadCountCache(req.user.id);

    res.status(201).json({ success: true, data: notif });
  } catch (error) {
    next(error);
  }
};
