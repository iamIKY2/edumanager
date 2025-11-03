const express = require('express');
const router = express.Router();
const notificationController = require('../../controllers/notificationController');
const authMiddleware = require('../../middleware/auth');

router.get('/', authMiddleware, notificationController.getNotifications);
router.put('/:notificationId/read', authMiddleware, notificationController.markNotificationAsRead);
router.post('/mark-all-read', authMiddleware, notificationController.markAllAsRead);

module.exports = router;