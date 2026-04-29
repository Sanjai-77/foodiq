const express = require('express');
const Nutrition = require('../models/Nutrition');
const auth = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(auth);

// ─── ADD / UPDATE NUTRITION DATA ─────────────────────────────
router.post('/add', async (req, res) => {
  try {
    const { day, calories, protein, carbs, fats, targetCalories, targetProtein, targetCarbs, targetFats, completed } = req.body;
    const userId = req.user.id;

    if (!day || day < 1) {
      return res.status(400).json({ message: 'Valid day number is required.' });
    }

    // Check if previous day is completed (except day 1)
    if (day > 1) {
      const prevDay = await Nutrition.findOne({ userId, day: day - 1 });
      if (!prevDay || !prevDay.completed) {
        return res.status(400).json({ message: `Please complete Day ${day - 1} first.` });
      }
    }

    // Upsert the day's data
    const nutritionData = await Nutrition.findOneAndUpdate(
      { userId, day },
      {
        userId,
        day,
        calories: calories || 0,
        protein: protein || 0,
        carbs: carbs || 0,
        fats: fats || 0,
        targetCalories: targetCalories || 0,
        targetProtein: targetProtein || 0,
        targetCarbs: targetCarbs || 0,
        targetFats: targetFats || 0,
        completed: completed || false,
        date: new Date()
      },
      { upsert: true, new: true, runValidators: true }
    );

    res.json({
      message: completed ? `Day ${day} completed!` : `Day ${day} saved.`,
      data: nutritionData
    });
  } catch (err) {
    console.error('Add nutrition error:', err);
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Duplicate entry for this day.' });
    }
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// ─── GET ALL NUTRITION DATA FOR USER ─────────────────────────
router.get('/user/:id', async (req, res) => {
  try {
    const userId = req.params.id;

    // Ensure user can only access their own data
    if (userId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const data = await Nutrition.find({ userId }).sort({ day: 1 });

    res.json({
      message: 'Nutrition data retrieved.',
      data,
      totalDays: data.length,
      completedDays: data.filter(d => d.completed).length
    });
  } catch (err) {
    console.error('Get nutrition error:', err);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// ─── GET SINGLE DAY DATA ─────────────────────────────────────
router.get('/day/:day', async (req, res) => {
  try {
    const userId = req.user.id;
    const day = parseInt(req.params.day);

    const data = await Nutrition.findOne({ userId, day });

    if (!data) {
      return res.json({ message: 'No data for this day.', data: null });
    }

    res.json({ data });
  } catch (err) {
    console.error('Get day error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ─── DELETE DAY DATA ─────────────────────────────────────────
router.delete('/day/:day', async (req, res) => {
  try {
    const userId = req.user.id;
    const day = parseInt(req.params.day);

    await Nutrition.findOneAndDelete({ userId, day });

    res.json({ message: `Day ${day} data deleted.` });
  } catch (err) {
    console.error('Delete day error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
