const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const ProjectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  technologies: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  link: {
    type: String,
    trim: true
  }
});

const EducationSchema = new mongoose.Schema({
  college: {
    type: String,
    default: '',
    trim: true
  },
  degree: {
    type: String,
    default: '',
    trim: true
  },
  specialization: {
    type: String,
    default: '',
    trim: true
  },
  cgpa: {
    type: String,
    default: '',
    trim: true
  },
  summary: {
    type: String,
    default: ''
  }
}, { _id: false });

const SocialLinksSchema = new mongoose.Schema({
  github: {
    type: String,
    default: '',
    trim: true
  }
}, { _id: false });

const ThemeSchema = new mongoose.Schema({
  template: {
    type: String,
    default: 'minimal',
    trim: true
  },
  accentColor: {
    type: String,
    default: '#2563eb',
    trim: true
  },
  font: {
    type: String,
    default: 'Inter',
    trim: true
  }
}, { _id: false });

const PersonalInfoSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  profileImage: {
    type: String,
    default: null
  }
}, { _id: false });

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minLength: 6
  },
  personalInfo: {
    type: PersonalInfoSchema,
    required: true
  },
  education: {
    type: EducationSchema,
    default: () => ({})
  },
  skills: {
    type: [String],
    default: []
  },
  projects: {
    type: [ProjectSchema],
    default: []
  },
  socialLinks: {
    type: SocialLinksSchema,
    default: () => ({})
  },
  theme: {
    type: ThemeSchema,
    default: () => ({})
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  try {
    if (this.isModified('password')) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Compare passwords
UserSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    console.error('Password comparison error:', error);
    return false;
  }
};

// Generate JWT token
UserSchema.methods.generateAuthToken = function() {
  try {
    return jwt.sign(
      { id: this._id },
      process.env.JWT_SECRET || 'default_jwt_secret',
      { expiresIn: '7d' }
    );
  } catch (error) {
    console.error('Token generation error:', error);
    throw error;
  }
};

const User = mongoose.model('User', UserSchema);

module.exports = User; 