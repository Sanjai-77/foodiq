const mongoose = require('mongoose');

const foodItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  kcal: { type: Number, required: true },
  protein: { type: Number, required: true },
  carbs: { type: Number, required: true },
  fat: { type: Number, required: true },
  price_per_kg: { type: Number, required: true },
  type: { type: String, required: true }, // veg, nonveg
  icon: { type: String, required: true },
  category: { type: String, required: true } // breakfast, lunch, dinner, snacks
}, { timestamps: true });

module.exports = mongoose.model('FoodItem', foodItemSchema);
