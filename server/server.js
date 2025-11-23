const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Set mongoose strictQuery option to suppress deprecation warning
mongoose.set('strictQuery', false);

// Middleware
app.use(cors({
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);

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
  
  if (err.name === 'MongoServerError') {
    if (err.code === 11000) {
      errorMessage = 'Duplicate key error. This email might already be registered.';
    } else {
      errorMessage = 'Database error. MongoDB might not be running properly.';
    }
  } else if (err.name === 'ValidationError') {
    errorMessage = 'Validation error. Please check your input data.';
  } else if (err.name === 'MongooseError') {
    errorMessage = 'Database connection error. MongoDB might not be running.';
  }
  
  res.status(500).json({ 
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