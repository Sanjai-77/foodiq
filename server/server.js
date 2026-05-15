const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

// 🔥 MUST call DB connection before routes
connectDB();

app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve frontend from public folder
app.use(express.static(path.join(__dirname, '..', 'public')));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tracker', require('./routes/tracker'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/food', require('./routes/food'));
app.use('/api/meals', require('./routes/meals'));
app.use('/api/recipe', require('./routes/recipe'));
app.use('/api/generate-recipe', require('./routes/generateRecipe'));
app.use('/api/chat', require('./routes/chatbot'));
app.use('/api/marketplace', require('./routes/marketplace'));

// Route fallback — serve index.html for any non-API request
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
  }
});

app.listen(PORT, () => {
  console.log(`\n🚀 FoodIQ Server running on http://localhost:${PORT}\n`);
});
