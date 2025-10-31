const express = require('express');
const router = express.Router();
const notificationController = require('../../controllers/notificationController');
const authMiddleware = require('../../middleware/auth');

router.get('/', authMiddleware, notificationController.getNotifications);
router.put('/:notificationId/read', authMiddleware, notificationController.markNotificationAsRead);

module.exports = router;