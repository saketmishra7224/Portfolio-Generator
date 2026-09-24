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
    
    console.log('Registration attempt received');
    
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
      console.log('Registration failed: user already exists');
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

    console.log('Login attempt received');

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      console.log('Login failed: user not found');
      return res.status(400).json({ 
        success: false,
        message: 'User not found. Please register first.' 
      });
    }

    // Google-only accounts have no local password — direct them to Google Sign-In
    if (user.authProvider === 'google' && !user.password) {
      console.log('Login failed: Google-only account used password login');
      return res.status(400).json({
        success: false,
        code: 'GOOGLE_ACCOUNT',
        message: 'This account was created with Google. Please use "Continue with Google" to sign in.'
      });
    }

    // Check if password is correct
    console.log(`User found, validating password...`);
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log('Login failed: invalid password');
      return res.status(400).json({ 
        success: false,
        message: 'Invalid password. Please try again.' 
      });
    }

    // Generate token
    console.log('Login successful, generating token...');
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
          educations: user.educations,
          experiences: user.experiences,
          skills: user.skills,
          skillCategories: user.skillCategories,
          projects: user.projects,
          socialLinks: user.socialLinks,
          certifications: user.certifications,
          achievements: user.achievements,
          languages: user.languages,
          publications: user.publications,
          volunteering: user.volunteering,
          leadership: user.leadership,
          sectionsEnabled: user.sectionsEnabled,
          sectionOrder: user.sectionOrder
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
    // req.user is set in auth middleware. Return an explicit allowlist so
    // internal identifiers (Google provider ID, session generation) never
    // leave the server — the client only needs them as booleans/values.
    const u = req.user.toObject ? req.user.toObject() : req.user;
    delete u.password;
    delete u.googleId;
    delete u.tokenVersion;
    res.json({
      success: true,
      data: {
        user: { ...u, googleConnected: !!(req.user.googleId) }
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

/**
 * @route   POST /api/auth/change-password
 * @desc    Change password (email/password accounts only). Requires the
 *          current password; Google-only accounts have none to change.
 * @access  Private
 */
router.post('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }
    if (String(newPassword).length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters'
      });
    }

    // req.user excludes the hash; reload with it for verification.
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User no longer exists' });
    }
    if (!user.password) {
      return res.status(400).json({
        success: false,
        code: 'GOOGLE_ACCOUNT',
        message: 'This account signs in with Google and has no password to change.'
      });
    }
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save(); // pre('save') hashes when modified
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error.message);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

/**
 * @route   POST /api/auth/logout-all
 * @desc    Invalidate every session for this account (all devices/browsers),
 *          including the calling session. The client should discard its token
 *          and return to the sign-in screen afterwards.
 * @access  Private
 */
router.post('/logout-all', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User no longer exists' });
    }
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();
    res.json({ success: true, message: 'Signed out of all sessions' });
  } catch (error) {
    console.error('Logout-all error:', error.message);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

/**
 * @route   GET /api/auth/google/client-id
 * @desc    Get Google OAuth Client ID for frontend button initialization.
 *          Public identifier only; never returns client secret.
 * @access  Public
 */
router.get('/google/client-id', (req, res) => {
  res.json({
    success: true,
    clientId: process.env.GOOGLE_CLIENT_ID || ''
  });
});

/**
 * @route   POST /api/auth/google
 * @desc    Sign up / sign in with Google (Google Identity Services ID-token flow).
 *          The frontend sends ONLY the Google-issued ID token (`idToken`).
 *          The server verifies signature, issuer, audience, expiry and email
 *          server-side, then issues the application's own JWT — the same
 *          session mechanism as email/password auth. Never trust a raw
 *          user ID or email supplied by the frontend.
 * @access  Public
 */
router.post('/google', async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken || typeof idToken !== 'string') {
      return res.status(400).json({
        success: false,
        code: 'INVALID_TOKEN',
        message: 'Google sign-in token is missing. Please try again.'
      });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.error('Google auth attempted but GOOGLE_CLIENT_ID is not configured');
      return res.status(500).json({
        success: false,
        code: 'GOOGLE_NOT_CONFIGURED',
        message: 'Google sign-in is not configured on the server. Please use email/password.'
      });
    }

    // Verify the token against Google's public keys. This validates the
    // cryptographic signature, expiry, issuer and audience in one step.
    const { OAuth2Client } = require('google-auth-library');
    const client = new OAuth2Client(clientId);
    let payload;
    try {
      const ticket = await client.verifyIdToken({ idToken, audience: clientId });
      payload = ticket.getPayload();
    } catch (verifyError) {
      console.error('Google token verification failed:', verifyError.message);
      return res.status(401).json({
        success: false,
        code: 'INVALID_TOKEN',
        message: 'Google sign-in expired or is invalid. Please try again.'
      });
    }

    // Explicit allow-list for issuers (defense in depth; the library checks
    // this too, but we never rely on a single layer for identity).
    const allowedIssuers = ['accounts.google.com', 'https://accounts.google.com'];
    if (!payload || !allowedIssuers.includes(payload.iss)) {
      console.error('Google token rejected: unexpected issuer', payload && payload.iss);
      return res.status(401).json({
        success: false,
        code: 'INVALID_TOKEN',
        message: 'Google sign-in could not be verified. Please try again.'
      });
    }

    const googleId = payload.sub;
    const email = (payload.email || '').trim().toLowerCase();
    if (!googleId || !email) {
      return res.status(401).json({
        success: false,
        code: 'INVALID_TOKEN',
        message: 'Google account is missing required identity information.'
      });
    }
    const googleEmailVerified = payload.email_verified === true;
    const googleName = (payload.name || '').trim();
    const googlePicture = payload.picture || null;

    // 1) Stable identity first: an existing Google-linked account wins,
    //    even if the user changed their Gmail address since linking.
    let user = await User.findOne({ googleId });
    let isNewUser = false;
    let linked = false;

    if (user) {
      // Keep the stored email usable: adopt the new address only when no
      // other account already owns it (prevents silent account takeover).
      if (user.email !== email) {
        const emailOwner = await User.findOne({ email });
        if (emailOwner && String(emailOwner._id) !== String(user._id)) {
          return res.status(409).json({
            success: false,
            code: 'ACCOUNT_CONFLICT',
            message: 'This Google account is already linked, but its email address now belongs to another account. Please sign in with email/password or contact support.'
          });
        }
        user.email = email;
        user.personalInfo.email = email;
      }
      if (googleEmailVerified) user.emailVerified = true;
      // Fill in gaps only — never overwrite user-edited profile data.
      if (!user.personalInfo.name && googleName) user.personalInfo.name = googleName;
      if (!user.personalInfo.profileImage && googlePicture) user.personalInfo.profileImage = googlePicture;
      await user.save();
    } else {
      // 2) Email match: safe account linking. A local account keeps its
      //    password (password login keeps working) and gains Google sign-in.
      const existingByEmail = await User.findOne({ email });
      if (existingByEmail) {
        if (existingByEmail.googleId && existingByEmail.googleId !== googleId) {
          // A *different* Google identity already owns this email — refuse
          // to merge rather than silently overwriting either account.
          return res.status(409).json({
            success: false,
            code: 'ACCOUNT_CONFLICT',
            message: 'This email is already linked to a different Google account. Please sign in with the originally linked Google account.'
          });
        }
        existingByEmail.googleId = googleId;
        if (googleEmailVerified) existingByEmail.emailVerified = true;
        if (!existingByEmail.personalInfo.name && googleName) {
          existingByEmail.personalInfo.name = googleName;
        }
        if (!existingByEmail.personalInfo.profileImage && googlePicture) {
          existingByEmail.personalInfo.profileImage = googlePicture;
        }
        await existingByEmail.save();
        user = existingByEmail;
        linked = true;
      } else {
        // 3) Brand-new Google user. No password is set; local-password login
        //    will direct them to "Continue with Google".
        user = new User({
          email,
          authProvider: 'google',
          googleId,
          emailVerified: googleEmailVerified,
          personalInfo: {
            name: googleName || email.split('@')[0],
            email,
            phone: '',
            profileImage: googlePicture
          },
          education: {},
          skills: [],
          projects: [],
          socialLinks: { github: '' }
        });
        await user.save();
        isNewUser = true;
      }
    }

    const token = user.generateAuthToken();

    return res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          personalInfo: user.personalInfo,
          education: user.education,
          educations: user.educations,
          experiences: user.experiences,
          skills: user.skills,
          skillCategories: user.skillCategories,
          projects: user.projects,
          socialLinks: user.socialLinks,
          certifications: user.certifications,
          achievements: user.achievements,
          languages: user.languages,
          publications: user.publications,
          volunteering: user.volunteering,
          leadership: user.leadership,
          sectionsEnabled: user.sectionsEnabled,
          sectionOrder: user.sectionOrder,
          authProvider: user.authProvider,
          emailVerified: user.emailVerified
        },
        token,
        isNewUser,
        linked
      }
    });
  } catch (error) {
    console.error('Google auth error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error during Google sign-in. Please try again.'
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
