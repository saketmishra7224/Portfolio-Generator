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
    
    console.log('Registration attempt with email:', email);
    
    // Validate required fields
    if (!email || !password || !personalInfo) {
      console.error('Registration error: Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    if (!personalInfo.name || !personalInfo.phone) {
      console.error('Registration error: Missing personal info fields');
      return res.status(400).json({
        success: false,
        message: 'Name and phone are required'
      });
    }
    
    // Ensure email is valid format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error('Registration error: Invalid email format');
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      console.log('Registration failed: User already exists with email:', email);
      return res.status(400).json({ 
        success: false,
        message: 'User already exists' 
      });
    }

    // Create new user with initialized fields
    user = new User({
      email,
      password,
      personalInfo: {
        name: personalInfo.name,
        email: email,  // Ensure email consistency
        phone: personalInfo.phone,
        profileImage: personalInfo.profileImage || null
      },
      education: {},
      skills: [],
      projects: [],
      socialLinks: { github: '' }
    });

    console.log('Saving new user to database...');
    
    // Save user to database
    await user.save();
    console.log('User successfully saved to database with ID:', user._id);

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
    console.error('Registration error details:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // Provide more specific error messages based on the error type
    let errorMessage = 'Server error during registration';
    
    if (error.name === 'ValidationError') {
      errorMessage = 'Validation error: ' + error.message;
    } else if (error.name === 'MongoServerError' && error.code === 11000) {
      errorMessage = 'Email already in use';
    } else if (error.name === 'MongooseError') {
      errorMessage = 'Database error: ' + error.message;
    }
    
    res.status(500).json({ 
      success: false,
      message: errorMessage 
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

    console.log(`Login attempt for email: ${email}`);

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      console.log(`Login failed: User with email ${email} not found`);
      return res.status(400).json({ 
        success: false,
        message: 'User not found. Please register first.' 
      });
    }

    // Check if password is correct
    console.log(`User found, validating password...`);
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log(`Login failed: Invalid password for ${email}`);
      return res.status(400).json({ 
        success: false,
        message: 'Invalid password. Please try again.' 
      });
    }

    // Generate token
    console.log(`Login successful for ${email}, generating token...`);
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
      message: 'Server error during login. Please try again.' 
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

// Add a test endpoint to check auth service
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Auth service is working'
  });
});

module.exports = router; 