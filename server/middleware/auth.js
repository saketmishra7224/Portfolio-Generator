const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getJwtSecret } = require('../utils/jwtSecret');

/**
 * Middleware to authenticate user using JWT token
 */
const auth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'No authentication token, access denied' 
      });
    }

    // Verify token
    const decoded = jwt.verify(token, getJwtSecret());
    
    // Find user by id
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token is valid, but user no longer exists'
      });
    }

    // Session generation check ("logout all sessions").
    // - Tokens carrying a tv claim must match the account generation.
    // - Tokens issued before versions existed carry no tv claim: accepted
    //   while the account never used logout-all (generation still 0), so
    //   existing sessions survive deployment; rejected once logout-all has
    //   ever run, so it genuinely ends every session.
    const userGen = user.tokenVersion || 0;
    if (decoded.tv === undefined) {
      if (userGen > 0) {
        return res.status(401).json({
          success: false,
          message: 'Session expired. Please sign in again.'
        });
      }
    } else if (decoded.tv !== userGen) {
      return res.status(401).json({
        success: false,
        message: 'Session expired. Please sign in again.'
      });
    }

    // Add user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    res.status(401).json({ 
      success: false,
      message: 'Token is not valid'
    });
  }
};

module.exports = auth; 