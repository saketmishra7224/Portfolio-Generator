const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

// Fail fast in production without a real JWT secret: falling back to a
// hardcoded default would let anyone forge sessions.
if (isProduction && !process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET is not set. Refusing to start in production.');
  process.exit(1);
}
if (!process.env.JWT_SECRET) {
  console.warn('WARNING: JWT_SECRET is not set. Using an insecure default — development only.');
}

// Initialize Express app
const app = express();

// Behind Render/Heroku-style proxies so rate limiting sees real client IPs.
app.set('trust proxy', 1);

// Set mongoose strictQuery option to suppress deprecation warning
mongoose.set('strictQuery', false);

// Security headers (helmet defaults; contentSecurityPolicy disabled because
// the served CRA bundle uses inline scripts/styles).
app.use(helmet({ contentSecurityPolicy: false }));

// CORS: same-origin needs no CORS headers. Cross-origin is only allowed for
// explicitly configured origins (comma-separated CORS_ORIGIN). Production
// default denies cross-origin API access.
const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);
app.use(cors({
  origin: allowedOrigins.length > 0 ? allowedOrigins : (isProduction ? false : '*'),
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Brute-force protection for authentication endpoints (generous limits so
// normal use and automated tests are unaffected).
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many authentication attempts. Please try again in 15 minutes.' }
});
app.use('/api/auth/', authLimiter);

// General API abuse protection.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please slow down and try again.' }
});
app.use('/api/', apiLimiter);

// Payload limit covers base64 profile images (client caps uploads at 2MB)
// with headroom for large resumes; anything bigger is rejected (413).
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Connect to MongoDB with improved error handling
console.log('Attempting to connect to MongoDB...');
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/portfolio-generator', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
  socketTimeoutMS: 45000, // Close sockets after 45s
})
.then(() => console.log('MongoDB connected successfully!'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  console.error('\n\n======= IMPORTANT MONGODB ERROR INFORMATION =======');
  console.error('MongoDB connection failed. This may be because:');
  console.error('1. MongoDB is not installed');
  console.error('2. MongoDB service is not running');
  console.error('3. MongoDB connection string is incorrect');
  console.error('\nTo install MongoDB:');
  console.error('1. Download from https://www.mongodb.com/try/download/community');
  console.error('2. Install and set up as a service');
  console.error('\nTo start MongoDB on Windows:');
  console.error('1. Open Command Prompt as Administrator');
  console.error('2. Run: net start MongoDB');
  console.error('   Or navigate to MongoDB bin directory and run: mongod --dbpath="C:\\data\\db"');
  console.error('\nThe server will continue running but database operations will fail.');
  console.error('=====================================================\n\n');
});

// Add MongoDB connection test endpoint
app.get('/api/db-status', (req, res) => {
  const state = mongoose.connection.readyState;
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  
  res.json({
    success: state === 1,
    status: states[state] || 'unknown',
    message: state === 1 
      ? 'MongoDB is connected and working properly' 
      : 'MongoDB is not connected. Check server logs for details.'
  });
});

// Import routes
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const resumeRoutes = require('./routes/resumes');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/resumes', resumeRoutes);

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/build', 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('SERVER ERROR:', err.stack);
  
  // Provide more helpful error messages based on error type
  let errorMessage = 'Server Error';
  let statusCode = 500;
  
  if (err.type === 'entity.too.large' || err.name === 'PayloadTooLargeError') {
    errorMessage = 'Request is too large. Please upload a smaller image (max 2MB).';
    statusCode = 413;
  } else if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    errorMessage = 'Malformed request. The server could not parse the JSON body.';
    statusCode = 400;
  } else if (err.name === 'MongoServerError') {
    if (err.code === 11000) {
      errorMessage = 'Duplicate key error. This email might already be registered.';
    } else {
      errorMessage = 'Database error. MongoDB might not be running properly.';
    }
  } else if (err.name === 'ValidationError') {
    errorMessage = 'Validation error. Please check your input data.';
    statusCode = 400;
  } else if (err.name === 'MongooseError') {
    errorMessage = 'Database connection error. MongoDB might not be running.';
  }
  
  res.status(statusCode).json({ 
    success: false,
    message: errorMessage,
    error: process.env.NODE_ENV === 'production' ? 'An error occurred' : err.message
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
  console.log(`To test MongoDB connection, visit: http://localhost:${PORT}/api/db-status`);
});

module.exports = app; 