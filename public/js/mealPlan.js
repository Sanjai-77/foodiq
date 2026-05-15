// mealPlan.js - Meal generation, dashboard, and plan management

// Auth guard
if (!getToken()) { window.location.href = 'index.html'; }

// ─── IFCT Food Database ──────────────────────────────────────
let foodDB = { breakfast: [], lunch: [], dinner: [], snacks: [] };

async function initFoodDB() {
  try {
    const res = await fetch(`${API_BASE}/food/db`, { headers: getHeaders() });
    const data = await res.json();
    if (res.ok && data.foodDB) {
      foodDB = data.foodDB;
    }
  } catch (e) {
    console.error('Error loading FoodDB:', e);
  }
}
initFoodDB();

const replacements = {
  "Whey Protein": { name: "Roasted Chana", icon: "fa-solid fa-seedling", diff: "Replaced Whey Protein with Roasted Chana (saving ₹2380/kg)" },
  "Chicken Breast (Raw)": { name: "Soya Chunks (Dry eq)", icon: "fa-solid fa-seedling", diff: "Replaced Chicken with Soya (saving ₹130/kg)" },
  "Mutton (Raw)": { name: "Chicken Breast (Raw)", icon: "fa-solid fa-drumstick-bite", diff: "Replaced Mutton with Chicken (saving ₹520/kg)" },
  "Almonds": { name: "Peanuts (Raw)", icon: "fa-solid fa-seedling", diff: "Replaced Almonds with Peanuts (saving ₹640/kg)" },
  "Paneer (Raw)": { name: "Toor Dal (Dry eq)", icon: "fa-solid fa-bowl-food", diff: "Replaced Paneer with Toor Dal (saving ₹240/kg)" }
};

let mealPlan = [];
let overwritePlan = false;

// ─── CHECK EXISTING PLAN ON LOAD ──────────────────────────────
async function checkExistingPlan() {
  try {
    const res = await fetch(`${API_BASE}/meals/get`, { headers: getHeaders() });
    const data = await res.json();
    if (res.ok && data.plan && data.plan.days && data.plan.days.length > 0) {
      $('userConfigCard').style.display = 'none';
      $('existingPlanBanner').style.display = 'block';

      mealPlan = data.plan.days;

      $('statBudget').textContent = `₹${Math.round(data.plan.dailyBudget * 30).toLocaleString()}`;
      $('statCalories').textContent = data.plan.targetCalories.toLocaleString();
      $('statGoal').innerHTML = `Active Plan<br><span style="font-size:0.75em;color:#f59e0b">Data Loaded</span>`;

      $('statsSection').style.display = 'block';
      $('sectionMealPlan').style.display = 'block';
      $('sectionAlternatives').style.display = 'block';
      renderWeek(1);
    }
    await loadUserProfile(); // Load profile to pre-fill the form for regeneration
  } catch (e) {
    console.error('Error checking plan:', e);
  }
}

// ─── LOAD USER PROFILE TO PRE-FILL FORM ───────────────────────
async function loadUserProfile() {
  try {
    const res = await fetch(`${API_BASE}/profile/me`, { headers: getHeaders() });
    const data = await res.json();
    if (res.ok && data.user && data.user.profile) {
      const p = data.user.profile;
      if (p.age) $('ageInput').value = p.age;
      if (p.height) $('heightInput').value = p.height;
      if (p.weight) $('weightInput').value = p.weight;
      if (p.budget) $('budgetInput').value = p.budget;
      
      const setSelect = (id, val) => {
        if (!val) return;
        const input = $(id);
        const wrapper = input.closest('.custom-select');
        if (!wrapper) return;
        const option = wrapper.querySelector(`.cs-option[data-value="${val}"]`);
        const text = wrapper.querySelector('.cs-text');
        if (option && text) {
          input.value = val;
          text.innerHTML = option.innerHTML;
        }
      };
      
      setSelect('genderSelect', p.gender);
      setSelect('activitySelect', p.activity);
      setSelect('goalSelect', p.goal);
      setSelect('dietSelect', p.diet);
      
      calculateTarget();
    }
  } catch (e) {
    console.error('Error loading profile:', e);
  }
}

window.regeneratePlanPrompt = function () {
  if (confirm('Are you sure? This will permanently delete your current 30-day plan and reset all nutrition tracking.')) {
    overwritePlan = true;
    $('existingPlanBanner').style.display = 'none';
    $('userConfigCard').style.display = 'block';
    $('statsSection').style.display = 'none';
    $('sectionMealPlan').style.display = 'none';
    $('sectionAlternatives').style.display = 'none';
    mealPlan = [];
  }
};

checkExistingPlan();

// ─── BMR / Target Calculator ─────────────────────────────────
function calculateTarget() {
  const age = parseInt($('ageInput').value);
  const gender = $('genderSelect').value;
  const height = parseInt($('heightInput').value);
  const weight = parseInt($('weightInput').value);
  const activity = $('activitySelect').value;
  const goal = $('goalSelect').value;
  const budget = parseInt($('budgetInput').value);

  if (!age || !gender || !height || !weight || !activity || !goal || !budget) {
    $('bmrValue').textContent = '—';
    $('tdeeValue').textContent = '—';
    $('targetCalValue').textContent = '—';
    $('dailyBudgetValue').textContent = '—';
    return null;
  }

  const bmr = calculateBMR(age, gender, weight, height);
  let mul = 1.55;
  if (activity === 'low') mul = 1.2;
  if (activity === 'high') mul = 1.725;
  const tdee = bmr * mul;
  let targetCal = tdee;
  let targetProtein = weight * 1.5;
  if (goal === 'weight-loss') { targetCal -= 500; targetProtein = weight * 1.8; }
  else if (goal === 'muscle-gain') { targetCal += 500; targetProtein = weight * 2.2; }
  const targetCarbs = Math.round((targetCal * 0.45) / 4);
  const targetFats = Math.round((targetCal * 0.25) / 9);

  const animateUpdate = (id, val) => {
    const el = $(id);
    if (el.textContent !== val) {
      el.textContent = val;
      el.classList.remove('value-updating');
      void el.offsetWidth;
      el.classList.add('value-updating');
    }
  };

  animateUpdate('bmrValue', `${Math.round(bmr)} kcal`);
  animateUpdate('tdeeValue', `${Math.round(tdee)} kcal`);
  animateUpdate('targetCalValue', `${Math.round(targetCal)} kcal`);
  animateUpdate('dailyBudgetValue', `₹${Math.round(budget / 30)}`);

  return {
    targetCal: Math.round(targetCal), targetProtein: Math.round(targetProtein),
    targetCarbs, targetFats, dailyBudget: budget / 30, goal, diet: $('dietSelect').value,
    age, gender, height, weight, activity, budget
  };
}

['ageInput', 'heightInput', 'weightInput', 'budgetInput'].forEach(id => {
  $(id).addEventListener('input', calculateTarget);
});

// Custom select dropdowns
document.querySelectorAll('.custom-select').forEach(cs => {
  const selected = cs.querySelector('.cs-selected');
  const text = cs.querySelector('.cs-text');
  const input = cs.querySelector('input[type="hidden"]');
  const options = cs.querySelectorAll('.cs-option');

  if (selected) {
    selected.addEventListener('click', (e) => {
      e.stopPropagation();
      document.querySelectorAll('.custom-select').forEach(c => c !== cs && c.classList.remove('active'));
      cs.classList.toggle('active');
    });
  }

  options.forEach(opt => {
    opt.addEventListener('click', (e) => {
      e.stopPropagation();
      if (text) text.innerHTML = opt.innerHTML;
      if (input) input.value = opt.dataset.value;
      cs.classList.remove('active');
      calculateTarget();
    });
  });
});

document.addEventListener('click', () => {
  document.querySelectorAll('.custom-select.active').forEach(c => c.classList.remove('active'));
});

calculateTarget();

// ─── Helpers ─────────────────────────────────────────────────
function filterDiet(db, diet) {
  return diet === 'veg' ? db.filter(i => i.type === 'veg') : db;
}

function pickNoRepeat(db, prevName) {
  const filtered = db.filter(item => item.name !== prevName);
  if (filtered.length === 0) return db[Math.floor(Math.random() * db.length)];
  return filtered[Math.floor(Math.random() * filtered.length)];
}

// ─── Save profile + meal plan to MongoDB ─────────────────────
async function saveToMongoDB(cfg) {
  try {
    await fetch(`${API_BASE}/profile/save`, {
      method: 'POST', headers: getHeaders(),
      body: JSON.stringify({
        age: cfg.age, gender: cfg.gender, height: cfg.height, weight: cfg.weight,
        activity: cfg.activity, goal: cfg.goal, budget: cfg.budget, diet: cfg.diet,
        targetCalories: cfg.targetCal, targetProtein: cfg.targetProtein,
        targetCarbs: cfg.targetCarbs, targetFats: cfg.targetFats
      })
    });
  } catch (e) { console.error('Profile save error:', e); }

  try {
    const res = await fetch(`${API_BASE}/meals/save`, {
      method: 'POST', headers: getHeaders(),
      body: JSON.stringify({
        days: mealPlan, totalDays: mealPlan.length,
        targetCalories: cfg.targetCal, targetProtein: cfg.targetProtein,
        targetCarbs: cfg.targetCarbs, targetFats: cfg.targetFats,
        dailyBudget: cfg.dailyBudget, overwrite: overwritePlan
      })
    });
    const data = await res.json();
    if (res.ok) {
      showToast(`Meal plan saved to MongoDB! (${data.totalDays} days)`, 'info');
    }
  } catch (e) { console.error('Meal plan save error:', e); }
}

// ─── Hardcoded Fallback Dataset (emergency only) ─────────────
const FALLBACK_DB = {
  breakfast: [
    { name: "Wheat Paratha (Atta)", kcal: 341, protein: 12.1, carbs: 69.4, fat: 1.7, price_per_kg: 35, type: "veg", icon: "fa-solid fa-bread-slice" },
    { name: "Rice Porridge (Kanji)", kcal: 350, protein: 6.8, carbs: 78, fat: 0.5, price_per_kg: 40, type: "veg", icon: "fa-solid fa-bowl-rice" },
    { name: "Upma (Semolina)", kcal: 360, protein: 10.4, carbs: 73, fat: 1, price_per_kg: 45, type: "veg", icon: "fa-solid fa-bowl-food" }
  ],
  lunch: [
    { name: "Wheat Roti + Potato Sabzi", kcal: 320, protein: 8, carbs: 62, fat: 5, price_per_kg: 30, type: "veg", icon: "fa-solid fa-bread-slice" },
    { name: "Rice + Dal (Khichdi)", kcal: 350, protein: 12, carbs: 65, fat: 3, price_per_kg: 50, type: "veg", icon: "fa-solid fa-bowl-rice" },
    { name: "Rice + Sambar", kcal: 340, protein: 10, carbs: 68, fat: 2.5, price_per_kg: 50, type: "veg", icon: "fa-solid fa-bowl-food" }
  ],
  dinner: [
    { name: "Potato Curry + Roti", kcal: 300, protein: 6, carbs: 58, fat: 5, price_per_kg: 30, type: "veg", icon: "fa-solid fa-bread-slice" },
    { name: "Dal + Rice", kcal: 340, protein: 14, carbs: 62, fat: 2.5, price_per_kg: 50, type: "veg", icon: "fa-solid fa-bowl-food" },
    { name: "Roti + Mixed Veg", kcal: 280, protein: 8, carbs: 50, fat: 5, price_per_kg: 35, type: "veg", icon: "fa-solid fa-leaf" }
  ],
  snacks: [
    { name: "Banana", kcal: 89, protein: 1.1, carbs: 22.8, fat: 0.3, price_per_kg: 40, type: "veg", icon: "fa-solid fa-apple-whole" },
    { name: "Murmura (Puffed Rice)", kcal: 325, protein: 5.5, carbs: 77, fat: 0.5, price_per_kg: 50, type: "veg", icon: "fa-solid fa-bowl-rice" },
    { name: "Roasted Chana", kcal: 369, protein: 22.5, carbs: 58.1, fat: 5.2, price_per_kg: 100, type: "veg", icon: "fa-solid fa-seedling" }
  ]
};

// ─── Sort foods by kcal-per-rupee efficiency ─────────────────
function sortByEfficiency(arr) {
  return [...arr].sort((a, b) => (b.kcal / b.price_per_kg) - (a.kcal / a.price_per_kg));
}

// ─── Pick a budget-aware food item ───────────────────────────
function pickBudgetAware(db, prevName, isLowBudget) {
  if (isLowBudget) {
    // For low budgets: pick from top 3 cheapest items (with variety)
    const sorted = sortByEfficiency(db);
    const topN = sorted.slice(0, Math.min(3, sorted.length));
    const filtered = topN.filter(item => item.name !== prevName);
    if (filtered.length > 0) return filtered[Math.floor(Math.random() * filtered.length)];
    return topN[Math.floor(Math.random() * topN.length)];
  }
  return pickNoRepeat(db, prevName);
}

// ─── Generate 30-Day Plan (NEVER FAILS) ──────────────────────
async function generatePlan() {
  const cfg = calculateTarget();
  if (!cfg) { showToast('Please fill all fields first', 'error'); return; }

  if (!cfg.weight) cfg.weight = 70;
  if (!cfg.height) cfg.height = 170;
  if (!cfg.budget) cfg.budget = 5000;
  console.log("📋 User Input:", JSON.stringify(cfg));

  let activeDB = foodDB;
  if (!foodDB || !foodDB.breakfast.length || !foodDB.lunch.length || !foodDB.dinner.length || !foodDB.snacks.length) {
    console.warn("⚠️ Food dataset not loaded from server, using fallback dataset...");
    activeDB = FALLBACK_DB;
    showToast('⚠️ Using offline food data — generating best possible plan', 'info');
  }

  const { targetCal, targetProtein, dailyBudget, diet } = cfg;
  const isLowBudget = dailyBudget < 50; // ₹1500/month or less

  let budgetModeStr = '';
  if (dailyBudget < 25) { budgetModeStr = 'Ultra Budget Mode 💸'; }
  else if (dailyBudget < 100) { budgetModeStr = 'Low Budget Mode 💸'; }
  else if (dailyBudget < 250) { budgetModeStr = 'Balanced Mode ⚖️'; }
  else { budgetModeStr = 'High Nutrition Mode 🍗'; }

  $('statBudget').textContent = `₹${Math.round(dailyBudget * 30).toLocaleString()}`;
  $('statCalories').textContent = targetCal.toLocaleString();

  let goalText = 'Fitness';
  const goalEl = $('goalSelect');
  if (goalEl && goalEl.options && goalEl.selectedIndex >= 0) {
    goalText = goalEl.options[goalEl.selectedIndex].text.replace(/[^A-Za-z ]/g, '').trim();
  } else if (goalEl) {
    goalText = cfg.goal.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
  $('statGoal').innerHTML = `${goalText}<br><span style="font-size:0.75em;color:#f59e0b">${budgetModeStr}</span>`;

  mealPlan = [];
  let budgetAltsUsed = [];

  // For low budgets, filter by price; for others, allow all
  const maxPriceFilter = isLowBudget ? 150 : Infinity;
  const safeFilter = (dbArr) => {
    let filtered = filterDiet(dbArr, diet).filter(i => i.price_per_kg <= maxPriceFilter);
    if (!filtered.length) { filtered = filterDiet(dbArr, diet); }
    if (!filtered.length) { filtered = dbArr; }
    return filtered;
  };

  const bDB = safeFilter(activeDB.breakfast);
  const lDB = safeFilter(activeDB.lunch);
  const dDB = safeFilter(activeDB.dinner);
  const sDB = safeFilter(activeDB.snacks);

  console.log("🍽️ Filtered Foods — B:", bDB.length, "L:", lDB.length, "D:", dDB.length, "S:", sDB.length);

  // Calorie split: breakfast 25%, lunch 35%, dinner 25%, snack 15%
  const calSplit = { b: 0.25, l: 0.35, d: 0.25, s: 0.15 };
  let prevB = '', prevL = '', prevD = '', prevS = '';

  for (let d = 1; d <= 30; d++) {
    let b = { ...pickBudgetAware(bDB, prevB, isLowBudget) };
    let l = { ...pickBudgetAware(lDB, prevL, isLowBudget) };
    let din = { ...pickBudgetAware(dDB, prevD, isLowBudget) };
    let s = { ...pickBudgetAware(sDB, prevS, isLowBudget) };
    prevB = b.name; prevL = l.name; prevD = din.name; prevS = s.name;

    // Step 1: Calculate ideal portions based on calorie targets
    b.qty = Math.round(((targetCal * calSplit.b) / b.kcal) * 100);
    l.qty = Math.round(((targetCal * calSplit.l) / l.kcal) * 100);
    din.qty = Math.round(((targetCal * calSplit.d) / din.kcal) * 100);
    s.qty = Math.round(((targetCal * calSplit.s) / s.kcal) * 100);

    // Step 2: Calculate total cost at ideal portions
    let dayCost = [b, l, din, s].reduce((sum, m) => sum + (m.price_per_kg * m.qty / 1000), 0);

    // Step 3: If over budget, scale portions down proportionally to fit budget
    if (dayCost > dailyBudget && dailyBudget > 0) {
      // First try swapping to cheapest items in each category
      const getCheapest = (db, meal) => {
        const sorted = sortByEfficiency(db);
        if (sorted[0] && sorted[0].price_per_kg < meal.price_per_kg) {
          budgetAltsUsed.push(`Swapped ${meal.name} → ${sorted[0].name} (better value)`);
          return { ...sorted[0] };
        }
        return meal;
      };
      b = getCheapest(bDB, b);
      l = getCheapest(lDB, l);
      din = getCheapest(dDB, din);
      s = getCheapest(sDB, s);

      // Recalculate portions for new items
      b.qty = Math.round(((targetCal * calSplit.b) / b.kcal) * 100);
      l.qty = Math.round(((targetCal * calSplit.l) / l.kcal) * 100);
      din.qty = Math.round(((targetCal * calSplit.d) / din.kcal) * 100);
      s.qty = Math.round(((targetCal * calSplit.s) / s.kcal) * 100);

      // Recalculate cost
      dayCost = [b, l, din, s].reduce((sum, m) => sum + (m.price_per_kg * m.qty / 1000), 0);

      // If still over budget, scale all portions down to fit, 
      // BUT never compromise calories below 90% of target (prevent starvation).
      if (dayCost > dailyBudget) {
        const scale = dailyBudget / dayCost;
        if (scale >= 0.9) {
          b.qty = Math.max(30, Math.round(b.qty * scale));
          l.qty = Math.max(40, Math.round(l.qty * scale));
          din.qty = Math.max(30, Math.round(din.qty * scale));
          s.qty = Math.max(20, Math.round(s.qty * scale));
        } else {
          const warnMsg = "Budget too low to maintain calories! Showing absolute cheapest possible meals.";
          if (!budgetAltsUsed.includes(warnMsg)) {
            budgetAltsUsed.push(warnMsg);
          }
        }
      }
    }

    // Step 4: Compute final nutrition values
    const mv = m => ({
      ...m,
      c_cal: Math.round(m.kcal * m.qty / 100),
      c_pro: Math.round(m.protein * m.qty / 100),
      c_car: Math.round(m.carbs * m.qty / 100),
      c_fat: Math.round(m.fat * m.qty / 100),
      c_cost: Math.round(m.price_per_kg * m.qty / 1000)
    });
    const dm = { day: d, breakfast: mv(b), lunch: mv(l), dinner: mv(din), snack: mv(s), completed: false };
    dm.t_cal = dm.breakfast.c_cal + dm.lunch.c_cal + dm.dinner.c_cal + dm.snack.c_cal;
    dm.t_cost = dm.breakfast.c_cost + dm.lunch.c_cost + dm.dinner.c_cost + dm.snack.c_cost;
    dm.t_pro = dm.breakfast.c_pro + dm.lunch.c_pro + dm.dinner.c_pro + dm.snack.c_pro;
    dm.t_car = dm.breakfast.c_car + dm.lunch.c_car + dm.dinner.c_car + dm.snack.c_car;
    dm.t_fat = dm.breakfast.c_fat + dm.lunch.c_fat + dm.dinner.c_fat + dm.snack.c_fat;
    mealPlan.push(dm);
  }

  if (!mealPlan || mealPlan.length === 0) {
    console.error("⚠️ Plan generation produced 0 days — building emergency fallback...");
    mealPlan = generateFallbackPlan(cfg);
  }

  console.log("✅ Generated Plan:", mealPlan.length, "days");
  if (isLowBudget) {
    const avgCost = Math.round(mealPlan.reduce((s, d) => s + d.t_cost, 0) / mealPlan.length);
    const avgCal = Math.round(mealPlan.reduce((s, d) => s + d.t_cal, 0) / mealPlan.length);
    console.log(`💰 Avg daily cost: ₹${avgCost}, Avg daily cal: ${avgCal}`);
  }

  await saveToMongoDB(cfg);
  renderWeek(1);
  renderAlternatives([...new Set(budgetAltsUsed)]);
  ['statsSection', 'sectionMealPlan', 'sectionAlternatives'].forEach(id => { $(id).style.display = ''; });
  setTimeout(() => $('statsSection').scrollIntoView({ behavior: 'smooth' }), 200);
  showToast(budgetAltsUsed.length ? 'Plan generated with budget alternatives!' : '30-day meal plan generated!', budgetAltsUsed.length ? 'info' : 'success');
}

// ─── Emergency Fallback Plan (absolute last resort) ──────────
function generateFallbackPlan(cfg) {
  const tc = cfg.targetCal || 2000;
  const fb = FALLBACK_DB;
  const plan = [];
  for (let d = 1; d <= 30; d++) {
    const pick = arr => arr[d % arr.length];
    let b = { ...pick(fb.breakfast) }, l = { ...pick(fb.lunch) }, din = { ...pick(fb.dinner) }, s = { ...pick(fb.snacks) };
    b.qty = Math.round(((tc * 0.25) / b.kcal) * 100);
    l.qty = Math.round(((tc * 0.35) / l.kcal) * 100);
    din.qty = Math.round(((tc * 0.25) / din.kcal) * 100);
    s.qty = Math.round(((tc * 0.15) / s.kcal) * 100);
    const mv = m => ({ ...m, c_cal: Math.round(m.kcal * m.qty / 100), c_pro: Math.round(m.protein * m.qty / 100), c_car: Math.round(m.carbs * m.qty / 100), c_fat: Math.round(m.fat * m.qty / 100), c_cost: Math.round(m.price_per_kg * m.qty / 1000) });
    const dm = { day: d, breakfast: mv(b), lunch: mv(l), dinner: mv(din), snack: mv(s), completed: false };
    dm.t_cal = dm.breakfast.c_cal + dm.lunch.c_cal + dm.dinner.c_cal + dm.snack.c_cal;
    dm.t_cost = dm.breakfast.c_cost + dm.lunch.c_cost + dm.dinner.c_cost + dm.snack.c_cost;
    dm.t_pro = dm.breakfast.c_pro + dm.lunch.c_pro + dm.dinner.c_pro + dm.snack.c_pro;
    dm.t_car = dm.breakfast.c_car + dm.lunch.c_car + dm.dinner.c_car + dm.snack.c_car;
    dm.t_fat = dm.breakfast.c_fat + dm.lunch.c_fat + dm.dinner.c_fat + dm.snack.c_fat;
    plan.push(dm);
  }
  return plan;
}

// ─── Generate Button ─────────────────────────────────────────
$('generateBtn').addEventListener('click', async () => {
  const cfg = calculateTarget();
  if (!cfg) return showToast('Please fill all fields first', 'error');

  const overlay = $('fullScreenLoader');
  if (overlay) {
    overlay.style.display = 'flex';
    const title = $('loaderTitle');
    const subtitle = $('loaderSubtitle');
    const spinner = $('loaderSpinner');
    if (title) title.textContent = '⚡ Creating your personalized plan...';
    if (subtitle) subtitle.style.display = 'block';
    if (spinner) spinner.style.display = 'block';
    requestAnimationFrame(() => overlay.classList.add('active'));
  }

  try {
    await generatePlan();
    if (overlay) {
      const title = $('loaderTitle');
      const subtitle = $('loaderSubtitle');
      const spinner = $('loaderSpinner');
      if (title) title.textContent = '🎉 Your 30-day meal plan is ready!';
      if (subtitle) subtitle.style.display = 'none';
      if (spinner) spinner.style.display = 'none';
      setTimeout(() => {
        overlay.classList.remove('active');
        setTimeout(() => { overlay.style.display = 'none'; $('statsSection').scrollIntoView({ behavior: 'smooth' }); }, 300);
      }, 800);
    }
  } catch (err) {
    console.error('Meal generation error:', err);
    // Try fallback instead of giving up
    if (!mealPlan || mealPlan.length === 0) {
      const cfg = calculateTarget();
      mealPlan = generateFallbackPlan(cfg || { targetCal: 2000 });
      renderWeek(1);
      renderAlternatives([]);
      ['statsSection', 'sectionMealPlan', 'sectionAlternatives'].forEach(id => { $(id).style.display = ''; });
      showToast('⚠️ Adjusted plan generated — showing best possible result', 'info');
    } else {
      showToast('⚠️ Plan generated with adjustments', 'info');
    }
    if (overlay) { overlay.classList.remove('active'); setTimeout(() => overlay.style.display = 'none', 300); }
  }
});

// ─── Render Helpers ──────────────────────────────────────────
function formatCell(m, day, type) {
  return `
    <div style="position: relative;">
      <a href="recipe.html?name=${encodeURIComponent(m.name)}&qty=${m.qty}&cal=${m.c_cal}&pro=${m.c_pro}&cost=${m.c_cost}" target="_blank" class="meal-cell-link" style="display:block; width: 100%;">
        <div class="meal-cell" style="padding-right: 30px;">
          <div class="meal-cell-name"><i class="${m.icon}"></i> ${m.name}</div>
          <div class="meal-cell-detail">${m.qty}g • ${m.c_cal} kcal • ₹${m.c_cost}</div>
        </div>
      </a>
      <button onclick="regenerateSingleMeal(${day}, '${type}')" title="Swap Meal" style="position: absolute; top: 8px; right: 8px; background: rgba(0,0,0,0.05); border: none; border-radius: 50%; width: 26px; height: 26px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--gray-500); transition: 0.2s;" onmouseover="this.style.background='rgba(0,0,0,0.1)'; this.style.color='var(--primary-600)'" onmouseout="this.style.background='rgba(0,0,0,0.05)'; this.style.color='var(--gray-500)'"><i class="fa-solid fa-arrows-rotate" style="font-size: 12px;"></i></button>
    </div>`;
}

function renderWeek(week) {
  const start = (week - 1) * 7, end = Math.min(start + 7, 30), tbody = $('mealTableBody');
  tbody.innerHTML = '';
  for (let i = start; i < end; i++) {
    const m = mealPlan[i]; const tr = document.createElement('tr');
    tr.innerHTML = `<td><strong>Day ${m.day}</strong></td>
      <td>${formatCell(m.breakfast, m.day, 'breakfast')}</td>
      <td>${formatCell(m.lunch, m.day, 'lunch')}</td>
      <td>${formatCell(m.dinner, m.day, 'dinner')}</td>
      <td>${formatCell(m.snack, m.day, 'snack')}</td>
      <td><span class="tag tag-protein">${m.t_cal} kcal</span></td>
      <td><span class="tag tag-budget">₹${m.t_cost}</span></td>`;
    tbody.appendChild(tr);
  }
  document.querySelectorAll('.week-btn').forEach(b => b.classList.toggle('active', parseInt(b.dataset.week) === week));
}

window.regenerateSingleMeal = async function(day, type) {
  const mealIndex = mealPlan.findIndex(m => m.day === day);
  if (mealIndex === -1) return;
  const dm = mealPlan[mealIndex];
  const cfg = calculateTarget() || { targetCal: 2000, dailyBudget: 5000, diet: 'veg' };
  
  const isLowBudget = cfg.dailyBudget < 50;
  const calSplit = { 'breakfast': 0.25, 'lunch': 0.35, 'dinner': 0.25, 'snack': 0.15 };
  const dbKey = type === 'snack' ? 'snacks' : type;
  
  let dbArr = (foodDB && foodDB[dbKey] && foodDB[dbKey].length) ? foodDB[dbKey] : FALLBACK_DB[dbKey];
  // Re-apply diet filter locally
  dbArr = filterDiet(dbArr, cfg.diet);
  if (!dbArr.length) dbArr = (foodDB && foodDB[dbKey]) ? foodDB[dbKey] : FALLBACK_DB[dbKey];
  
  let newFood = { ...pickBudgetAware(dbArr, dm[type].name, isLowBudget) };
  newFood.qty = Math.round(((cfg.targetCal * calSplit[type]) / newFood.kcal) * 100);
  
  // Scale down if extremely low budget (anti-starvation logic)
  const maxCostForMeal = cfg.dailyBudget > 0 ? (cfg.dailyBudget * calSplit[type]) : Infinity;
  const newCost = (newFood.price_per_kg * newFood.qty) / 1000;
  if (newCost > maxCostForMeal && cfg.dailyBudget > 0) {
    const scale = maxCostForMeal / newCost;
    if (scale >= 0.9) {
      newFood.qty = Math.max(20, Math.round(newFood.qty * scale));
    }
  }
  
  const mv = m => ({
    ...m,
    c_cal: Math.round(m.kcal * m.qty / 100),
    c_pro: Math.round(m.protein * m.qty / 100),
    c_car: Math.round(m.carbs * m.qty / 100),
    c_fat: Math.round(m.fat * m.qty / 100),
    c_cost: Math.round(m.price_per_kg * m.qty / 1000)
  });
  
  dm[type] = mv(newFood);
  dm.t_cal = dm.breakfast.c_cal + dm.lunch.c_cal + dm.dinner.c_cal + dm.snack.c_cal;
  dm.t_cost = dm.breakfast.c_cost + dm.lunch.c_cost + dm.dinner.c_cost + dm.snack.c_cost;
  dm.t_pro = dm.breakfast.c_pro + dm.lunch.c_pro + dm.dinner.c_pro + dm.snack.c_pro;
  dm.t_car = dm.breakfast.c_car + dm.lunch.c_car + dm.dinner.c_car + dm.snack.c_car;
  dm.t_fat = dm.breakfast.c_fat + dm.lunch.c_fat + dm.dinner.c_fat + dm.snack.c_fat;
  
  renderWeek(Math.ceil(day / 7));
  showToast(`Swapped ${type} for Day ${day}!`, 'success');
  
  // Save changes silently
  overwritePlan = true;
  await saveToMongoDB(cfg);
};

$('weekNav').addEventListener('click', e => {
  if (e.target.classList.contains('week-btn')) renderWeek(parseInt(e.target.dataset.week));
});

function renderAlternatives(usedAlts) {
  const grid = $('altMealsGrid');
  const fallback = [
    { name: "Soya Chunks", icon: "fa-solid fa-seedling", diff: "Highly recommended cheap protein (₹15/100g = 52g protein)" },
    { name: "Roasted Chana", icon: "fa-solid fa-seedling", diff: "Best budget snack (₹10/100g)" },
    { name: "Eggs", icon: "fa-solid fa-egg", diff: "Cheapest bioavailable protein for non-vegetarians." }
  ];
  let items = usedAlts.map(a => {
    const k = Object.keys(replacements).find(k => replacements[k].diff === a);
    return k ? { name: replacements[k].name, icon: replacements[k].icon, diff: a } : null;
  }).filter(Boolean);
  if (!items.length) items = fallback;
  grid.innerHTML = items.map(m => `<div class="alt-meal-card"><div class="alt-meal-emoji"><i class="${m.icon}"></i></div><div class="alt-meal-name">${m.name}</div><div class="alt-meal-desc">${m.diff}</div></div>`).join('');
}
