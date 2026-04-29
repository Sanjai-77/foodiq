const mongoose = require('mongoose');

const nutritionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  day: {
    type: Number,
    required: [true, 'Day number is required'],
    min: 1
  },
  calories: {
    type: Number,
    required: true,
    default: 0
  },
  protein: {
    type: Number,
    required: true,
    default: 0
  },
  carbs: {
    type: Number,
    required: true,
    default: 0
  },
  fats: {
    type: Number,
    required: true,
    default: 0
  },
  cost: {
    type: Number,
    default: 0
  },
  targetCalories: {
    type: Number,
    default: 0
  },
  targetProtein: {
    type: Number,
    default: 0
  },
  targetCarbs: {
    type: Number,
    default: 0
  },
  targetFats: {
    type: Number,
    default: 0
  },
  completed: {
    type: Boolean,
    default: false
  },
  date: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index for unique user-day combination
nutritionSchema.index({ userId: 1, day: 1 }, { unique: true });

module.exports = mongoose.model('Nutrition', nutritionSchema);
