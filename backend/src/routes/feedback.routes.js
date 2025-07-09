const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
const authMiddleware = require('../middlewares/auth');

router.post('/feedback', authMiddleware, feedbackController.postFeedback);

module.exports = router;
