const urlParams = new URLSearchParams(window.location.search);
const mealName = urlParams.get('name');
const qty = parseInt(urlParams.get('qty') || 0);
const cal = urlParams.get('cal');
const pro = urlParams.get('pro');
const cost = urlParams.get('cost');

// Recipe dataset for IFCT specific items
const recipeDB = {
  "Oats (Raw)": {
    steps: ["Boil water or milk in a saucepan.", "Add the raw oats and reduce heat.", "Cook for 5-7 minutes, stirring occasionally.", "Serve hot with optional zero-calorie sweetener or chopped fruits."],
    pantry: ["Water/Milk", "Pinch of salt", "Optional: Cinnamon"]
  },
  "Poha (Dry eq)": {
    steps: ["Wash the poha in a colander and let it sit to soften.", "Heat a pan with 1tsp oil, add mustard seeds, chopped onions, and curry leaves.", "Sauté until onions are translucent.", "Add turmeric, salt, and the softened poha. Mix gently.", "Cover and cook on low heat for 2-3 minutes. Garnish with coriander."],
    pantry: ["1 tsp Oil", "Mustard seeds", "Onion & Curry leaves", "Turmeric & Salt"]
  },
  "Boiled Eggs": {
    steps: ["Place eggs in a pot and cover with cold water.", "Bring to a rolling boil over high heat.", "Cover the pot, remove from heat, and let sit for 10-12 minutes.", "Transfer eggs to an ice bath for 5 minutes before peeling."],
    pantry: ["Water", "Salt"]
  },
  "Moong Dal Chilla (Dry eq)": {
    steps: ["Soak moong dal for 2 hours, then blend into a smooth batter with ginger and green chilies.", "Add salt, turmeric, and a pinch of cumin to the batter.", "Heat a non-stick pan and spread a ladle of batter thinly like a crepe.", "Cook on medium heat until golden brown on both sides."],
    pantry: ["Ginger & Green Chili", "Cumin & Salt", "Minimal Oil for pan"]
  },
  "Idli Batter (Raw eq)": {
    steps: ["Grease idli molds with a drop of oil.", "Pour the fermented batter into the molds.", "Steam in an idli cooker for 10-12 minutes on medium heat.", "Let it cool slightly before removing."],
    pantry: ["Water for steaming", "Drop of oil for greasing"]
  },
  "Upma (Semolina dry)": {
    steps: ["Dry roast the semolina (rava) until slightly aromatic. Set aside.", "In a pan, heat 1tsp oil, add mustard seeds, urad dal, chopped onions, and chilies.", "Add 2.5 cups of water for every cup of semolina and bring to a boil. Add salt.", "Slowly pour in the roasted semolina while stirring continuously to avoid lumps.", "Cover and cook on low heat for 3 minutes."],
    pantry: ["1 tsp Oil", "Mustard seeds", "Onion & Green Chili", "Salt"]
  },
  "Wheat Paratha (Raw eq)": {
    steps: ["Knead the wheat flour with water and a pinch of salt to form a soft dough.", "Rest for 15 minutes. Divide into small balls.", "Roll each ball into a flat circle, apply a drop of ghee, fold, and roll again into a triangle or circle.", "Cook on a hot tawa (griddle), flipping until brown spots appear on both sides."],
    pantry: ["Water", "Pinch of salt", "1 tsp Ghee/Oil"]
  },
  "Egg Bhurji": {
    steps: ["Whisk eggs in a bowl with a pinch of salt.", "Heat 1tsp oil in a pan, add chopped onions, tomatoes, and green chilies.", "Sauté until soft, then add a pinch of turmeric and red chili powder.", "Pour in the whisked eggs and stir continuously on medium heat until scrambled and cooked."],
    pantry: ["Onion & Tomato", "Green Chili & Spices", "1 tsp Oil"]
  },
  "Chicken Breast (Raw)": {
    steps: ["Wash and pat dry the chicken breast.", "Marinate with salt, black pepper, garlic paste, and a dash of lemon juice for 15 minutes.", "Heat a non-stick skillet with 1tsp olive oil over medium-high heat.", "Sear the chicken for 5-7 minutes per side until fully cooked (165°F internal temp).", "Let it rest for 3 minutes before slicing."],
    pantry: ["Garlic paste", "Salt & Pepper", "Lemon juice", "1 tsp Oil"]
  },
  "Toor Dal (Dry eq)": {
    steps: ["Wash the dal thoroughly and pressure cook with 3 cups of water, turmeric, and salt for 3-4 whistles.", "In a separate pan, prepare the tempering (tadka): heat 1tsp ghee, add cumin seeds, garlic, and dried red chili.", "Pour the tempering over the cooked dal.", "Garnish with fresh coriander."],
    pantry: ["Turmeric & Salt", "Cumin & Garlic", "1 tsp Ghee"]
  },
  "Rajma (Dry eq)": {
    steps: ["Soak rajma (kidney beans) overnight (8-10 hours).", "Pressure cook with water and salt until completely soft (about 15-20 minutes).", "Prepare a base: sauté chopped onions, ginger-garlic paste, and tomato puree with coriander powder and garam masala.", "Add the boiled rajma to the base, simmer for 15 minutes until the gravy thickens."],
    pantry: ["Onion & Tomato", "Ginger-Garlic", "Spices (Garam Masala)"]
  },
  "Wheat Roti + Soya": {
    steps: ["Boil soya chunks in salted water for 10 minutes, squeeze out excess water, and blend or chop finely.", "Mix the soya mince with wheat flour, add water, and knead into a dough.", "Roll into flat circles (rotis).", "Cook on a hot tawa until puffs up, then cook directly on the flame for a few seconds."],
    pantry: ["Water", "Pinch of salt"]
  },
  "Fish Rohu (Raw)": {
    steps: ["Clean the fish pieces and marinate with turmeric, salt, and a few drops of mustard oil.", "Heat a pan (preferably with mustard oil) until smoking.", "Carefully place the fish pieces and shallow fry for 3-4 minutes per side until golden.", "Serve hot or proceed to make a light gravy with mustard paste."],
    pantry: ["Turmeric & Salt", "Mustard Oil (1 tsp)"]
  },
  "Chole (Dry eq)": {
    steps: ["Soak chickpeas overnight.", "Pressure cook with a tea bag (for color) and salt for 5 whistles until soft.", "In a pan, sauté onions, ginger, and tomato paste with chole masala powder.", "Add the boiled chickpeas, mix well, and simmer for 10 minutes. Mash a few chickpeas to thicken the gravy."],
    pantry: ["Onion & Tomato", "Chole Masala", "Tea bag (optional)"]
  },
  "Egg Curry (Egg eq)": {
    steps: ["Boil, peel, and make shallow slits on the eggs.", "Lightly fry the eggs in a pan with a pinch of turmeric.", "In the same pan, sauté chopped onions, ginger-garlic paste, and tomato puree.", "Add coriander powder, cumin powder, and water to form a gravy. Simmer for 5 minutes.", "Drop the eggs in and cook for another 2 minutes."],
    pantry: ["Onion & Tomato", "Ginger-Garlic", "Basic Spices"]
  },
  "Paneer (Raw)": {
    steps: ["Cut paneer into cubes.", "For a healthy sauté: Heat a non-stick pan with minimal oil.", "Toss the paneer cubes with salt, pepper, and a pinch of turmeric until slightly golden.", "Add a handful of capsicum and onions if desired. Do not overcook or it becomes rubbery."],
    pantry: ["Salt & Pepper", "Pinch of Turmeric"]
  },
  "Soya Chunks (Dry eq)": {
    steps: ["Boil water with a pinch of salt and add soya chunks. Boil for 5-7 minutes.", "Drain and wash with cold water. Squeeze out all the water thoroughly.", "In a pan, sauté onions, tomatoes, and green chilies.", "Add the squeezed soya chunks and cook for 5 minutes until flavors are absorbed."],
    pantry: ["Onion & Tomato", "Spices", "Pinch of salt"]
  },
  "Mutton (Raw)": {
    steps: ["Wash mutton pieces and marinate with yogurt, ginger-garlic paste, and turmeric for 1 hour.", "Heat a pressure cooker, add whole spices (cloves, cardamom, cinnamon), and sliced onions. Sauté until brown.", "Add the marinated mutton and roast on high heat for 10 minutes.", "Add tomatoes, coriander powder, and water. Pressure cook for 4-5 whistles on low heat until tender."],
    pantry: ["Yogurt (1 tbsp)", "Onion & Tomato", "Whole Spices", "Ginger-Garlic"]
  },
  "Mixed Veg (Raw eq)": {
    steps: ["Chop vegetables (carrots, beans, cauliflower, peas) uniformly.", "Heat 1tsp oil in a pan, add cumin seeds.", "Add the vegetables, salt, and a splash of water.", "Cover and steam-cook on low heat for 10-15 minutes until tender but crunchy.", "Garnish with coriander and a dash of black pepper."],
    pantry: ["Cumin seeds", "Salt & Pepper", "1 tsp Oil"]
  },
  "Moong Dal (Dry eq)": {
    steps: ["Wash yellow moong dal and pressure cook with 2.5 cups of water, turmeric, and salt for 2 whistles.", "Prepare tadka: heat 1tsp ghee, add cumin seeds, chopped garlic, and a green chili.", "Pour the hot tadka over the dal and mix well."],
    pantry: ["Turmeric & Salt", "Cumin & Garlic", "1 tsp Ghee"]
  },
  "Palak Paneer Eq": {
    steps: ["Blanch spinach (palak) in boiling water for 2 minutes, then transfer to ice water. Blend into a smooth puree.", "In a pan, sauté fine chopped onions, ginger, and garlic.", "Add the spinach puree and cook for 3-4 minutes. Add salt and a pinch of garam masala.", "Add paneer cubes, simmer for 2 minutes, and turn off heat."],
    pantry: ["Onion, Ginger, Garlic", "Salt & Garam Masala"]
  },
  "Roasted Chana": {
    steps: ["Roasted chana is usually ready-to-eat.", "For extra flavor: dry roast them in a pan for 2 minutes to make them warm and extra crunchy.", "Toss with a pinch of black salt and chaat masala."],
    pantry: ["Black Salt (optional)", "Chaat Masala (optional)"]
  },
  "Peanuts (Raw)": {
    steps: ["Heat a heavy-bottomed pan or kadhai.", "Add the raw peanuts and dry roast on low-medium heat, stirring continuously.", "Roast for 10-12 minutes until the skin starts to crack and they smell nutty.", "Let them cool completely to become crunchy."],
    pantry: ["Pinch of salt (optional)"]
  },
  "Whey Protein": {
    steps: ["Add 250ml of cold water or skim milk to a shaker bottle.", "Add the required scoops of whey protein powder.", "Shake vigorously for 20-30 seconds until completely dissolved.", "Consume immediately."],
    pantry: ["Water or Skim Milk"]
  },
  "Almonds": {
    steps: ["Soak almonds in water overnight (6-8 hours).", "In the morning, peel off the skin (it should slide off easily).", "Consume directly. Soaking improves nutrient absorption and digestion."],
    pantry: ["Water for soaking"]
  },
  "Curd / Yogurt": {
    steps: ["Serve chilled.", "Can be topped with a pinch of roasted cumin powder and black salt for digestion.", "Optionally, mix with fruits or cucumber to make a healthy raita."],
    pantry: ["Roasted Cumin powder", "Black Salt"]
  },
  "Banana": {
    steps: ["Peel and consume directly.", "Alternatively, slice and add to your oats or blend into a quick smoothie."],
    pantry: ["None"]
  },
  "Sprouts (Moong)": {
    steps: ["Wash moong beans and soak overnight.", "Drain water and tie them in a damp muslin cloth. Leave in a warm, dark place for 1-2 days until they sprout.", "To eat: mix sprouted moong with chopped onions, tomatoes, cucumber, green chili, lemon juice, and chaat masala."],
    pantry: ["Onion & Tomato", "Lemon juice", "Chaat Masala"]
  }
};

const fallbackRecipe = {
  steps: ["Prepare the ingredients.", "Cook thoroughly using healthy methods like boiling, steaming, or light sautéing.", "Serve warm and enjoy your healthy meal!"],
  pantry: ["Basic spices", "Water", "Pinch of salt"]
};

// Populate UI
document.getElementById('rName').textContent = mealName || 'Unknown Meal';
document.getElementById('rQty').textContent = `${qty}g Portion`;
document.getElementById('rCal').textContent = `${cal} kcal`;
document.getElementById('rPro').textContent = `${pro}g`;
document.getElementById('rCostDisplay').textContent = `₹${cost}`;
document.getElementById('rTotalCost').textContent = `Total Cost: ₹${cost}`;

// Fetch recipe data
const recipe = recipeDB[mealName] || fallbackRecipe;

// Render Ingredients
const ingGrid = document.getElementById('ingGrid');
let ingsHtml = `
  <div class="ing-card">
    <div class="ing-name">Primary: ${mealName}</div>
    <div class="ing-cost">₹${cost}</div>
  </div>
`;

if (recipe.pantry && recipe.pantry.length > 0) {
  recipe.pantry.forEach(p => {
    ingsHtml += `
      <div class="ing-card">
        <div class="ing-name">Pantry: ${p}</div>
        <div class="ing-cost" style="color:var(--gray-500)">₹0</div>
      </div>
    `;
  });
}
ingGrid.innerHTML = ingsHtml;

// Render Steps
const stepsList = document.getElementById('stepsList');
let stepsHtml = '';
recipe.steps.forEach(s => {
  stepsHtml += `<li>${s}</li>`;
});
stepsList.innerHTML = stepsHtml;
