const express = require('express');
const authController = require('../controllers/auth.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected route to get current logged-in user
router.get('/me', verifyToken, authController.getMe);

module.exports = router;
