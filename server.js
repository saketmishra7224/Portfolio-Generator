const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/portfolioGenerator')
.then(() => console.log('MongoDB connected successfully'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  console.log('Make sure MongoDB service is running. You can start it by running:');
  console.log('  1. Open Command Prompt as Administrator');
  console.log('  2. Run: "C:\\Program Files\\MongoDB\\Server\\8.0\\bin\\mongod.exe" --dbpath="C:\\data\\db"');
  console.log('If database directory does not exist, create it first with: mkdir C:\\data\\db');
});

// User Schema
const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  personalInfo: {
    name: String,
    email: String,
    phone: String
  },
  education: {
    college: String,
    degree: String,
    specialization: String,
    cgpa: String,
    summary: String
  },
  skills: [String],
  projects: [{
    title: String,
    description: String,
    technologies: String,
    link: String
  }],
  socialLinks: {
    github: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const User = mongoose.model('User', UserSchema);

// JWT Secret
const JWT_SECRET = 'your_jwt_secret_key'; // In production, use environment variables

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'API is working!' 
  });
});

// Routes
// Register new user
app.post('/api/auth/register', async (req, res) => {
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

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    user = new User({
      email,
      password: hashedPassword,
      personalInfo: {
        ...personalInfo,
        email
      },
      education: {
        college: '',
        degree: '',
        specialization: '',
        cgpa: '',
        summary: ''
      },
      skills: [],
      projects: [],
      socialLinks: {
        github: ''
      }
    });

    await user.save();

    // Create JWT token
    const payload = {
      user: {
        id: user.id
      }
    };

    jwt.sign(
      payload,
      JWT_SECRET,
      { expiresIn: '1h' },
      (err, token) => {
        if (err) throw err;
        res.json({
          success: true,
          data: {
            token,
            user: {
              id: user.id,
              email: user.email,
              personalInfo: user.personalInfo,
              education: user.education,
              skills: user.skills,
              projects: user.projects,
              socialLinks: user.socialLinks
            }
          }
        });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// Login user
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Create JWT token
    const payload = {
      user: {
        id: user.id
      }
    };

    jwt.sign(
      payload,
      JWT_SECRET,
      { expiresIn: '1h' },
      (err, token) => {
        if (err) throw err;
        res.json({
          success: true,
          data: {
            token,
            user: {
              id: user.id,
              email: user.email,
              personalInfo: user.personalInfo,
              education: user.education,
              skills: user.skills,
              projects: user.projects,
              socialLinks: user.socialLinks
            }
          }
        });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// Auth middleware
const auth = (req, res, next) => {
  // Get token from header
  const token = req.header('Authorization')?.replace('Bearer ', '');

  // Check if no token
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'No token, authorization denied' 
    });
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ 
      success: false, 
      message: 'Token is not valid' 
    });
  }
};

// Get current user
app.get('/api/auth/user', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json({
      success: true,
      data: { user }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// Update profile
app.put('/api/profile', auth, async (req, res) => {
  try {
    const { personalInfo, education, skills, projects, socialLinks } = req.body;
    
    // Find user by id
    let user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Update user fields
    if (personalInfo) user.personalInfo = personalInfo;
    if (education) user.education = education;
    if (skills) user.skills = skills;
    if (projects) user.projects = projects;
    if (socialLinks) user.socialLinks = socialLinks;

    await user.save();

    res.json({
      success: true,
      data: {
        profile: user
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// Get profile
app.get('/api/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.json({
      success: true,
      data: {
        profile: user
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// Start server with port fallback
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    const newPort = PORT + 1;
    console.log(`Port ${PORT} is busy, trying port ${newPort}...`);
    server.close();
    app.listen(newPort, () => console.log(`Server running on port ${newPort}`));
  } else {
    console.error('Server error:', err);
  }
}); 