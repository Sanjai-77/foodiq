const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema({
  foodName: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  recipe_name: {
    type: String,
    required: true
  },
  ingredients: [{
    name: String,
    quantity: String
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Recipe', recipeSchema);
