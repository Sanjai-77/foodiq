/**
 * chatController.js
 * ─────────────────────────────────────────────────────
 * Handles chat API requests. Fetches the user's profile
 * and meal plan to inject personalized context into the
 * AI conversation.
 */

const User = require('../models/User');
const MealPlan = require('../models/MealPlan');
const groqService = require('../services/groqService');

// In-memory short-term conversation store (per user)
// Key: userId, Value: { messages: [], foodMemory: [], lastActive: Date }
const conversationStore = new Map();

// Clean up stale sessions every 30 minutes
const SESSION_TTL_MS = 30 * 60 * 1000;
setInterval(() => {
  const now = Date.now();
  for (const [userId, session] of conversationStore) {
    if (now - session.lastActive > SESSION_TTL_MS) {
      conversationStore.delete(userId);
    }
  }
}, 10 * 60 * 1000);

/**
 * Detect if the user mentioned eating something.
 * Returns the food phrase or null.
 */
function detectFoodMention(message) {
  const lowerMsg = message.toLowerCase();
  const eatPatterns = [
    /i (?:ate|had|consumed|just had|just ate|finished eating|drank|took)\s+(.+)/i,
    /i've (?:eaten|had|consumed)\s+(.+)/i,
    /(?:already )?ate\s+(.+)/i,
    /(?:had|finished)\s+(.+?)(?:\s+for\s+(?:breakfast|lunch|dinner|snack))/i
  ];

  for (const pattern of eatPatterns) {
    const match = message.match(pattern);
    if (match) return match[1].trim().replace(/[.!?]+$/, '');
  }
  return null;
}

/**
 * Get or create a conversation session for the user.
 */
function getSession(userId) {
  if (!conversationStore.has(userId)) {
    conversationStore.set(userId, {
      messages: [],
      foodMemory: [],
      lastActive: Date.now()
    });
  }
  const session = conversationStore.get(userId);
  session.lastActive = Date.now();
  return session;
}

/**
 * POST /api/chat
 * Main chat endpoint.
 */
async function handleChat(req, res) {
  try {
    const { message } = req.body;
    const userId = req.user.id;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ reply: 'Please type a message.' });
    }

    // Fetch user profile
    const user = await User.findById(userId).select('name profile').lean();
    const profile = user?.profile || {};

    // Fetch today's meal plan
    let todayMeals = null;
    try {
      const mealPlan = await MealPlan.findOne({ userId }).lean();
      if (mealPlan && mealPlan.days && mealPlan.days.length > 0) {
        // Find the first non-completed day, or fall back to day 1
        const activeDay = mealPlan.days.find(d => !d.completed) || mealPlan.days[0];
        todayMeals = {
          breakfast: activeDay.breakfast?.name || null,
          lunch: activeDay.lunch?.name || null,
          dinner: activeDay.dinner?.name || null,
          snack: activeDay.snack?.name || null
        };
      }
    } catch (err) {
      console.error('Error fetching meal plan for chat:', err.message);
    }

    // Get/create session
    const session = getSession(userId);

    // Detect food mentions and add to memory
    const foodMention = detectFoodMention(message);
    if (foodMention) {
      session.foodMemory.push(foodMention);
      // Cap food memory at last 10 items
      if (session.foodMemory.length > 10) {
        session.foodMemory = session.foodMemory.slice(-10);
      }
    }

    // Add user message to conversation history
    session.messages.push({ role: 'user', content: message });

    // Keep only last 12 messages to stay within context window
    if (session.messages.length > 12) {
      session.messages = session.messages.slice(-12);
    }

    // Build user context
    const userContext = {
      name: user?.name,
      goal: profile.goal,
      weight: profile.weight,
      height: profile.height,
      age: profile.age,
      gender: profile.gender,
      activity: profile.activity,
      budget: profile.budget,
      diet: profile.diet,
      targetCalories: profile.targetCalories,
      targetProtein: profile.targetProtein,
      targetCarbs: profile.targetCarbs,
      targetFats: profile.targetFats,
      todayMeals,
      conversationMemory: session.foodMemory
    };

    // Call Groq AI
    const reply = await groqService.chat(session.messages, userContext);

    // Add assistant reply to session
    session.messages.push({ role: 'assistant', content: reply });

    res.json({ reply });

  } catch (err) {
    console.error('Chat error:', err.message);
    console.error('Full error:', err);

    // Fallback response when Groq API fails
    const fallbacks = [
      "I'm having a moment — could you try again in a few seconds?",
      "My connection hiccuped. Please resend your message.",
      "Something went wrong on my end. Try asking again!"
    ];
    const fallback = fallbacks[Math.floor(Math.random() * fallbacks.length)];
    res.status(500).json({ reply: fallback });
  }
}

/**
 * POST /api/chat/clear
 * Clear conversation history for the user.
 */
async function clearChat(req, res) {
  const userId = req.user.id;
  conversationStore.delete(userId);
  res.json({ message: 'Conversation cleared.' });
}

module.exports = { handleChat, clearChat };
