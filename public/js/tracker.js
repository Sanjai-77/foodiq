// tracker.js - Nutrition tracking logic

// Auth guard
if (!getToken()) window.location.href = 'index.html';

let currentDay = 1;
let completedDays = [];
let allNutritionData = [];
let chartInstance = null;
let mealPlan = null;

// ─── Load Meal Plan from MongoDB ─────────────────────────────
async function loadMealPlan() {
  try {
    const res = await fetch(`${API_BASE}/meals/get`, { headers: getHeaders() });
    const data = await res.json();
    if (res.ok && data.plan && data.plan.days.length > 0) {
      mealPlan = data.plan;

      $('targetInfoBar').innerHTML = `<span>🎯 Monthly Plan Target: <strong>${mealPlan.targetCalories} kcal</strong>/day · Budget: <strong>₹${Math.round(mealPlan.dailyBudget)}</strong>/day</span>`;

      $('noPlanBanner').style.display = 'none';
      $('trackerMain').style.display = '';
      return true;
    }

    $('noPlanBanner').style.display = '';
    $('trackerMain').style.display = 'none';
    return false;
  } catch (err) {
    console.error('Meal plan load error:', err);
    $('noPlanBanner').style.display = '';
    $('trackerMain').style.display = 'none';
    return false;
  }
}

// ─── Load Completed Nutrition Data ───────────────────────────
async function loadNutritionData() {
  try {
    const res = await fetch(`${API_BASE}/tracker/user/${getUser().id}`, { headers: getHeaders() });
    const data = await res.json();
    if (res.ok) {
      allNutritionData = data.data || [];
      completedDays = allNutritionData.filter(d => d.completed).map(d => d.day);

      currentDay = completedDays.length > 0 ? Math.max(...completedDays) + 1 : 1;
      if (currentDay > mealPlan.totalDays) currentDay = mealPlan.totalDays;

      loadDayUI();

      if (completedDays.length > 0) {
        $('calorieChartCard').style.display = '';
        renderChart();
      } else {
        $('calorieChartCard').style.display = 'none';
      }
    }
  } catch (err) {
    console.error('Load nutrition error:', err);
  }
}

function createMealCard(title, meal) {
  return `
    <a href="recipe.html?name=${encodeURIComponent(meal.name)}&qty=${meal.qty}&cal=${meal.c_cal}&pro=${meal.c_pro}&cost=${meal.c_cost}" target="_blank" class="meal-cell-link">
      <div class="planned-meal-card">
        <div class="planned-meal-type">${title}</div>
        <div class="planned-meal-name"><i class="${meal.icon || 'fa-solid fa-utensils'}"></i> ${meal.name}</div>
        <div class="planned-meal-macros">
          <span>${meal.qty}g</span>
          <span>🔥 ${meal.c_cal} kcal</span>
          <span>🥩 ${meal.c_pro}g pro</span>
        </div>
      </div>
    </a>
  `;
}

// ─── Load UI for the selected day ────────────────────────────
function loadDayUI() {
  const isCompleted = completedDays.includes(currentDay);
  const dayPlan = mealPlan.days.find(d => d.day === currentDay);

  $('dayLabel').innerHTML = `Day ${currentDay} <span style="font-size:0.8em;margin-left:8px">${isCompleted ? 'Completed ✅' : 'Pending ⏳'}</span>`;

  if (!dayPlan) return;

  if (isCompleted) {
    const dayData = allNutritionData.find(d => d.day === currentDay);

    $('activeDayView').style.display = 'none';
    $('completedDayView').style.display = '';

    $('completedDayNum').textContent = currentDay;
    $('sumCalories').textContent = `${dayData.calories} kcal`;
    $('sumProtein').textContent = `${dayData.protein}g`;
    $('sumCarbs').textContent = `${dayData.carbs}g`;
    $('sumFats').textContent = `${dayData.fats}g`;
    $('sumCost').textContent = `₹${dayData.cost || dayPlan.t_cost}`;

    $('completedMealsGrid').innerHTML = `
      ${createMealCard('Breakfast 🍳🥣', dayPlan.breakfast)}
      ${createMealCard('Lunch 🍚🥘', dayPlan.lunch)}
      ${createMealCard('Dinner 🫓🍛', dayPlan.dinner)}
      ${createMealCard('Snacks 🍌🥜', dayPlan.snack)}
    `;

  } else {
    $('activeDayView').style.display = '';
    $('completedDayView').style.display = 'none';

    $('mealsGrid').innerHTML = `
      ${createMealCard('Breakfast 🍳🥣', dayPlan.breakfast)}
      ${createMealCard('Lunch 🍚🥘', dayPlan.lunch)}
      ${createMealCard('Dinner 🫓🍛', dayPlan.dinner)}
      ${createMealCard('Snacks 🍌🥜', dayPlan.snack)}
    `;

    $('autoNutritionBar').innerHTML = `
      <strong>Auto-Calculated Total:</strong> <span style="color:#22c55e;font-size:0.85em;margin-left:10px">Perfect Calories 🎯</span><br>
      🔥 ${dayPlan.t_cal} kcal &nbsp;|&nbsp;
      🥩 ${dayPlan.t_pro}g Protein &nbsp;|&nbsp;
      🌾 ${dayPlan.t_car}g Carbs &nbsp;|&nbsp;
      🥑 ${dayPlan.t_fat}g Fats &nbsp;|&nbsp;
      💰 ₹${dayPlan.t_cost} Cost
    `;

    $('completeDayBtn').disabled = false;
    $('completeDayBtn').textContent = '✅ Complete Day — Mark as Done';
  }

  $('prevDayBtn').disabled = currentDay <= 1;
  const maxNav = completedDays.length > 0 ? Math.max(...completedDays) + 1 : 1;
  $('nextDayBtn').disabled = currentDay >= Math.min(maxNav, mealPlan.totalDays);
}

// ─── Auto-Complete Day ───────────────────────────────────────
$('completeDayBtn').addEventListener('click', async () => {
  $('completeDayBtn').disabled = true;
  $('completeDayBtn').innerHTML = '<span class="spinner"></span> Saving...';

  try {
    const res = await fetch(`${API_BASE}/meals/complete-day`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ day: currentDay })
    });
    const data = await res.json();
    if (res.ok) {
      showToast(`Day ${currentDay} completed automatically! ✅`);
      await loadNutritionData();
    } else {
      showToast(data.message, 'error');
      $('completeDayBtn').disabled = false;
      $('completeDayBtn').textContent = '✅ Complete Day — Mark as Done';
    }
  } catch (err) {
    console.error('Complete day error:', err);
    showToast('Network error. Please try again.', 'error');
    $('completeDayBtn').disabled = false;
    $('completeDayBtn').textContent = '✅ Complete Day — Mark as Done';
  }
});

// ─── Navigation ──────────────────────────────────────────────
$('prevDayBtn').addEventListener('click', () => {
  if (currentDay > 1) { currentDay--; loadDayUI(); }
});
$('nextDayBtn').addEventListener('click', () => {
  const maxNav = completedDays.length > 0 ? Math.max(...completedDays) + 1 : 1;
  if (currentDay < Math.min(maxNav, mealPlan.totalDays)) {
    currentDay++;
    loadDayUI();
  }
});

// ─── Chart (Only Completed Days) ─────────────────────────────
function renderChart() {
  const completed = allNutritionData.filter(d => d.completed).sort((a, b) => a.day - b.day);
  if (completed.length === 0) return;

  const ctx = $('calorieChart').getContext('2d');
  if (chartInstance) chartInstance.destroy();

  const labels = completed.map(d => `Day ${d.day}`);
  const actual = completed.map(d => d.calories);
  const target = completed.map(() => mealPlan.targetCalories);

  // Create a smooth vertical gradient fill below the actual intake line
  let gradient = ctx.createLinearGradient(0, 0, 0, 300);
  gradient.addColorStop(0, 'rgba(34, 197, 94, 0.35)'); // Solid green at top
  gradient.addColorStop(1, 'rgba(34, 197, 94, 0.0)');  // Fade out at bottom

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Actual Intake (kcal)', 
          data: actual,
          borderColor: '#22c55e', 
          backgroundColor: gradient,
          borderWidth: 3,
          fill: true, 
          tension: 0.4, // Smooth, natural curves
          pointBackgroundColor: '#ffffff', 
          pointBorderColor: '#22c55e',
          pointBorderWidth: 2,
          pointRadius: 5, 
          pointHoverRadius: 7
        },
        {
          label: 'Target Calories', 
          data: target,
          borderColor: '#f59e0b', 
          borderDash: [6, 6], 
          borderWidth: 2,
          fill: false, 
          pointRadius: 0,
          tension: 0 // Keep the target line strictly straight
        }
      ]
    },
    options: {
      responsive: true, 
      maintainAspectRatio: false,
      animation: {
        y: { duration: 1200, easing: 'easeOutQuart' },
        x: { duration: 1200, easing: 'easeOutQuart' }
      },
      interaction: {
        mode: 'index',
        intersect: false, // Tooltip shows both actual and target at same time
      },
      plugins: { 
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          titleFont: { size: 14, family: "'Inter', sans-serif", weight: 'bold' },
          bodyFont: { size: 13, family: "'Inter', sans-serif" },
          padding: 12,
          cornerRadius: 8,
          displayColors: true,
          boxPadding: 4
        }
      },
      scales: {
        y: { 
          beginAtZero: false, 
          grid: { color: 'rgba(0,0,0,0.06)', drawBorder: false }
        },
        x: { 
          grid: { display: false, drawBorder: false } 
        }
      }
    }
  });
}

// ─── Init ────────────────────────────────────────────────────
async function init() {
  const hasPlan = await loadMealPlan();
  if (hasPlan) {
    await loadNutritionData();
  }
}

init();
