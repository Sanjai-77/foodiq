const mongoose = require('mongoose');

const mealItemSchema = new mongoose.Schema({
  name: String,
  icon: String,
  qty: Number,
  kcal: Number,
  protein: Number,
  carbs: Number,
  fat: Number,
  price_per_kg: Number,
  cost: Number,
  c_cal: Number,
  c_pro: Number,
  c_car: Number,
  c_fat: Number,
  c_cost: Number
}, { _id: false });

const dayMealSchema = new mongoose.Schema({
  day: { type: Number, required: true },
  breakfast: mealItemSchema,
  lunch: mealItemSchema,
  dinner: mealItemSchema,
  snack: mealItemSchema,
  t_cal: Number,
  t_pro: Number,
  t_car: Number,
  t_fat: Number,
  t_cost: Number,
  completed: { type: Boolean, default: false }
}, { _id: false });

const mealPlanSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  totalDays: { type: Number, default: 30 },
  targetCalories: Number,
  targetProtein: Number,
  targetCarbs: Number,
  targetFats: Number,
  dailyBudget: Number,
  days: [dayMealSchema]
}, {
  timestamps: true
});

module.exports = mongoose.model('MealPlan', mealPlanSchema);
