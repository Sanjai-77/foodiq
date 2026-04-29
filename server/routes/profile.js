const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(auth);

// ─── SAVE / UPDATE USER PROFILE ──────────────────────────────
router.post('/save', async (req, res) => {
  try {
    const { age, gender, height, weight, activity, goal, budget, diet,
            targetCalories, targetProtein, targetCarbs, targetFats } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    user.profile = {
      age: age || user.profile?.age,
      gender: gender || user.profile?.gender,
      height: height || user.profile?.height,
      weight: weight || user.profile?.weight,
      activity: activity || user.profile?.activity,
      goal: goal || user.profile?.goal,
      budget: budget || user.profile?.budget,
      diet: diet || user.profile?.diet,
      targetCalories: targetCalories || user.profile?.targetCalories,
      targetProtein: targetProtein || user.profile?.targetProtein,
      targetCarbs: targetCarbs || user.profile?.targetCarbs,
      targetFats: targetFats || user.profile?.targetFats
    };

    await user.save({ validateBeforeSave: false });

    res.json({
      message: 'Profile saved successfully.',
      profile: user.profile
    });
  } catch (err) {
    console.error('Save profile error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ─── GET USER PROFILE ────────────────────────────────────────
router.get('/me', async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -resetToken -resetTokenExpiry');
    if (!user) return res.status(404).json({ message: 'User not found.' });

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profile: user.profile || {}
      }
    });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
