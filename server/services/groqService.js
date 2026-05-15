/**
 * groqService.js
 * ─────────────────────────────────────────────────────
 * AI Chat service for FoodIQ AI Coach.
 * Uses Google Gemini API (switched from Groq due to
 * account restriction). The exported interface remains
 * identical so controllers need no changes.
 *
 * All LLM calls are routed through this service — the
 * API key never touches the frontend.
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

// Gemini model — same one used by recipe generation
const GEMINI_MODEL = 'gemini-2.5-flash';

/**
 * Build the system prompt that shapes AI personality.
 * Injected with user-specific data for personalization.
 */
function buildSystemPrompt(userContext) {
  const { name, goal, weight, height, age, gender, activity, budget, diet,
          targetCalories, targetProtein, targetCarbs, targetFats,
          todayMeals, conversationMemory } = userContext;

  // Format the goal label for readability
  const goalLabel = {
    'weight-loss': 'Weight Loss',
    'maintenance': 'Maintenance',
    'muscle-gain': 'Muscle Gain'
  }[goal] || goal || 'not set';

  const dietLabel = diet === 'veg' ? 'Vegetarian' : diet === 'nonveg' ? 'Non-Vegetarian' : 'not set';

  let mealMemory = '';
  if (conversationMemory && conversationMemory.length > 0) {
    mealMemory = `\n\nFOODS THE USER MENTIONED EATING IN THIS SESSION:\n${conversationMemory.map(m => `- ${m}`).join('\n')}`;
  }

  let todayMealsInfo = '';
  if (todayMeals) {
    todayMealsInfo = `\n\nTODAY'S PLANNED MEALS FROM THEIR MEAL PLAN:
- Breakfast: ${todayMeals.breakfast || 'N/A'}
- Lunch: ${todayMeals.lunch || 'N/A'}
- Dinner: ${todayMeals.dinner || 'N/A'}
- Snack: ${todayMeals.snack || 'N/A'}`;
  }

  return `You are "FoodIQ AI Coach" — a certified nutrition coach, budget meal planner, fitness advisor, and Indian diet expert integrated into FoodIQ, a personalized budget-based meal planner.

YOUR PERSONALITY:
- Friendly, professional, and conversational
- Concise but thorough — answer in 2-5 sentences unless the question needs detail
- Use practical, actionable advice
- Avoid emojis in excess (1-2 max per message if appropriate)
- Never provide dangerous medical advice or fake scientific claims
- Always stay focused on fitness, nutrition, and meal planning
- If someone asks something unrelated to health/fitness/nutrition, politely redirect

USER PROFILE:
- Name: ${name || 'User'}
- Age: ${age || 'not set'}
- Gender: ${gender || 'not set'}
- Height: ${height ? height + ' cm' : 'not set'}
- Weight: ${weight ? weight + ' kg' : 'not set'}
- Activity Level: ${activity || 'not set'}
- Fitness Goal: ${goalLabel}
- Monthly Budget: ${budget ? '₹' + budget : 'not set'}
- Diet Preference: ${dietLabel}

DAILY NUTRITION TARGETS:
- Calories: ${targetCalories || 'not calculated'} kcal
- Protein: ${targetProtein || 'not calculated'} g
- Carbs: ${targetCarbs || 'not calculated'} g
- Fats: ${targetFats || 'not calculated'} g
${todayMealsInfo}${mealMemory}

IMPORTANT BEHAVIORAL RULES:
1. When the user says they ate something, acknowledge it, estimate the approximate nutrition, and suggest what they should eat next to stay balanced.
2. Always consider the user's fitness goal when making recommendations. For muscle gain, emphasize protein. For weight loss, emphasize low-calorie options.
3. Factor in the user's budget — suggest affordable Indian foods when relevant.
4. Factor in diet preference — do not suggest non-veg food to vegetarian users.
5. If the user mentions eating something heavy/unhealthy, gently suggest a lighter, healthier next meal.
6. When asked "what should I eat next", use the context of what they've already eaten and their goals.
7. Keep responses natural, like talking to a personal nutrition coach.
8. For Indian food references, use common names (dosa, idli, dal, roti, paneer, etc.)
9. Do not repeat the user's profile back to them unless asked.
10. Never say you are an AI or language model. Just behave as a nutrition coach.`;
}

/**
 * Convert OpenAI-style messages [{role, content}] to Gemini format.
 * Gemini uses 'user' and 'model' roles (not 'assistant').
 */
function convertToGeminiHistory(messages) {
  return messages.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }]
  }));
}

/**
 * Send a message to Gemini and return the AI response.
 * @param {Array} messages - Chat history [{role, content}]
 * @param {Object} userContext - User profile + meal data
 * @returns {string} AI reply text
 */
async function chat(messages, userContext) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in environment variables.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 512,
      topP: 0.9
    }
  });

  const systemPrompt = buildSystemPrompt(userContext);

  // Separate the last user message from conversation history
  const lastMessage = messages[messages.length - 1];
  const historyMessages = messages.slice(0, -1);

  // Start a chat session with system instruction and history
  const chatSession = model.startChat({
    systemInstruction: { parts: [{ text: systemPrompt }] },
    history: convertToGeminiHistory(historyMessages)
  });

  // Send the latest user message
  const result = await chatSession.sendMessage(lastMessage.content);
  const reply = result.response.text();

  return reply || 'I couldn\'t generate a response. Please try again.';
}

module.exports = { chat };
