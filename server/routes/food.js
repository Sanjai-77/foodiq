const express = require('express');
const auth = require('../middleware/auth');
const FoodItem = require('../models/FoodItem');

const router = express.Router();
router.use(auth);

// ─── SEED & GET ALL IFCT FOOD ITEMS ──────────────────────────
router.get('/db', async (req, res) => {
  try {
    let items = await FoodItem.find({});
    
    // Seed the database if empty
    if (items.length === 0) {
      const initialData = [
        // Breakfast
        {name:"Oats (Raw)",kcal:389,protein:16.9,carbs:66.3,fat:6.9,price_per_kg:200,type:"veg",icon:"fa-solid fa-bowl-rice",category:"breakfast"},
        {name:"Poha (Dry eq)",kcal:346,protein:6.6,carbs:77.3,fat:1.2,price_per_kg:80,type:"veg",icon:"fa-solid fa-bowl-rice",category:"breakfast"},
        {name:"Boiled Eggs",kcal:143,protein:13.3,carbs:0.7,fat:9.5,price_per_kg:160,type:"nonveg",icon:"fa-solid fa-egg",category:"breakfast"},
        {name:"Moong Dal Chilla (Dry eq)",kcal:348,protein:24.5,carbs:59.9,fat:1.2,price_per_kg:120,type:"veg",icon:"fa-solid fa-pancakes",category:"breakfast"},
        {name:"Idli Batter (Raw eq)",kcal:148,protein:4.5,carbs:32,fat:0.5,price_per_kg:60,type:"veg",icon:"fa-solid fa-circle",category:"breakfast"},
        {name:"Upma (Semolina dry)",kcal:360,protein:10.4,carbs:73,fat:1,price_per_kg:50,type:"veg",icon:"fa-solid fa-bowl-food",category:"breakfast"},
        {name:"Wheat Paratha (Raw eq)",kcal:341,protein:12.1,carbs:69.4,fat:1.7,price_per_kg:40,type:"veg",icon:"fa-solid fa-bread-slice",category:"breakfast"},
        {name:"Egg Bhurji",kcal:143,protein:13.3,carbs:0.7,fat:9.5,price_per_kg:160,type:"nonveg",icon:"fa-solid fa-fire-burner",category:"breakfast"},
        // Lunch
        {name:"Chicken Breast (Raw)",kcal:165,protein:31,carbs:0,fat:3.6,price_per_kg:280,type:"nonveg",icon:"fa-solid fa-drumstick-bite",category:"lunch"},
        {name:"Toor Dal (Dry eq)",kcal:335,protein:22.3,carbs:57.6,fat:1.7,price_per_kg:160,type:"veg",icon:"fa-solid fa-bowl-food",category:"lunch"},
        {name:"Rajma (Dry eq)",kcal:333,protein:22.5,carbs:60.6,fat:1,price_per_kg:180,type:"veg",icon:"fa-solid fa-seedling",category:"lunch"},
        {name:"Wheat Roti + Soya",kcal:343,protein:32,carbs:51,fat:1.1,price_per_kg:100,type:"veg",icon:"fa-solid fa-bread-slice",category:"lunch"},
        {name:"Fish Rohu (Raw)",kcal:102,protein:16.6,carbs:1.5,fat:2.7,price_per_kg:250,type:"nonveg",icon:"fa-solid fa-fish",category:"lunch"},
        {name:"Chole (Dry eq)",kcal:364,protein:19.3,carbs:60,fat:6,price_per_kg:140,type:"veg",icon:"fa-solid fa-bowl-food",category:"lunch"},
        {name:"Egg Curry (Egg eq)",kcal:143,protein:13.3,carbs:0.7,fat:9.5,price_per_kg:160,type:"nonveg",icon:"fa-solid fa-egg",category:"lunch"},
        {name:"Paneer (Raw)",kcal:296,protein:14,carbs:3,fat:25,price_per_kg:400,type:"veg",icon:"fa-solid fa-cheese",category:"lunch"},
        // Dinner
        {name:"Paneer (Raw)",kcal:296,protein:14,carbs:3,fat:25,price_per_kg:400,type:"veg",icon:"fa-solid fa-cheese",category:"dinner"},
        {name:"Soya Chunks (Dry eq)",kcal:345,protein:52,carbs:33,fat:0.5,price_per_kg:150,type:"veg",icon:"fa-solid fa-seedling",category:"dinner"},
        {name:"Mutton (Raw)",kcal:295,protein:18,carbs:0,fat:21,price_per_kg:800,type:"nonveg",icon:"fa-solid fa-bone",category:"dinner"},
        {name:"Chicken Breast (Raw)",kcal:165,protein:31,carbs:0,fat:3.6,price_per_kg:280,type:"nonveg",icon:"fa-solid fa-drumstick-bite",category:"dinner"},
        {name:"Mixed Veg (Raw eq)",kcal:65,protein:2.5,carbs:13,fat:0.2,price_per_kg:40,type:"veg",icon:"fa-solid fa-leaf",category:"dinner"},
        {name:"Moong Dal (Dry eq)",kcal:348,protein:24.5,carbs:59.9,fat:1.2,price_per_kg:120,type:"veg",icon:"fa-solid fa-bowl-food",category:"dinner"},
        {name:"Palak Paneer Eq",kcal:280,protein:15,carbs:28,fat:13,price_per_kg:350,type:"veg",icon:"fa-solid fa-leaf",category:"dinner"},
        {name:"Fish Rohu (Raw)",kcal:102,protein:16.6,carbs:1.5,fat:2.7,price_per_kg:250,type:"nonveg",icon:"fa-solid fa-fish",category:"dinner"},
        // Snacks
        {name:"Roasted Chana",kcal:369,protein:22.5,carbs:58.1,fat:5.2,price_per_kg:120,type:"veg",icon:"fa-solid fa-seedling",category:"snacks"},
        {name:"Peanuts (Raw)",kcal:567,protein:25.8,carbs:16.1,fat:49.2,price_per_kg:160,type:"veg",icon:"fa-solid fa-seedling",category:"snacks"},
        {name:"Whey Protein",kcal:380,protein:80,carbs:10,fat:2,price_per_kg:2500,type:"veg",icon:"fa-solid fa-bottle-water",category:"snacks"},
        {name:"Almonds",kcal:579,protein:21.1,carbs:21.6,fat:49.9,price_per_kg:800,type:"veg",icon:"fa-solid fa-seedling",category:"snacks"},
        {name:"Boiled Eggs",kcal:143,protein:13.3,carbs:0.7,fat:9.5,price_per_kg:160,type:"nonveg",icon:"fa-solid fa-egg",category:"snacks"},
        {name:"Curd / Yogurt",kcal:60,protein:3.1,carbs:4.6,fat:3,price_per_kg:80,type:"veg",icon:"fa-solid fa-spoon",category:"snacks"},
        {name:"Banana",kcal:89,protein:1.1,carbs:22.8,fat:0.3,price_per_kg:60,type:"veg",icon:"fa-solid fa-apple-whole",category:"snacks"},
        {name:"Sprouts (Moong)",kcal:348,protein:24.5,carbs:59.9,fat:1.2,price_per_kg:120,type:"veg",icon:"fa-solid fa-leaf",category:"snacks"}
      ];
      await FoodItem.insertMany(initialData);
      items = await FoodItem.find({});
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
