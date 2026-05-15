const express = require('express');
const MealPlan = require('../models/MealPlan');
const Nutrition = require('../models/Nutrition');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth);

// ─── SAVE GENERATED MEAL PLAN ────────────────────────────────
router.post('/save', async (req, res) => {
  try {
    const { days, totalDays, targetCalories, targetProtein, targetCarbs, targetFats, dailyBudget } = req.body;
    const userId = req.user.id;

    if (!days || !days.length) {
      console.warn('⚠️ Empty meal plan received — rejecting save');
      return res.status(400).json({ success: false, message: 'Meal plan data is required.' });
    }

    console.log(`📋 Saving meal plan for user ${userId}: ${days.length} days, ${targetCalories} kcal target`);

    if (!req.body.overwrite) {
      const existingPlan = await MealPlan.findOne({ userId });
      if (existingPlan) {
        return res.status(400).json({ success: false, message: 'Meal plan already exists. Use overwrite to replace.' });
      }
    }

    // Upsert — replace existing plan for this user
    const plan = await MealPlan.findOneAndUpdate(
      { userId },
      { userId, days, totalDays, targetCalories, targetProtein, targetCarbs, targetFats, dailyBudget },
      { upsert: true, new: true, runValidators: true }
    );

    // Also reset all nutrition progress for this user (new plan = fresh start)
    await Nutrition.deleteMany({ userId });

    res.json({ success: true, message: 'Meal plan saved successfully!', planId: plan._id, totalDays: days.length });
  } catch (err) {
    console.error('Save meal plan error:', err);
    res.status(500).json({ success: false, message: 'Server error saving meal plan.' });
  }
});

// ─── GET USER'S MEAL PLAN ────────────────────────────────────
router.get('/get', async (req, res) => {
  try {
    const plan = await MealPlan.findOne({ userId: req.user.id });
    if (!plan) {
      return res.json({ message: 'No meal plan found.', plan: null });
    }
    res.json({ plan });
  } catch (err) {
    console.error('Get meal plan error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ─── COMPLETE A DAY (AUTO-CALCULATE FROM MEAL PLAN) ──────────
router.post('/complete-day', async (req, res) => {
  try {
    const { day } = req.body;
    const userId = req.user.id;

    if (!day || day < 1) {
      return res.status(400).json({ message: 'Valid day number is required.' });
    }

    // Get user's meal plan
    const plan = await MealPlan.findOne({ userId });
    if (!plan) {
      return res.status(400).json({ message: 'No meal plan found. Please generate one first.' });
    }

    // Find the day's meals
    const dayMeal = plan.days.find(d => d.day === day);
    if (!dayMeal) {
      return res.status(400).json({ message: `Day ${day} not found in meal plan.` });
    }

    // Check if previous day is completed (except day 1)
    if (day > 1) {
      const prevDay = await Nutrition.findOne({ userId, day: day - 1 });
      if (!prevDay || !prevDay.completed) {
        return res.status(400).json({ message: `Please complete Day ${day - 1} first.` });
      }
    }

    // Check if already completed
    const existing = await Nutrition.findOne({ userId, day });
    if (existing && existing.completed) {
      return res.status(400).json({ message: `Day ${day} is already completed.` });
    }

    // Generate realistic variation (±50 to ±250 kcal) to make tracking look natural
    let variance = Math.floor(Math.random() * 201) + 50; // 50 to 250
    if (Math.random() < 0.5) variance *= -1;
    const randomizedCalories = Math.max(500, dayMeal.t_cal + variance);

    // Auto-calculate nutrition from meal plan — NO manual input
    const nutritionData = await Nutrition.findOneAndUpdate(
      { userId, day },
      {
        userId,
        day,
        calories: randomizedCalories,
        protein: dayMeal.t_pro,
        carbs: dayMeal.t_car,
        fats: dayMeal.t_fat,
        cost: dayMeal.t_cost,
        targetCalories: plan.targetCalories,
        targetProtein: plan.targetProtein,
        targetCarbs: plan.targetCarbs,
        targetFats: plan.targetFats,
        completed: true,
        date: new Date()
      },
      { upsert: true, new: true }
    );

    // Mark day as completed in the meal plan too
    dayMeal.completed = true;
    await plan.save();

    res.json({
      message: `Day ${day} completed! ✅`,
      data: nutritionData,
      meals: {
        breakfast: dayMeal.breakfast,
        lunch: dayMeal.lunch,
        dinner: dayMeal.dinner,
        snack: dayMeal.snack
      }
    });
  } catch (err) {
    console.error('Complete day error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
