const express = require('express');
const auth = require('../middleware/auth');
const notifController = require('../controllers/notification.controller');
const router = express.Router();

router.use(auth); // protect all notification routes

router.get('/', notifController.getNotifications);
router.post('/mock', notifController.createMockNotification);
router.get('/unread-count', notifController.getUnreadCount);
router.get('/placement-students', notifController.getPlacementStudents);
router.patch('/read-all', notifController.markAllAsRead);
router.patch('/:id/read', notifController.markAsRead);
router.delete('/:id', notifController.deleteNotification);

module.exports = router;
