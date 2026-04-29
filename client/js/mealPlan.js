// Auth guard
const token = localStorage.getItem('nutriguide_token');
const user = JSON.parse(localStorage.getItem('nutriguide_user') || '{}');
if (!token) { window.location.href = '/pages/index.html'; }

` }; }

if (user.name) $('userAvatar').textContent = user.name.charAt(0).toUpperCase();

`;
  t.innerHTML = `<span>${type==='success'?'✅':type==='error'?'❌':'ℹ️'}</span><span>${msg}</span>`;
  c.appendChild(t);
  setTimeout(() => { t.classList.add('removing'); setTimeout(() => t.remove(), 300); }, 3000);
}

  localStorage.removeItem('nutriguide_user');
  window.location.href = '/pages/index.html';
});

// ─── IFCT Food Database ──────────────────────────────────────
let foodDB = { breakfast: [], lunch: [], dinner: [], snacks: [] };

async function initFoodDB() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/food/db`, { headers: getHeaders() });
    const data = await res.json();
    if (res.ok && data.foodDB) {
      foodDB = data.foodDB;
    }
  } catch(e) {
    console.error("Error loading FoodDB", e);
  }
}
initFoodDB();

const replacements = {
  "Whey Protein":{name:"Roasted Chana",icon:"fa-solid fa-seedling",diff:"Replaced Whey Protein with Roasted Chana (saving ₹2380/kg)"},
  "Chicken Breast (Raw)":{name:"Soya Chunks (Dry eq)",icon:"fa-solid fa-seedling",diff:"Replaced Chicken with Soya (saving ₹130/kg)"},
  "Mutton (Raw)":{name:"Chicken Breast (Raw)",icon:"fa-solid fa-drumstick-bite",diff:"Replaced Mutton with Chicken (saving ₹520/kg)"},
  "Almonds":{name:"Peanuts (Raw)",icon:"fa-solid fa-seedling",diff:"Replaced Almonds with Peanuts (saving ₹640/kg)"},
  "Paneer (Raw)":{name:"Toor Dal (Dry eq)",icon:"fa-solid fa-bowl-food",diff:"Replaced Paneer with Toor Dal (saving ₹240/kg)"}
};

let mealPlan = [];
let overwritePlan = false;

// ─── CHECK EXISTING PLAN ON LOAD ──────────────────────────────
async function checkExistingPlan() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/meals/get`, { headers: getHeaders() });
    const data = await res.json();
    if (res.ok && data.plan && data.plan.days && data.plan.days.length > 0) {
      // Plan exists!
      $('userConfigCard').style.display = 'none';
      $('existingPlanBanner').style.display = 'block';
      
      mealPlan = data.plan.days;
      
      // Update stats based on plan target
      $('statBudget').textContent = `₹${Math.round(data.plan.dailyBudget * 30).toLocaleString()}`;
      $('statCalories').textContent = data.plan.targetCalories.toLocaleString();
      $('statGoal').innerHTML = `Active Plan<br><span style="font-size:0.75em;color:#f59e0b">Data Loaded</span>`;
      
      // Show meal plan grid instantly
      $('statsSection').style.display = 'block';
      $('sectionMealPlan').style.display = 'block';
      $('sectionAlternatives').style.display = 'block';
      renderWeek(1);
    }
  } catch(e) {
    console.error("Error checking plan:", e);
  }
}
window.regeneratePlanPrompt = function() {
  if(confirm("Are you sure? This will permanently delete your current 30-day plan and reset all nutrition tracking.")) {
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


function calculateTarget() {
  const age=parseInt($('ageInput').value), gender=$('genderSelect').value, height=parseInt($('heightInput').value);
  const weight=parseInt($('weightInput').value), activity=$('activitySelect').value, goal=$('goalSelect').value;
  const budget=parseInt($('budgetInput').value);
  
  if(!age || !gender || !height || !weight || !activity || !goal || !budget) {
    $('bmrValue').textContent='—';
    $('tdeeValue').textContent='—';
    $('targetCalValue').textContent='—';
    $('dailyBudgetValue').textContent='—';
    return null;
  }

  const bmr=calculateBMR(age,gender,weight,height);
  let mul=1.55; if(activity==='low')mul=1.2; if(activity==='high')mul=1.725;
  const tdee=bmr*mul; let targetCal=tdee, targetProtein=weight*1.5;
  if(goal==='weight-loss'){targetCal-=500;targetProtein=weight*1.8;}
  else if(goal==='muscle-gain'){targetCal+=500;targetProtein=weight*2.2;}
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
  animateUpdate('dailyBudgetValue', `₹${Math.round(budget/30)}`);
  
  return {targetCal:Math.round(targetCal),targetProtein:Math.round(targetProtein),targetCarbs,targetFats,dailyBudget:budget/30,goal,diet:$('dietSelect').value,
    age,gender,height,weight,activity,budget};
}

['ageInput','heightInput','weightInput','budgetInput'].forEach(id=>{
  $(id).addEventListener('input',calculateTarget);
});

document.querySelectorAll('.custom-select').forEach(cs => {
  const selected = cs.querySelector('.cs-selected');
  const text = cs.querySelector('.cs-text');
  const input = cs.querySelector('input[type="hidden"]');
  const options = cs.querySelectorAll('.cs-option');

  selected.addEventListener('click', (e) => {
    e.stopPropagation();
    document.querySelectorAll('.custom-select').forEach(c => c !== cs && c.classList.remove('active'));
    cs.classList.toggle('active');
  });

  options.forEach(opt => {
    opt.addEventListener('click', (e) => {
      e.stopPropagation();
      text.innerHTML = opt.innerHTML;
      input.value = opt.dataset.value;
      cs.classList.remove('active');
      calculateTarget();
    });
  });
});
document.addEventListener('click', () => {
  document.querySelectorAll('.custom-select.active').forEach(c => c.classList.remove('active'));
});

calculateTarget();

function filterDiet(db,diet){return diet==='veg'?db.filter(i=>i.type==='veg'):db;}

// ─── SMART MEAL VARIATION: Pick item avoiding consecutive repeats ─
function pickNoRepeat(db, prevName) {
  const filtered = db.filter(item => item.name !== prevName);
  if (filtered.length === 0) return db[Math.floor(Math.random() * db.length)];
  return filtered[Math.floor(Math.random() * filtered.length)];
}

// ─── Save profile + meal plan to MongoDB ─────────────────────
async function saveToMongoDB(cfg) {
  // Save profile
  try {
    await fetch(`${API_BASE_URL}/api/profile/save`, {
      method: 'POST', headers: getHeaders(),
      body: JSON.stringify({
        age: cfg.age, gender: cfg.gender, height: cfg.height, weight: cfg.weight,
        activity: cfg.activity, goal: cfg.goal, budget: cfg.budget, diet: cfg.diet,
        targetCalories: cfg.targetCal, targetProtein: cfg.targetProtein,
        targetCarbs: cfg.targetCarbs, targetFats: cfg.targetFats
      })
    });
  } catch(e) { console.error('Profile save error:', e); }

  // Save meal plan
  try {
    const res = await fetch(`${API_BASE_URL}/api/meals/save`, {
      method: 'POST', headers: getHeaders(),
      body: JSON.stringify({
        days: mealPlan,
        totalDays: mealPlan.length,
        targetCalories: cfg.targetCal,
        targetProtein: cfg.targetProtein,
        targetCarbs: cfg.targetCarbs,
        targetFats: cfg.targetFats,
        dailyBudget: cfg.dailyBudget,
        overwrite: overwritePlan
      })
    });
    const data = await res.json();
    if (res.ok) {
      showToast(`Meal plan saved to MongoDB! (${data.totalDays} days)`, 'info');
    }
  } catch(e) { console.error('Meal plan save error:', e); }
}

async function generatePlan(){
  const cfg=calculateTarget();
  if (!cfg) return showToast('Please fill all fields first', 'error');

  if (!cfg.weight || !cfg.height || !cfg.budget) {
    throw new Error("Invalid input data");
  }

  if (!foodDB || !foodDB.breakfast.length || !foodDB.lunch.length || !foodDB.dinner.length || !foodDB.snacks.length) {
    throw new Error("Food dataset not available");
  }

  const{targetCal,targetProtein,dailyBudget,diet}=cfg;

  // Calculate theoretical minimum meal cost
  let minCostPerKcal = Infinity;
  [...foodDB.breakfast, ...foodDB.lunch, ...foodDB.dinner, ...foodDB.snacks].forEach(item => {
    let costPerKcal = (item.price_per_kg / 10) / item.kcal;
    if (costPerKcal < minCostPerKcal) minCostPerKcal = costPerKcal;
  });
  const minimum_meal_cost = minCostPerKcal * targetCal;

  if (dailyBudget < minimum_meal_cost) {
    throw new Error("Budget too low to generate a realistic meal plan");
  }

  let budgetModeStr = "";
  let allowedMaxPrice = Infinity;
  if (dailyBudget < 100) {
    budgetModeStr = "Low Budget Mode 💸";
    allowedMaxPrice = 120; // Only cheap foods
  } else if (dailyBudget < 250) {
    budgetModeStr = "Balanced Mode ⚖️";
    allowedMaxPrice = 300; // Include eggs, chicken, fish
  } else {
    budgetModeStr = "High Nutrition Mode 🍗";
    allowedMaxPrice = Infinity; // Include paneer, whey, mutton
  }

  $('statBudget').textContent=`₹${Math.round(dailyBudget*30).toLocaleString()}`;
  $('statCalories').textContent=targetCal.toLocaleString();
  $('statGoal').innerHTML=`${$('goalSelect').options[$('goalSelect').selectedIndex].text.replace(/[^A-Za-z ]/g,'').trim()}<br><span style="font-size:0.75em;color:#f59e0b">${budgetModeStr}</span>`;

  mealPlan=[];
  let budgetAltsUsed=[];

  const safeFilter = (dbArr, maxPrice) => {
    // Correct way: Don't filter too aggressively if budget is high, else just apply normal maxPrice
    let filteredFoods = filterDiet(dbArr, diet).filter(i => i.price_per_kg <= maxPrice);
    
    console.log("Foods available:", dbArr.length);
    console.log("Filtered foods:", filteredFoods.length);
    
    if (!filteredFoods || filteredFoods.length === 0) {
      console.warn("No foods matched filters, using fallback dataset");
      filteredFoods = filterDiet(dbArr, diet); // Use diet-friendly fallback
      if(filteredFoods.length === 0) filteredFoods = dbArr; // absolute fallback
    }
    return filteredFoods;
  };

  const bDB=safeFilter(foodDB.breakfast, allowedMaxPrice);
  const lDB=safeFilter(foodDB.lunch, allowedMaxPrice);
  const dDB=safeFilter(foodDB.dinner, allowedMaxPrice);
  const sDB=safeFilter(foodDB.snacks, allowedMaxPrice);

  // Track previous day's meals for variety
  let prevB='', prevL='', prevD='', prevS='';

  for(let d=1;d<=30;d++){
    // Smart variation: pick items that differ from previous day
    let b={...pickNoRepeat(bDB, prevB)};
    let l={...pickNoRepeat(lDB, prevL)};
    let din={...pickNoRepeat(dDB, prevD)};
    let s={...pickNoRepeat(sDB, prevS)};

    // Remember for next day
    prevB=b.name; prevL=l.name; prevD=din.name; prevS=s.name;

    b.qty=Math.round(((targetCal*0.25)/b.kcal)*100);
    l.qty=Math.round(((targetCal*0.35)/l.kcal)*100);
    din.qty=Math.round(((targetCal*0.25)/din.kcal)*100);
    s.qty=Math.round(((targetCal*0.15)/s.kcal)*100);
    let dayCost=(b.price_per_kg*b.qty/1000)+(l.price_per_kg*l.qty/1000)+(din.price_per_kg*din.qty/1000)+(s.price_per_kg*s.qty/1000);

    const applyAlt=(m,db,cal)=>{if(replacements[m.name]){let a=db.find(x=>x.name===replacements[m.name].name);if(a){let alt={...a};alt.qty=Math.round((cal/alt.kcal)*100);budgetAltsUsed.push(replacements[m.name].diff);return alt;}}return m;};
    if(dayCost>dailyBudget){b=applyAlt(b,bDB,targetCal*0.25);l=applyAlt(l,lDB,targetCal*0.35);din=applyAlt(din,dDB,targetCal*0.25);s=applyAlt(s,sDB,targetCal*0.15);}

    const mv=m=>({...m,c_cal:Math.round(m.kcal*m.qty/100),c_pro:Math.round(m.protein*m.qty/100),c_car:Math.round(m.carbs*m.qty/100),c_fat:Math.round(m.fat*m.qty/100),c_cost:Math.round(m.price_per_kg*m.qty/1000)});
    const dm={day:d,breakfast:mv(b),lunch:mv(l),dinner:mv(din),snack:mv(s),completed:false};
    dm.t_cal=dm.breakfast.c_cal+dm.lunch.c_cal+dm.dinner.c_cal+dm.snack.c_cal;
    dm.t_cost=dm.breakfast.c_cost+dm.lunch.c_cost+dm.dinner.c_cost+dm.snack.c_cost;
    dm.t_pro=dm.breakfast.c_pro+dm.lunch.c_pro+dm.dinner.c_pro+dm.snack.c_pro;
    dm.t_car=dm.breakfast.c_car+dm.lunch.c_car+dm.dinner.c_car+dm.snack.c_car;
    dm.t_fat=dm.breakfast.c_fat+dm.lunch.c_fat+dm.dinner.c_fat+dm.snack.c_fat;
    mealPlan.push(dm);
  }

  // Save to MongoDB
  await saveToMongoDB(cfg);

  renderWeek(1);
  renderAlternatives([...new Set(budgetAltsUsed)]);
  ['statsSection','sectionMealPlan','sectionAlternatives'].forEach(id=>{$(id).style.display='';});
  setTimeout(()=>$('statsSection').scrollIntoView({behavior:'smooth'}),200);
  showToast(budgetAltsUsed.length?'Plan generated with budget alternatives!':'30-day meal plan generated!', budgetAltsUsed.length?'info':'success');
}

$('generateBtn').addEventListener('click', async () => {
  const cfg = calculateTarget();
  if (!cfg) return showToast('Please fill all fields first', 'error');

  const overlay = $('fullScreenLoader');
  overlay.style.display = 'flex';
  
  const title = $('loaderTitle');
  const subtitle = $('loaderSubtitle');
  const spinner = $('loaderSpinner');
  
  title.textContent = '⚡ Creating your personalized plan...';
  if(subtitle) subtitle.style.display = 'block';
  spinner.style.display = 'block';

  requestAnimationFrame(() => overlay.classList.add('active'));

  // Immediate execution - no artificial delays
  try {
    // Generate the 30-day plan locally using IFCT dataset
    await generatePlan();
    
    title.textContent = '🎉 Your 30-day meal plan is ready!';
    if(subtitle) subtitle.style.display = 'none';
    spinner.style.display = 'none';
    
    // Short 800ms delay only so the user can read the success message
    setTimeout(() => {
      overlay.classList.remove('active');
      setTimeout(() => {
        overlay.style.display = 'none';
        $('statsSection').scrollIntoView({ behavior: 'smooth' });
      }, 300);
    }, 800);
  } catch(err) {
    console.error("Meal generation error:", err);
    showToast('⚠️ Unable to generate plan. Adjust your inputs or try again.', 'error');
    overlay.classList.remove('active');
    setTimeout(() => overlay.style.display = 'none', 300);
  }
});

function formatCell(m){return `<a href="/recipe.html?name=${encodeURIComponent(m.name)}&qty=${m.qty}&cal=${m.c_cal}&pro=${m.c_pro}&cost=${m.c_cost}" target="_blank" class="meal-cell-link"><div class="meal-cell"><div class="meal-cell-name"><i class="${m.icon}"></i> ${m.name}</div><div class="meal-cell-detail">${m.qty}g • ${m.c_cal} kcal • ₹${m.c_cost}</div></div></a>`;}

function renderWeek(week){
  const start=(week-1)*7,end=Math.min(start+7,30),tbody=$('mealTableBody');tbody.innerHTML='';
  for(let i=start;i<end;i++){const m=mealPlan[i];const tr=document.createElement('tr');
    tr.innerHTML=`<td><strong>Day ${m.day}</strong></td><td>${formatCell(m.breakfast)}</td><td>${formatCell(m.lunch)}</td><td>${formatCell(m.dinner)}</td><td>${formatCell(m.snack)}</td><td><span class="tag tag-protein">${m.t_cal} kcal</span></td><td><span class="tag tag-budget">₹${m.t_cost}</span></td>`;
    tbody.appendChild(tr);
  }
  document.querySelectorAll('.week-btn').forEach(b=>b.classList.toggle('active',parseInt(b.dataset.week)===week));
}

$('weekNav').addEventListener('click',e=>{if(e.target.classList.contains('week-btn'))renderWeek(parseInt(e.target.dataset.week));});

function renderAlternatives(usedAlts){
  const grid=$('altMealsGrid');
  const fallback=[{name:"Soya Chunks",icon:"fa-solid fa-seedling",diff:"Highly recommended cheap protein (₹15/100g = 52g protein)"},{name:"Roasted Chana",icon:"fa-solid fa-seedling",diff:"Best budget snack (₹10/100g)"},{name:"Eggs",icon:"fa-solid fa-egg",diff:"Cheapest bioavailable protein for non-vegetarians."}];
  let items=usedAlts.map(a=>{const k=Object.keys(replacements).find(k=>replacements[k].diff===a);return k?{name:replacements[k].name,icon:replacements[k].icon,diff:a}:null;}).filter(Boolean);
  if(!items.length)items=fallback;
  grid.innerHTML=items.map(m=>`<div class="alt-meal-card"><div class="alt-meal-emoji"><i class="${m.icon}"></i></div><div class="alt-meal-name">${m.name}</div><div class="alt-meal-desc">${m.diff}</div></div>`).join('');
}
