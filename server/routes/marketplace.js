/**
 * marketplace.js — Smart Grocery Marketplace API
 * ─────────────────────────────────────────────────
 * Product search, filtering, recommendations, and
 * platform redirect URL generation.
 */

const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const router = express.Router();

// ─── Curated Indian Grocery Product Database ─────────────────────
const PRODUCTS = [
  // ── VEGETABLES ──
  { id: 1, name: 'Fresh Spinach (Palak)', brand: 'Farm Fresh', category: 'vegetables', weight: '250g', price: 30, calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, fiber: 2.2, image: '🥬', tags: ['veg','low-carb','weight-loss','budget'], score: 92 },
  { id: 2, name: 'Broccoli', brand: 'Organic Harvest', category: 'vegetables', weight: '500g', price: 80, calories: 34, protein: 2.8, carbs: 7, fat: 0.4, fiber: 2.6, image: '🥦', tags: ['veg','low-carb','weight-loss','high-protein'], score: 95 },
  { id: 3, name: 'Onion (Pyaaz)', brand: 'Local Farm', category: 'vegetables', weight: '1 kg', price: 35, calories: 40, protein: 1.1, carbs: 9.3, fat: 0.1, fiber: 1.7, image: '🧅', tags: ['veg','budget'], score: 70 },
  { id: 4, name: 'Tomato (Tamatar)', brand: 'Local Farm', category: 'vegetables', weight: '1 kg', price: 40, calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, fiber: 1.2, image: '🍅', tags: ['veg','budget','weight-loss'], score: 78 },
  { id: 5, name: 'Carrot (Gajar)', brand: 'Farm Fresh', category: 'vegetables', weight: '500g', price: 30, calories: 41, protein: 0.9, carbs: 10, fat: 0.2, fiber: 2.8, image: '🥕', tags: ['veg','budget','weight-loss'], score: 82 },
  { id: 6, name: 'Capsicum (Shimla Mirch)', brand: 'Organic Harvest', category: 'vegetables', weight: '250g', price: 45, calories: 20, protein: 0.9, carbs: 4.6, fat: 0.2, fiber: 1.7, image: '🫑', tags: ['veg','low-carb','weight-loss'], score: 80 },
  { id: 7, name: 'Potato (Aloo)', brand: 'Local Farm', category: 'vegetables', weight: '1 kg', price: 30, calories: 77, protein: 2, carbs: 17, fat: 0.1, fiber: 2.2, image: '🥔', tags: ['veg','budget'], score: 60 },
  { id: 8, name: 'Cauliflower (Gobhi)', brand: 'Farm Fresh', category: 'vegetables', weight: '1 pc', price: 35, calories: 25, protein: 1.9, carbs: 5, fat: 0.3, fiber: 2, image: '🥬', tags: ['veg','low-carb','budget','weight-loss'], score: 83 },
  // ── FRUITS ──
  { id: 10, name: 'Banana (Kela)', brand: 'Fresh Basket', category: 'fruits', weight: '1 dozen', price: 50, calories: 89, protein: 1.1, carbs: 23, fat: 0.3, fiber: 2.6, image: '🍌', tags: ['veg','budget','muscle-gain','healthy-snack'], score: 80 },
  { id: 11, name: 'Apple (Seb)', brand: 'Kashmir Organic', category: 'fruits', weight: '1 kg', price: 160, calories: 52, protein: 0.3, carbs: 14, fat: 0.2, fiber: 2.4, image: '🍎', tags: ['veg','weight-loss','healthy-snack'], score: 88 },
  { id: 12, name: 'Orange (Santra)', brand: 'Nagpur Fresh', category: 'fruits', weight: '1 kg', price: 80, calories: 47, protein: 0.9, carbs: 12, fat: 0.1, fiber: 2.4, image: '🍊', tags: ['veg','weight-loss','healthy-snack','budget'], score: 85 },
  { id: 13, name: 'Papaya', brand: 'Tropical Fresh', category: 'fruits', weight: '1 pc', price: 50, calories: 43, protein: 0.5, carbs: 11, fat: 0.3, fiber: 1.7, image: '🥭', tags: ['veg','weight-loss','budget'], score: 79 },
  { id: 14, name: 'Pomegranate (Anar)', brand: 'Fresh Basket', category: 'fruits', weight: '500g', price: 120, calories: 83, protein: 1.7, carbs: 19, fat: 1.2, fiber: 4, image: '🫐', tags: ['veg','healthy-snack'], score: 90 },
  { id: 15, name: 'Watermelon (Tarbooz)', brand: 'Seasonal', category: 'fruits', weight: '1 pc', price: 40, calories: 30, protein: 0.6, carbs: 8, fat: 0.2, fiber: 0.4, image: '🍉', tags: ['veg','weight-loss','budget'], score: 75 },
  // ── DAIRY & PROTEIN ──
  { id: 20, name: 'Amul Paneer (Fresh)', brand: 'Amul', category: 'dairy', weight: '200g', price: 90, calories: 265, protein: 18, carbs: 1.2, fat: 21, fiber: 0, image: '🧀', tags: ['veg','high-protein','muscle-gain'], score: 82 },
  { id: 21, name: 'Low Fat Paneer', brand: 'Mother Dairy', category: 'dairy', weight: '200g', price: 85, calories: 180, protein: 20, carbs: 2, fat: 10, fiber: 0, image: '🧀', tags: ['veg','high-protein','muscle-gain','weight-loss'], score: 88 },
  { id: 22, name: 'Curd (Dahi)', brand: 'Amul', category: 'dairy', weight: '400g', price: 45, calories: 60, protein: 3.5, carbs: 4.7, fat: 3.3, fiber: 0, image: '🥛', tags: ['veg','budget','high-protein'], score: 80 },
  { id: 23, name: 'Greek Yogurt', brand: 'Epigamia', category: 'dairy', weight: '90g', price: 55, calories: 59, protein: 10, carbs: 3.2, fat: 0.7, fiber: 0, image: '🥛', tags: ['veg','high-protein','muscle-gain','weight-loss'], score: 93 },
  { id: 24, name: 'Toned Milk', brand: 'Amul Taaza', category: 'dairy', weight: '1 L', price: 54, calories: 58, protein: 3.2, carbs: 4.7, fat: 3, fiber: 0, image: '🥛', tags: ['veg','budget','muscle-gain'], score: 75 },
  { id: 25, name: 'Double Toned Milk', brand: 'Mother Dairy', category: 'dairy', weight: '1 L', price: 48, calories: 44, protein: 3.4, carbs: 5, fat: 1.5, fiber: 0, image: '🥛', tags: ['veg','budget','weight-loss'], score: 80 },
  { id: 26, name: 'Whey Protein (Chocolate)', brand: 'MuscleBlaze', category: 'supplements', weight: '1 kg', price: 1999, calories: 120, protein: 24, carbs: 4, fat: 1.5, fiber: 0, image: '💪', tags: ['high-protein','muscle-gain'], score: 90 },
  // ── EGGS & NON-VEG ──
  { id: 30, name: 'Farm Eggs (White)', brand: 'Eggoz', category: 'eggs', weight: '6 pcs', price: 48, calories: 78, protein: 6, carbs: 0.6, fat: 5, fiber: 0, image: '🥚', tags: ['nonveg','high-protein','budget','muscle-gain'], score: 92 },
  { id: 31, name: 'Country Eggs (Desi)', brand: 'Happy Hens', category: 'eggs', weight: '6 pcs', price: 72, calories: 90, protein: 7, carbs: 0.7, fat: 6.5, fiber: 0, image: '🥚', tags: ['nonveg','high-protein','muscle-gain'], score: 94 },
  { id: 32, name: 'Chicken Breast (Boneless)', brand: 'Licious', category: 'meat', weight: '500g', price: 280, calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0, image: '🍗', tags: ['nonveg','high-protein','muscle-gain','low-carb'], score: 96 },
  { id: 33, name: 'Chicken Thigh', brand: 'FreshToHome', category: 'meat', weight: '500g', price: 220, calories: 209, protein: 26, carbs: 0, fat: 11, fiber: 0, image: '🍗', tags: ['nonveg','high-protein','muscle-gain','budget'], score: 85 },
  { id: 34, name: 'Fish (Rohu) Curry Cut', brand: 'FreshToHome', category: 'seafood', weight: '500g', price: 200, calories: 97, protein: 17, carbs: 0, fat: 3, fiber: 0, image: '🐟', tags: ['nonveg','high-protein','weight-loss'], score: 90 },
  // ── GRAINS & CEREALS ──
  { id: 40, name: 'Whole Wheat Atta', brand: 'Aashirvaad', category: 'grains', weight: '5 kg', price: 250, calories: 340, protein: 12, carbs: 72, fat: 1.5, fiber: 11, image: '🌾', tags: ['veg','budget'], score: 72 },
  { id: 41, name: 'Basmati Rice', brand: 'India Gate', category: 'grains', weight: '5 kg', price: 450, calories: 350, protein: 7, carbs: 78, fat: 0.6, fiber: 1.3, image: '🍚', tags: ['veg','budget'], score: 65 },
  { id: 42, name: 'Rolled Oats', brand: 'Quaker', category: 'grains', weight: '1 kg', price: 199, calories: 389, protein: 17, carbs: 66, fat: 7, fiber: 11, image: '🥣', tags: ['veg','high-protein','muscle-gain','weight-loss','healthy-snack'], score: 91 },
  { id: 43, name: 'Brown Rice', brand: 'Organic Tattva', category: 'grains', weight: '1 kg', price: 120, calories: 370, protein: 8, carbs: 77, fat: 2.7, fiber: 3.5, image: '🍚', tags: ['veg','weight-loss'], score: 80 },
  { id: 44, name: 'Quinoa', brand: 'True Elements', category: 'grains', weight: '500g', price: 280, calories: 368, protein: 14, carbs: 64, fat: 6, fiber: 7, image: '🌾', tags: ['veg','high-protein','weight-loss'], score: 93 },
  { id: 45, name: 'Poha (Flattened Rice)', brand: 'Local', category: 'grains', weight: '500g', price: 40, calories: 360, protein: 6.7, carbs: 79, fat: 1.2, fiber: 1, image: '🍚', tags: ['veg','budget'], score: 65 },
  // ── PULSES & LENTILS ──
  { id: 50, name: 'Moong Dal', brand: 'Tata Sampann', category: 'pulses', weight: '1 kg', price: 140, calories: 347, protein: 24, carbs: 60, fat: 1.2, fiber: 16, image: '🫘', tags: ['veg','high-protein','budget','muscle-gain'], score: 90 },
  { id: 51, name: 'Toor Dal (Arhar)', brand: 'Tata Sampann', category: 'pulses', weight: '1 kg', price: 160, calories: 343, protein: 22, carbs: 63, fat: 1.5, fiber: 15, image: '🫘', tags: ['veg','high-protein','budget'], score: 88 },
  { id: 52, name: 'Chana Dal', brand: 'Fortune', category: 'pulses', weight: '1 kg', price: 110, calories: 360, protein: 22, carbs: 60, fat: 5.3, fiber: 12, image: '🫘', tags: ['veg','high-protein','budget','muscle-gain'], score: 87 },
  { id: 53, name: 'Rajma (Red Kidney Beans)', brand: 'BB Popular', category: 'pulses', weight: '500g', price: 85, calories: 333, protein: 24, carbs: 60, fat: 0.8, fiber: 25, image: '🫘', tags: ['veg','high-protein','budget','muscle-gain'], score: 89 },
  { id: 54, name: 'Soya Chunks', brand: 'Nutrela', category: 'pulses', weight: '200g', price: 52, calories: 345, protein: 52, carbs: 33, fat: 0.5, fiber: 13, image: '🫘', tags: ['veg','high-protein','budget','muscle-gain'], score: 95 },
  { id: 55, name: 'Black Chana (Kala Chana)', brand: 'Local', category: 'pulses', weight: '500g', price: 65, calories: 364, protein: 19, carbs: 61, fat: 6, fiber: 17, image: '🫘', tags: ['veg','high-protein','budget','muscle-gain'], score: 86 },
  { id: 56, name: 'Sprouts Mix', brand: 'Fresh Basket', category: 'pulses', weight: '200g', price: 30, calories: 100, protein: 7, carbs: 18, fat: 0.5, fiber: 4, image: '🌱', tags: ['veg','high-protein','budget','weight-loss','healthy-snack'], score: 94 },
  // ── NUTS & SEEDS ──
  { id: 60, name: 'Peanut Butter (Creamy)', brand: 'MyFitness', category: 'nuts', weight: '510g', price: 349, calories: 588, protein: 25, carbs: 20, fat: 50, fiber: 6, image: '🥜', tags: ['veg','high-protein','muscle-gain','healthy-snack'], score: 86 },
  { id: 61, name: 'Almonds (Badam)', brand: 'Happilo', category: 'nuts', weight: '200g', price: 220, calories: 576, protein: 21, carbs: 22, fat: 49, fiber: 12, image: '🥜', tags: ['veg','high-protein','muscle-gain','healthy-snack'], score: 90 },
  { id: 62, name: 'Mixed Dry Fruits', brand: 'Nutraj', category: 'nuts', weight: '250g', price: 250, calories: 520, protein: 15, carbs: 30, fat: 42, fiber: 8, image: '🥜', tags: ['veg','healthy-snack','muscle-gain'], score: 84 },
  { id: 63, name: 'Flax Seeds (Alsi)', brand: 'True Elements', category: 'seeds', weight: '150g', price: 99, calories: 534, protein: 18, carbs: 29, fat: 42, fiber: 27, image: '🌻', tags: ['veg','high-protein','weight-loss','healthy-snack'], score: 91 },
  { id: 64, name: 'Chia Seeds', brand: 'True Elements', category: 'seeds', weight: '150g', price: 179, calories: 486, protein: 17, carbs: 42, fat: 31, fiber: 34, image: '🌻', tags: ['veg','high-protein','weight-loss','healthy-snack'], score: 93 },
  { id: 65, name: 'Peanuts (Roasted)', brand: 'Jabsons', category: 'nuts', weight: '320g', price: 95, calories: 567, protein: 26, carbs: 16, fat: 49, fiber: 9, image: '🥜', tags: ['veg','high-protein','budget','muscle-gain','healthy-snack'], score: 85 },
  // ── COOKING ESSENTIALS ──
  { id: 70, name: 'Mustard Oil', brand: 'Fortune', category: 'oils', weight: '1 L', price: 180, calories: 884, protein: 0, carbs: 0, fat: 100, fiber: 0, image: '🫒', tags: ['veg','budget'], score: 65 },
  { id: 71, name: 'Olive Oil (Extra Virgin)', brand: 'Figaro', category: 'oils', weight: '500 ml', price: 450, calories: 884, protein: 0, carbs: 0, fat: 100, fiber: 0, image: '🫒', tags: ['veg','weight-loss'], score: 82 },
  { id: 72, name: 'Turmeric Powder (Haldi)', brand: 'MDH', category: 'spices', weight: '100g', price: 40, calories: 312, protein: 10, carbs: 67, fat: 3.3, fiber: 22, image: '🌶️', tags: ['veg','budget'], score: 80 },
  { id: 73, name: 'Garam Masala', brand: 'Everest', category: 'spices', weight: '100g', price: 65, calories: 379, protein: 13, carbs: 45, fat: 15, fiber: 0, image: '🌶️', tags: ['veg','budget'], score: 72 },
  { id: 74, name: 'Honey (Raw)', brand: 'Dabur', category: 'sweeteners', weight: '400g', price: 199, calories: 304, protein: 0.3, carbs: 82, fat: 0, fiber: 0, image: '🍯', tags: ['veg','healthy-snack'], score: 73 },
  // ── HEALTHY SNACKS ──
  { id: 80, name: 'Makhana (Fox Nuts)', brand: 'Farmley', category: 'snacks', weight: '200g', price: 149, calories: 350, protein: 9.7, carbs: 77, fat: 0.1, fiber: 14, image: '🍿', tags: ['veg','weight-loss','healthy-snack','budget'], score: 89 },
  { id: 81, name: 'Protein Bar (Choco)', brand: 'RiteBite Max', category: 'snacks', weight: '70g', price: 120, calories: 210, protein: 20, carbs: 22, fat: 7, fiber: 3, image: '🍫', tags: ['high-protein','muscle-gain','healthy-snack'], score: 82 },
  { id: 82, name: 'Granola', brand: 'Yoga Bar', category: 'snacks', weight: '400g', price: 299, calories: 440, protein: 11, carbs: 64, fat: 15, fiber: 7, image: '🥣', tags: ['veg','healthy-snack'], score: 78 },
  { id: 83, name: 'Dark Chocolate (70%)', brand: 'Amul', category: 'snacks', weight: '150g', price: 125, calories: 598, protein: 8, carbs: 46, fat: 43, fiber: 11, image: '🍫', tags: ['veg','healthy-snack'], score: 74 },
  { id: 84, name: 'Roasted Chana', brand: 'Haldiram', category: 'snacks', weight: '200g', price: 55, calories: 369, protein: 22, carbs: 58, fat: 5, fiber: 12, image: '🌰', tags: ['veg','high-protein','budget','healthy-snack','muscle-gain'], score: 87 },
  // ── BEVERAGES ──
  { id: 90, name: 'Green Tea', brand: 'Organic India', category: 'beverages', weight: '25 bags', price: 175, calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, image: '🍵', tags: ['veg','weight-loss'], score: 88 },
  { id: 91, name: 'Coconut Water', brand: 'Raw Pressery', category: 'beverages', weight: '200 ml', price: 40, calories: 19, protein: 0.7, carbs: 3.7, fat: 0.2, fiber: 1.1, image: '🥥', tags: ['veg','weight-loss','healthy-snack','budget'], score: 85 },
  { id: 92, name: 'Buttermilk (Chaas)', brand: 'Amul', category: 'beverages', weight: '200 ml', price: 15, calories: 20, protein: 0.8, carbs: 3, fat: 0.5, fiber: 0, image: '🥛', tags: ['veg','weight-loss','budget'], score: 80 },
];

// ─── Platform URL generators ──────────────────────────────────────
const PLATFORMS = {
  blinkit:   (q) => `https://blinkit.com/s/?q=${encodeURIComponent(q)}`,
  bigbasket: (q) => `https://www.bigbasket.com/ps/?q=${encodeURIComponent(q)}`,
  zepto:     (q) => `https://www.zeptonow.com/search?query=${encodeURIComponent(q)}`,
  instamart: (q) => `https://www.swiggy.com/instamart/search?custom_back=true&query=${encodeURIComponent(q)}`
};

function getPlatformLinks(productName) {
  const q = productName.replace(/\s*\(.*?\)\s*/g, '').trim();
  return {
    blinkit:   PLATFORMS.blinkit(q),
    bigbasket: PLATFORMS.bigbasket(q),
    zepto:     PLATFORMS.zepto(q),
    instamart: PLATFORMS.instamart(q)
  };
}

// ─── GET /api/marketplace/products?q=&category=&tag=&sort= ──────
router.get('/products', auth, (req, res) => {
  let { q, category, tag, sort, diet } = req.query;
  let results = [...PRODUCTS];

  // Text search
  if (q && q.trim()) {
    const query = q.toLowerCase().trim();
    results = results.filter(p =>
      p.name.toLowerCase().includes(query) ||
      p.brand.toLowerCase().includes(query) ||
      p.category.toLowerCase().includes(query) ||
      p.tags.some(t => t.includes(query))
    );
  }

  // Category filter
  if (category && category !== 'all') {
    results = results.filter(p => p.category === category);
  }

  // Tag filter
  if (tag && tag !== 'all') {
    results = results.filter(p => p.tags.includes(tag));
  }

  // Diet filter
  if (diet === 'veg') {
    results = results.filter(p => p.tags.includes('veg'));
  } else if (diet === 'nonveg') {
    // Show all including non-veg
  }

  // Sorting
  if (sort === 'price-low') results.sort((a, b) => a.price - b.price);
  else if (sort === 'price-high') results.sort((a, b) => b.price - a.price);
  else if (sort === 'protein') results.sort((a, b) => b.protein - a.protein);
  else if (sort === 'calories-low') results.sort((a, b) => a.calories - b.calories);
  else if (sort === 'score') results.sort((a, b) => b.score - a.score);
  else results.sort((a, b) => b.score - a.score); // Default: healthy score

  // Attach platform links
  const enriched = results.map(p => ({
    ...p,
    platforms: getPlatformLinks(p.name)
  }));

  res.json({ products: enriched, total: enriched.length });
});

// ─── GET /api/marketplace/recommendations ───────────────────────
router.get('/recommendations', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('profile').lean();
    const goal = user?.profile?.goal || 'maintenance';
    const diet = user?.profile?.diet || 'nonveg';

    let tagFilter;
    if (goal === 'muscle-gain') tagFilter = 'muscle-gain';
    else if (goal === 'weight-loss') tagFilter = 'weight-loss';
    else tagFilter = 'healthy-snack';

    let results = PRODUCTS.filter(p => p.tags.includes(tagFilter));
    if (diet === 'veg') results = results.filter(p => p.tags.includes('veg'));

    results.sort((a, b) => b.score - a.score);
    results = results.slice(0, 8).map(p => ({ ...p, platforms: getPlatformLinks(p.name) }));

    res.json({ goal, recommendations: results });
  } catch (err) {
    console.error('Recommendation error:', err.message);
    res.status(500).json({ message: 'Failed to get recommendations' });
  }
});

// ─── GET /api/marketplace/categories ────────────────────────────
router.get('/categories', auth, (req, res) => {
  const cats = [...new Set(PRODUCTS.map(p => p.category))];
  res.json({ categories: cats });
});

// ─── GET /api/marketplace/trending ──────────────────────────────
router.get('/trending', auth, (req, res) => {
  const trending = PRODUCTS
    .filter(p => p.score >= 85)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map(p => ({ ...p, platforms: getPlatformLinks(p.name) }));
  res.json({ products: trending });
});

module.exports = router;
