const express = require('express');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const { trackLogin, trackLogout, trackProfileUpdate, logCustomActivity } = require('../middleware/activity');

const router = express.Router();

// Validation schemas
const registerSchema = Joi.object({
  first_name: Joi.string().min(2).max(50).required(),
  last_name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(/^[0-9+\-\s()]+$/).required(),
  password: Joi.string().min(6).required()
});

const loginSchema = Joi.object({
  username: Joi.string().required(), // Can be email or phone
  password: Joi.string().required()
});

// Helper function to generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  });
};

// @route   POST /accounts/registration
// @desc    Register user
// @access  Public
router.post('/registration', async (req, res, next) => {
  try {
    // Validate input
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const { first_name, last_name, email, phone, password } = value;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { phone }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User with this email or phone already exists'
      });
    }

    // Create user
    const user = await User.create({
      first_name,
      last_name,
      email,
      phone,
      password
    });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      access_token: token,
      token_type: 'Bearer',
      user: user.toSafeObject()
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /accounts/login/
// @desc    Login user
// @access  Public
router.post('/login/', trackLogin, async (req, res, next) => {
  try {
    // Validate input
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const { username, password } = value;

    // Check for admin credentials first
    if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
      // Find or create admin user
      let adminUser = await User.findOne({ email: 'admin@nibret.com' });

      if (!adminUser) {
        adminUser = await User.create({
          first_name: 'Admin',
          last_name: 'User',
          email: 'admin@nibret.com',
          phone: process.env.ADMIN_USERNAME,
          password: process.env.ADMIN_PASSWORD,
          role: 'ADMIN'
        });
      }

      const token = generateToken(adminUser._id);

      return res.json({
        success: true,
        access_token: token,
        token_type: 'Bearer',
        user: adminUser.toSafeObject()
      });
    }

    // Find user by email or phone
    const user = await User.findByEmailOrPhone(username);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        error: 'Account is deactivated'
      });
    }

    // Update login tracking
    user.last_login = new Date();
    user.login_count = (user.login_count || 0) + 1;
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      access_token: token,
      token_type: 'Bearer',
      user: user.toSafeObject()
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /accounts/users/me
// @desc    Get current user
// @access  Private
router.get('/users/me', protect, async (req, res, next) => {
  try {
    res.json({
      success: true,
      user: req.user.toSafeObject()
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /accounts/users
// @desc    Get all users (admin only)
// @access  Private/Admin
router.get('/users', protect, authorize('ADMIN'), async (req, res, next) => {
  try {
    const users = await User.find({}).sort({ created_at: -1 });

    res.json({
      success: true,
      users: users
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /accounts/user/
// @desc    Update current user profile
// @access  Private
router.put('/user/', protect, async (req, res, next) => {
  try {
    const updateSchema = Joi.object({
      first_name: Joi.string().min(2).max(50),
      last_name: Joi.string().min(2).max(50),
      email: Joi.string().email(),
      phone: Joi.string().pattern(/^[0-9+\-\s()]+$/)
    });

    const { error, value } = updateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      value,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      user: user.toSafeObject()
    });
  } catch (error) {
    next(error);
  }
});

// @route   PATCH /accounts/user/:id
// @desc    Update user status (admin only)
// @access  Private/Admin
router.patch('/user/:id', protect, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { is_active } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { is_active },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User status updated successfully',
      user: user.toSafeObject()
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
