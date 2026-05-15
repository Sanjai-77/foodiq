const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Recipe = require('../models/Recipe');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/:foodName', auth, async (req, res) => {
  try {
    const { foodName } = req.params;
    const { qty } = req.query;

    // 1. Check if recipe is already cached in MongoDB
    const existingRecipe = await Recipe.findOne({ foodName });
    if (existingRecipe) {
      return res.json(existingRecipe);
    }

    // 2. Fetch User Profile to personalize the recipe
    const user = await User.findById(req.user.id);
    const profile = user.profile || {};
    
    const diet = profile.diet || 'veg';
    const quantity = qty || 100;

    // 3. Initialize Gemini LLM
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error('GEMINI_API_KEY is missing in .env');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // 4. Create Prompt Template strictly matching user instructions
    const promptText = `You are a professional Indian chef AI.

Your task is to generate a realistic ingredient list for a given food dish.

⚠️ STRICT RULES:
1. ONLY return ingredients — nothing else
2. DO NOT include cost, price, or any currency
3. DO NOT include cooking steps
4. DO NOT include nutrition
5. DO NOT include explanations

🥗 INGREDIENT REQUIREMENTS:
- Each ingredient must include:
  - name
  - quantity (in grams, ml, or pieces)
- Use REAL ingredients used in Indian cooking
- Quantities must be practical and cookable
- Ingredients must match the given quantity of the dish

🚫 STRICTLY AVOID:
- "some", "as needed", "basic ingredients"
- "water" unless necessary
- "salt to taste" → instead use exact quantity (e.g., 2g salt)
- vague or generic items

🎯 INPUT:
{
  "food_name": "${foodName}",
  "quantity_grams": ${quantity},
  "diet_type": "${diet}"
}

📦 OUTPUT FORMAT (STRICT JSON ONLY):
{
  "recipe_name": "string",
  "ingredients": [
    {
      "name": "string",
      "quantity": "string"
    }
  ]
}

🧠 LOGIC:
- Adjust ingredient quantities based on total dish weight
- Keep it realistic for Indian home cooking
- Ensure all ingredients are relevant to the dish

✅ FINAL CHECK:
- No extra fields
- No missing values
- No undefined/null
- Valid JSON only

Generate a clean, realistic ingredient list. STRICTLY RETURN JSON ONLY without any markdown formatting.`;

    // 5. Call LLM
    const result = await model.generateContent(promptText);
    const responseText = result.response.text();
    
    // 6. Parse JSON Safely
    let parsedRecipe;
    try {
        const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        parsedRecipe = JSON.parse(cleanedText);
    } catch (parseError) {
        console.error("Failed to parse LLM JSON", responseText);
        throw new Error("Invalid JSON from LLM");
    }

    // 7. Save to MongoDB Cache
    const newRecipe = new Recipe({
      foodName: foodName,
      recipe_name: parsedRecipe.recipe_name || foodName,
      ingredients: parsedRecipe.ingredients || []
    });

    await newRecipe.save();

    res.json(newRecipe);

  } catch (error) {
    console.error('Recipe Generation Error:', error.message);
    
    // 8. Fallback on Failure
    const fallback = {
      recipe_name: req.params.foodName,
      ingredients: [
        { name: "Primary Ingredient", quantity: `${req.query.qty || 100}g` },
        { name: "Water", quantity: "200ml" },
        { name: "Salt", quantity: "2g" }
      ]
    };
    
    res.json(fallback);
  }
});

module.exports = router;
