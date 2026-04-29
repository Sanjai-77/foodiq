require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

// 🔥 MUST call DB connection before routes
connectDB();

app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve frontend from client folder
app.use(express.static(path.join(__dirname, '..', 'client')));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tracker', require('./routes/tracker')); // previously nutrition
app.use('/api/profile', require('./routes/profile'));
app.use('/api/food', require('./routes/food'));
app.use('/api/meals', require('./routes/meals')); // previously mealplan

// Handle SPA or direct navigation to pages
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '..', 'client', 'pages', 'index.html'));
  }
});

app.listen(PORT, () => {
  console.log(`\n🚀 NutriGuide Server running on http://localhost:${PORT}\n`);
});
