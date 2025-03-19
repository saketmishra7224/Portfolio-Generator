const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, personalInfo } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ 
        success: false,
        message: 'User already exists' 
      });
    }

    // Create new user
    user = new User({
      email,
      password,
      personalInfo
    });

    // Save user to database
    await user.save();

    // Generate token
    const token = user.generateAuthToken();

    // Return user data and token
    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          personalInfo: user.personalInfo
        },
        token
      }
    });
  } catch (error) {
    console.error('Register error:', error.message);
    res.status(500).json({ 
      success: false,
      message: 'Server error during registration' 
    });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }

    // Check if password is correct
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }

    // Generate token
    const token = user.generateAuthToken();

    // Return user data without sensitive information
    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          personalInfo: user.personalInfo,
          education: user.education,
          skills: user.skills,
          projects: user.projects,
          socialLinks: user.socialLinks
        },
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ 
      success: false,
      message: 'Server error during login' 
    });
  }
});

/**
 * @route   GET /api/auth/user
 * @desc    Get current user
 * @access  Private
 */
router.get('/user', auth, async (req, res) => {
  try {
    // req.user is set in auth middleware
    res.json({
      success: true,
      data: {
        user: req.user
      }
    });
  } catch (error) {
    console.error('Get user error:', error.message);
    res.status(500).json({ 
      success: false,
      message: 'Server error retrieving user data' 
    });
  }
});

module.exports = router; 