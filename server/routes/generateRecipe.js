/**
 * generateRecipe.js
 * ─────────────────────────────────────────────────────
 * AI-powered recipe generation using Google Gemini.
 * Generates realistic Indian cooking recipes based on
 * meal plan data. Includes retry logic and fallback.
 */

const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const auth = require('../middleware/auth');

const router = express.Router();

// ─── Gemini model to use (gemini-2.5-flash is current as of May 2026) ──
const GEMINI_MODEL = 'gemini-2.5-flash';

// ─── Fallback recipes when Gemini API is unavailable ────────────────────
const FALLBACK_RECIPES = {
  default: {
    recipe_name: '',
    ingredients: [
      { name: 'Main ingredient', quantity: 'As needed' },
      { name: 'Onion (chopped)', quantity: '1 medium' },
      { name: 'Tomato (chopped)', quantity: '1 medium' },
      { name: 'Green chillies', quantity: '1-2' },
      { name: 'Cooking oil', quantity: '2 tbsp' },
      { name: 'Turmeric powder', quantity: '1/2 tsp' },
      { name: 'Red chilli powder', quantity: '1/2 tsp' },
      { name: 'Cumin seeds', quantity: '1 tsp' },
      { name: 'Salt', quantity: 'To taste' },
      { name: 'Fresh coriander', quantity: 'For garnish' }
    ],
    steps: [
      'Wash and prepare all ingredients. Chop onions, tomatoes, and green chillies finely.',
      'Heat oil in a pan or kadhai over medium flame. Add cumin seeds and let them splutter.',
      'Add chopped onions and sauté until they turn golden brown, about 3-4 minutes.',
      'Add green chillies, turmeric powder, and red chilli powder. Stir for 30 seconds.',
      'Add chopped tomatoes and cook until they soften and oil separates, about 3 minutes.',
      'Add the main ingredient and salt. Mix well to coat evenly with the masala.',
      'Cover and cook on medium-low flame for 8-10 minutes, stirring occasionally.',
      'Garnish with fresh coriander leaves and serve hot with roti or rice.'
    ]
  }
};

/**
 * Clean and parse JSON from Gemini response.
 * Handles markdown code fences, extra whitespace, and trailing commas.
 */
function parseGeminiJSON(rawText) {
  let cleaned = rawText
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();

  // Remove trailing commas before closing braces/brackets (common LLM mistake)
  cleaned = cleaned.replace(/,\s*([}\]])/g, '$1');

  return JSON.parse(cleaned);
}

/**
 * Build the prompt for Gemini.
 */
function buildPrompt(food_name, quantity, calories, protein, cost) {
  return `You are a professional Indian chef and nutritionist.

Generate a realistic, authentic Indian recipe for the following meal:

MEAL DETAILS:
- Food: ${food_name}
- Portion: ${quantity}g
- Calories: ${calories} kcal
- Protein: ${protein}g
- Budget: ₹${cost}

RESPOND WITH ONLY A JSON OBJECT (no markdown, no extra text):
{
  "recipe_name": "Descriptive recipe name",
  "ingredients": [
    { "name": "Ingredient name", "quantity": "Amount with unit" }
  ],
  "steps": [
    "Step 1 description",
    "Step 2 description"
  ]
}

RULES:
- Include 6-10 realistic ingredients with proper quantities
- Include 5-8 clear cooking steps
- Use authentic Indian cooking methods and spices
- Keep it practical and budget-friendly
- Return ONLY valid JSON, nothing else`;
}

// ─── In-Memory Recipe Cache ─────────────────────────────────────
const recipeCache = new Map();

/**
 * Call Gemini API with optimized generation config.
 */
async function callGemini(prompt, apiKey) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ 
    model: GEMINI_MODEL,
    generationConfig: {
      responseMimeType: "application/json",
      maxOutputTokens: 600, // Faster generation by capping output size
      temperature: 0.7
    }
  });

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  console.log('  ✅ Gemini raw response length:', text.length, 'chars');

  return parseGeminiJSON(text);
}

/**
 * Generate a contextual fallback recipe based on the food name.
 */
function generateFallback(food_name, quantity) {
  const fallback = JSON.parse(JSON.stringify(FALLBACK_RECIPES.default));
  fallback.recipe_name = food_name;
  fallback.ingredients[0].name = food_name;
  fallback.ingredients[0].quantity = `${quantity}g`;
  return fallback;
}

/**
 * Validate parsed recipe has all required fields.
 */
function validateRecipe(recipe, food_name) {
  if (!recipe.recipe_name) recipe.recipe_name = food_name;

  if (!Array.isArray(recipe.ingredients) || recipe.ingredients.length === 0) {
    return false;
  }

  if (!Array.isArray(recipe.steps) || recipe.steps.length === 0) {
    return false;
  }

  // Sanitize ingredients — remove any with undefined/null values
  recipe.ingredients = recipe.ingredients
    .filter(ing => ing && ing.name)
    .map(ing => ({
      name: String(ing.name || 'Ingredient'),
      quantity: String(ing.quantity || 'As needed')
    }));

  // Sanitize steps — remove empty steps
  recipe.steps = recipe.steps
    .filter(step => step && String(step).trim().length > 0)
    .map(step => String(step));

  return recipe.ingredients.length > 0 && recipe.steps.length > 0;
}

// ─── POST /api/generate-recipe ──────────────────────────────────────────
router.post('/', auth, async (req, res) => {
  const { food_name, quantity, calories, protein, cost } = req.body;

  // 1. Check Cache First (Instant Loading)
  const cacheKey = `${food_name}_${quantity}g`;
  if (recipeCache.has(cacheKey)) {
    console.log('  ⚡ Serving recipe from cache (0ms):', food_name);
    return res.json(recipeCache.get(cacheKey));
  }

  console.log('\n─── Recipe Generation Request ───');
  console.log('  Meal:', food_name);
  console.log('  Qty:', quantity, '| Cal:', calories, '| Pro:', protein, '| Cost: ₹' + cost);

  // Validate input
  if (!food_name) {
    return res.status(400).json({ message: 'food_name is required' });
  }

  // Validate API key
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('  ❌ GEMINI_API_KEY is missing from .env');
    return res.status(500).json({ message: 'Gemini API key not configured. Add GEMINI_API_KEY to .env' });
  }

  const prompt = buildPrompt(food_name, quantity || 100, calories || 0, protein || 0, cost || 0);

  // Attempt 1
  try {
    console.log('  🔄 Attempt 1: Calling Gemini API...');
    const recipe = await callGemini(prompt, apiKey);

    if (validateRecipe(recipe, food_name)) {
      console.log('  ✅ Recipe generated successfully:', recipe.recipe_name);
      recipeCache.set(cacheKey, recipe); // Save to cache
      return res.json(recipe);
    }

    console.warn('  ⚠️ Attempt 1: Invalid recipe structure, retrying...');
  } catch (err) {
    console.error('  ❌ Attempt 1 failed:', err.message);
  }

  // Attempt 2 (retry)
  try {
    console.log('  🔄 Attempt 2: Retrying Gemini API...');
    const recipe = await callGemini(prompt, apiKey);

    if (validateRecipe(recipe, food_name)) {
      console.log('  ✅ Recipe generated on retry:', recipe.recipe_name);
      recipeCache.set(cacheKey, recipe); // Save to cache
      return res.json(recipe);
    }

    console.warn('  ⚠️ Attempt 2: Invalid recipe structure, using fallback...');
  } catch (err) {
    console.error('  ❌ Attempt 2 failed:', err.message);
  }

  // Fallback
  console.log('  🔶 Using fallback recipe for:', food_name);
  const fallback = generateFallback(food_name, quantity || 100);
  return res.json(fallback);
});

module.exports = router;
