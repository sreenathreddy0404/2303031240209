const Notification = require('../models/Notification');

exports.getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ studentID: req.user.id }).sort({ createdAt: -1 });
    const total = notifications.length;
    const unread_count = notifications.filter(n => !n.isRead).length;

    res.json({ success: true, data: notifications, total, unread_count });
  } catch (error) {
    next(error);
  }
};

exports.markAsRead = async (req, res, next) => {
  try {
    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id, studentID: req.user.id },
      { isRead: true },
      { new: true }
    );
    if (!notif) return res.status(404).json({ success: false, message: 'Notification not found' });
    res.json({ success: true, message: 'Notification marked as read.' });
  } catch (error) {
    next(error);
  }
};

exports.markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ studentID: req.user.id, isRead: false }, { isRead: true });
    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) {
    next(error);
  }
};

exports.deleteNotification = async (req, res, next) => {
  try {
    const notif = await Notification.findOneAndDelete({ _id: req.params.id, studentID: req.user.id });
    if (!notif) return res.status(404).json({ success: false, message: 'Notification not found' });
    res.json({ success: true, message: 'Notification deleted.' });
  } catch (error) {
    next(error);
  }
};

exports.getUnreadCount = async (req, res, next) => {
  try {
    const unread_count = await Notification.countDocuments({ studentID: req.user.id, isRead: false });
    res.json({ success: true, unread_count });
  } catch (error) {
    next(error);
  }
};

exports.createMockNotification = async (req, res, next) => {
  try {
    const { title, message, type } = req.body;
    const notif = await Notification.create({
      studentID: req.user.id,
      title: title || 'Placement Update',
      message: message || 'You have been shortlisted for Phase 2.',
      type: type || 'Placement'
    });
    res.status(201).json({ success: true, data: notif });
  } catch (error) {
    next(error);
  }
};
