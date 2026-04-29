const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: 2,
    maxlength: 50
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6
  },
  resetToken: {
    type: String,
    default: null
  },
  resetTokenExpiry: {
    type: Date,
    default: null
  },
  // ─── User Profile (for nutrition target calculations) ─────
  profile: {
    age: { type: Number, default: null },
    gender: { type: String, enum: ['male', 'female', null], default: null },
    height: { type: Number, default: null },
    weight: { type: Number, default: null },
    activity: { type: String, enum: ['low', 'moderate', 'high', null], default: null },
    goal: { type: String, enum: ['weight-loss', 'maintenance', 'muscle-gain', null], default: null },
    budget: { type: Number, default: null },
    diet: { type: String, enum: ['veg', 'nonveg', null], default: null },
    // Computed targets (set when meal plan is generated)
    targetCalories: { type: Number, default: null },
    targetProtein: { type: Number, default: null },
    targetCarbs: { type: Number, default: null },
    targetFats: { type: Number, default: null }
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
