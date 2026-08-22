const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyJWT } = require('../middleware/authMiddleware');

router.post('/login', authController.login);
router.post('/demo-login', authController.demoLogin);
router.get('/me', verifyJWT, authController.getMe);

module.exports = router;
