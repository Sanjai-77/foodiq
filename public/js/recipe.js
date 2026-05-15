/**
 * recipe.js (Frontend)
 * ─────────────────────────────────────────────────────
 * Handles the recipe page — reads URL params, calls
 * backend API, and renders ingredients + cooking steps.
 */

const urlParams = new URLSearchParams(window.location.search);
const mealName = urlParams.get('name');
const qty = parseInt(urlParams.get('qty') || 0);
const cal = parseInt(urlParams.get('cal') || 0);
const pro = parseInt(urlParams.get('pro') || 0);
const cost = parseInt(urlParams.get('cost') || 0);

// Check authentication
if (!getToken()) {
  window.location.href = 'index.html';
}

// Populate basic UI elements immediately from URL
document.getElementById('rName').textContent = mealName || 'Unknown Meal';
document.getElementById('rQty').textContent = `${qty}g Portion`;
document.getElementById('rCal').textContent = `${cal} kcal`;
document.getElementById('rPro').textContent = `${pro}g`;
document.getElementById('rCostDisplay').textContent = `₹${cost}`;
document.getElementById('rTotalCost').textContent = `Total Cost: ₹${cost}`;

async function loadRecipe() {
  const ingGrid = document.getElementById('ingGrid');
  const stepsList = document.getElementById('stepsList');
  
  // Show Loading State
  ingGrid.innerHTML = `
    <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem;">
      <i class="fa-solid fa-spinner fa-spin" style="font-size: 2.5rem; color: var(--green-600); margin-bottom: 15px;"></i>
      <h3 style="color: var(--gray-800); margin-bottom: 5px;">Generating your recipe...</h3>
      <p style="color: var(--gray-500); font-size: 0.9rem;">Consulting our AI chef...</p>
    </div>
  `;
  stepsList.innerHTML = '';

  try {
    const res = await fetch(`${API_BASE}/generate-recipe`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        food_name: mealName,
        quantity: qty,
        calories: cal,
        protein: pro,
        cost: cost
      })
    });
    
    const data = await res.json();

    // Check for backend error message
    if (!res.ok) {
      throw new Error(data.message || 'Failed to fetch recipe');
    }

    // Update recipe name
    document.getElementById('rName').textContent = data.recipe_name || mealName;

    // Render Ingredients
    let ingsHtml = '';
    if (data.ingredients && Array.isArray(data.ingredients) && data.ingredients.length > 0) {
      data.ingredients.forEach(ing => {
        const name = ing.name || 'Ingredient';
        const quantity = ing.quantity || 'As needed';
        ingsHtml += `
          <div class="ing-card">
            <div class="ing-name"><i class="fa-solid fa-check" style="color:var(--green-500); margin-right:8px;"></i>${name}</div>
            <div style="font-size: 0.85rem; color: var(--gray-500); margin-top: 4px;">${quantity}</div>
          </div>
        `;
      });
    } else {
      ingsHtml = `<div style="grid-column: 1 / -1; color: var(--gray-500); text-align: center;">No ingredients data available.</div>`;
    }
    ingGrid.innerHTML = ingsHtml;

    // Render Steps
    let stepsHtml = '';
    if (data.steps && Array.isArray(data.steps) && data.steps.length > 0) {
      data.steps.forEach(s => {
        if (s && String(s).trim()) {
          stepsHtml += `<li>${s}</li>`;
        }
      });
    } else {
      stepsHtml = `<li>Recipe instructions are not available. Please try again.</li>`;
    }
    stepsList.innerHTML = stepsHtml;

  } catch (error) {
    console.error('Recipe Generation Error:', error);
    
    ingGrid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: #ef4444; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px;">
        <i class="fa-solid fa-triangle-exclamation" style="font-size: 2rem; margin-bottom: 10px;"></i>
        <h3 style="margin-bottom: 5px;">Failed to generate recipe</h3>
        <p style="margin-bottom: 15px;">${error.message || 'An unexpected error occurred.'}</p>
        <button onclick="loadRecipe()" style="padding: 10px 24px; background: var(--gradient-primary); color: #fff; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 0.9rem;">
          <i class="fa-solid fa-rotate-right"></i> Try Again
        </button>
      </div>
    `;
    stepsList.innerHTML = '';
  }
}

// Load dynamic recipe
loadRecipe();

// Set Buy Ingredients button link
const buyBtn = document.getElementById('buyIngredientsBtn');
if (buyBtn && mealName) {
  const cleanName = mealName.replace(/\s*\(.*?\)\s*/g, '').trim();
  buyBtn.href = `marketplace.html?q=${encodeURIComponent(cleanName)}`;
}
