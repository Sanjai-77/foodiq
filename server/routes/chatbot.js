/**
 * chatbot.js (route)
 * ─────────────────────────────────────────────────────
 * API routes for FoodIQ AI Coach chatbot.
 * All routes require authentication.
 */

const express = require('express');
const auth = require('../middleware/auth');
const { handleChat, clearChat } = require('../controllers/chatController');

const router = express.Router();

// All chatbot routes are protected
router.use(auth);

// POST /api/chat — Send a message, get AI response
router.post('/', handleChat);

// POST /api/chat/clear — Clear conversation history
router.post('/clear', clearChat);

module.exports = router;
