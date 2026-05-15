const express = require('express');
const auth = require('../middleware/auth');
const FoodItem = require('../models/FoodItem');

const router = express.Router();
router.use(auth);

// ─── Current seed data version (bump to force reseed) ────────
const SEED_VERSION = 2;

// ─── Comprehensive IFCT Food Items (with ultra-cheap staples) ─
const FOOD_ITEMS = [
  // ──────── BREAKFAST ────────
  // Ultra-cheap staples (₹20-50/kg) — essential for low-budget plans
  {name:"Wheat Paratha (Atta)",kcal:341,protein:12.1,carbs:69.4,fat:1.7,price_per_kg:35,type:"veg",icon:"fa-solid fa-bread-slice",category:"breakfast"},
  {name:"Rice Porridge (Kanji)",kcal:350,protein:6.8,carbs:78,fat:0.5,price_per_kg:40,type:"veg",icon:"fa-solid fa-bowl-rice",category:"breakfast"},
  {name:"Sattu Drink",kcal:406,protein:20.6,carbs:65.2,fat:7.2,price_per_kg:80,type:"veg",icon:"fa-solid fa-glass-water",category:"breakfast"},
  {name:"Upma (Semolina)",kcal:360,protein:10.4,carbs:73,fat:1,price_per_kg:45,type:"veg",icon:"fa-solid fa-bowl-food",category:"breakfast"},
  {name:"Poha (Flattened Rice)",kcal:346,protein:6.6,carbs:77.3,fat:1.2,price_per_kg:70,type:"veg",icon:"fa-solid fa-bowl-rice",category:"breakfast"},
  {name:"Idli (Rice+Urad Dal)",kcal:148,protein:4.5,carbs:32,fat:0.5,price_per_kg:55,type:"veg",icon:"fa-solid fa-circle",category:"breakfast"},
  {name:"Moong Dal Chilla",kcal:348,protein:24.5,carbs:59.9,fat:1.2,price_per_kg:110,type:"veg",icon:"fa-solid fa-pancakes",category:"breakfast"},
  {name:"Oats Porridge",kcal:389,protein:16.9,carbs:66.3,fat:6.9,price_per_kg:180,type:"veg",icon:"fa-solid fa-bowl-rice",category:"breakfast"},
  {name:"Boiled Eggs",kcal:143,protein:13.3,carbs:0.7,fat:9.5,price_per_kg:160,type:"nonveg",icon:"fa-solid fa-egg",category:"breakfast"},
  {name:"Egg Bhurji",kcal:170,protein:13.3,carbs:1.2,fat:12,price_per_kg:160,type:"nonveg",icon:"fa-solid fa-fire-burner",category:"breakfast"},
  {name:"Bajra Roti",kcal:361,protein:11.6,carbs:67,fat:5,price_per_kg:35,type:"veg",icon:"fa-solid fa-bread-slice",category:"breakfast"},

  // ──────── LUNCH ────────
  // Ultra-cheap staples
  {name:"Rice + Dal (Khichdi)",kcal:350,protein:12,carbs:65,fat:3,price_per_kg:50,type:"veg",icon:"fa-solid fa-bowl-rice",category:"lunch"},
  {name:"Wheat Roti + Potato Sabzi",kcal:320,protein:8,carbs:62,fat:5,price_per_kg:30,type:"veg",icon:"fa-solid fa-bread-slice",category:"lunch"},
  {name:"Rice + Sambar",kcal:340,protein:10,carbs:68,fat:2.5,price_per_kg:50,type:"veg",icon:"fa-solid fa-bowl-food",category:"lunch"},
  {name:"Wheat Roti + Soya Chunks",kcal:343,protein:32,carbs:51,fat:1.1,price_per_kg:85,type:"veg",icon:"fa-solid fa-bread-slice",category:"lunch"},
  {name:"Chole (Chickpeas)",kcal:364,protein:19.3,carbs:60,fat:6,price_per_kg:120,type:"veg",icon:"fa-solid fa-bowl-food",category:"lunch"},
  {name:"Toor Dal + Rice",kcal:335,protein:22.3,carbs:57.6,fat:1.7,price_per_kg:100,type:"veg",icon:"fa-solid fa-bowl-food",category:"lunch"},
  {name:"Rajma + Rice",kcal:333,protein:22.5,carbs:60.6,fat:1,price_per_kg:110,type:"veg",icon:"fa-solid fa-seedling",category:"lunch"},
  {name:"Egg Curry + Rice",kcal:280,protein:15,carbs:40,fat:7,price_per_kg:100,type:"nonveg",icon:"fa-solid fa-egg",category:"lunch"},
  {name:"Chicken Curry + Roti",kcal:250,protein:28,carbs:20,fat:6,price_per_kg:250,type:"nonveg",icon:"fa-solid fa-drumstick-bite",category:"lunch"},
  {name:"Fish Curry + Rice",kcal:220,protein:20,carbs:30,fat:4,price_per_kg:220,type:"nonveg",icon:"fa-solid fa-fish",category:"lunch"},
  {name:"Paneer Sabzi + Roti",kcal:296,protein:14,carbs:25,fat:18,price_per_kg:350,type:"veg",icon:"fa-solid fa-cheese",category:"lunch"},

  // ──────── DINNER ────────
  // Ultra-cheap staples
  {name:"Dal + Rice",kcal:340,protein:14,carbs:62,fat:2.5,price_per_kg:50,type:"veg",icon:"fa-solid fa-bowl-food",category:"dinner"},
  {name:"Roti + Mixed Veg",kcal:280,protein:8,carbs:50,fat:5,price_per_kg:35,type:"veg",icon:"fa-solid fa-leaf",category:"dinner"},
  {name:"Bajra Roti + Sabzi",kcal:330,protein:10,carbs:60,fat:6,price_per_kg:35,type:"veg",icon:"fa-solid fa-bread-slice",category:"dinner"},
  {name:"Soya Chunks Curry",kcal:345,protein:52,carbs:33,fat:0.5,price_per_kg:140,type:"veg",icon:"fa-solid fa-seedling",category:"dinner"},
  {name:"Moong Dal + Roti",kcal:348,protein:24.5,carbs:59.9,fat:1.2,price_per_kg:90,type:"veg",icon:"fa-solid fa-bowl-food",category:"dinner"},
  {name:"Potato Curry + Roti",kcal:300,protein:6,carbs:58,fat:5,price_per_kg:30,type:"veg",icon:"fa-solid fa-bread-slice",category:"dinner"},
  {name:"Chicken Breast Curry",kcal:165,protein:31,carbs:2,fat:3.6,price_per_kg:280,type:"nonveg",icon:"fa-solid fa-drumstick-bite",category:"dinner"},
  {name:"Egg Bhurji + Roti",kcal:260,protein:16,carbs:32,fat:8,price_per_kg:100,type:"nonveg",icon:"fa-solid fa-egg",category:"dinner"},
  {name:"Fish Rohu Curry",kcal:180,protein:18,carbs:8,fat:6,price_per_kg:250,type:"nonveg",icon:"fa-solid fa-fish",category:"dinner"},
  {name:"Palak Dal + Rice",kcal:310,protein:16,carbs:52,fat:4,price_per_kg:70,type:"veg",icon:"fa-solid fa-leaf",category:"dinner"},
  {name:"Paneer Bhurji + Roti",kcal:320,protein:18,carbs:25,fat:16,price_per_kg:350,type:"veg",icon:"fa-solid fa-cheese",category:"dinner"},

  // ──────── SNACKS ────────
  {name:"Roasted Chana",kcal:369,protein:22.5,carbs:58.1,fat:5.2,price_per_kg:100,type:"veg",icon:"fa-solid fa-seedling",category:"snacks"},
  {name:"Peanuts (Raw)",kcal:567,protein:25.8,carbs:16.1,fat:49.2,price_per_kg:140,type:"veg",icon:"fa-solid fa-seedling",category:"snacks"},
  {name:"Banana",kcal:89,protein:1.1,carbs:22.8,fat:0.3,price_per_kg:40,type:"veg",icon:"fa-solid fa-apple-whole",category:"snacks"},
  {name:"Curd / Yogurt",kcal:60,protein:3.1,carbs:4.6,fat:3,price_per_kg:60,type:"veg",icon:"fa-solid fa-spoon",category:"snacks"},
  {name:"Sprouts (Moong)",kcal:348,protein:24.5,carbs:59.9,fat:1.2,price_per_kg:100,type:"veg",icon:"fa-solid fa-leaf",category:"snacks"},
  {name:"Sattu Laddoo",kcal:406,protein:20.6,carbs:65.2,fat:7.2,price_per_kg:90,type:"veg",icon:"fa-solid fa-cookie",category:"snacks"},
  {name:"Murmura (Puffed Rice)",kcal:325,protein:5.5,carbs:77,fat:0.5,price_per_kg:50,type:"veg",icon:"fa-solid fa-bowl-rice",category:"snacks"},
  {name:"Boiled Eggs",kcal:143,protein:13.3,carbs:0.7,fat:9.5,price_per_kg:160,type:"nonveg",icon:"fa-solid fa-egg",category:"snacks"},
  {name:"Almonds",kcal:579,protein:21.1,carbs:21.6,fat:49.9,price_per_kg:800,type:"veg",icon:"fa-solid fa-seedling",category:"snacks"},
  {name:"Whey Protein",kcal:380,protein:80,carbs:10,fat:2,price_per_kg:2500,type:"veg",icon:"fa-solid fa-bottle-water",category:"snacks"},
  {name:"Gur (Jaggery)",kcal:383,protein:0.4,carbs:95,fat:0.1,price_per_kg:70,type:"veg",icon:"fa-solid fa-candy-cane",category:"snacks"}
];

// ─── SEED & GET ALL IFCT FOOD ITEMS ──────────────────────────
router.get('/db', async (req, res) => {
  try {
    let items = await FoodItem.find({});
    
    // Seed the database if empty OR if seed version is outdated
    const needsReseed = items.length === 0 || items.length < FOOD_ITEMS.length;
    if (needsReseed) {
      console.log(`🔄 Reseeding food database (${items.length} → ${FOOD_ITEMS.length} items)...`);
      await FoodItem.deleteMany({});
      await FoodItem.insertMany(FOOD_ITEMS);
      items = await FoodItem.find({});
      console.log(`✅ Food database seeded with ${items.length} items`);
    }

    // Format like the original dashboard foodDB object
    const foodDB = {
      breakfast: items.filter(i => i.category === 'breakfast'),
      lunch: items.filter(i => i.category === 'lunch'),
      dinner: items.filter(i => i.category === 'dinner'),
      snacks: items.filter(i => i.category === 'snacks')
    };

    res.json({ foodDB, message: 'IFCT Pricing and Nutrition Database loaded successfully.' });
  } catch (err) {
    console.error('Food API error:', err);
    res.status(500).json({ message: 'Failed to fetch food data.', foodDB: null });
  }
});

module.exports = router;
