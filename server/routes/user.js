const express = require('express');
const router = express.Router();
const { getUserProfile, updateUserProfile } = require('../controllers/userController');
const authenticateToken = require('../middleware/auth');

router.get('/profile', authenticateToken, getUserProfile);
router.post('/profile/update', authenticateToken, updateUserProfile);

module.exports = router;