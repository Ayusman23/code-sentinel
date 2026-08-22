const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyJWT } = require('../middleware/authMiddleware');
const config = require('../config');

router.post('/login', authController.login);
router.post('/register', authController.register);
router.post('/signup', authController.register);
router.post('/google', authController.googleAuth);
router.get('/google/client-id', (req, res) => {
  res.json({ clientId: config.googleClientId || '' });
});
router.post('/demo-login', authController.demoLogin);
router.get('/me', verifyJWT, authController.getMe);

module.exports = router;
