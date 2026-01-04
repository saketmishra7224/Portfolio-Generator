const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// Allowed template names for validation
const ALLOWED_TEMPLATES = ['minimal', 'modern', 'classic', 'professional'];

/**
 * @route   GET /api/profile
 * @desc    Get current user's profile
 * @access  Private
 */
router.get('/', auth, async (req, res) => {
  try {
    // Return user profile (req.user is set in auth middleware)
    res.json({
      success: true,
      data: {
        profile: {
          personalInfo: req.user.personalInfo,
          education: req.user.education,
          skills: req.user.skills,
          projects: req.user.projects,
          socialLinks: req.user.socialLinks,
          theme: req.user.theme
        }
      }
    });
  } catch (error) {
    console.error('Get profile error:', error.message);
    res.status(500).json({ 
      success: false,
      message: 'Server error retrieving profile' 
    });
  }
});

/**
 * @route   PUT /api/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/', auth, async (req, res) => {
  try {
    const { personalInfo, education, skills, projects, socialLinks, theme } = req.body;

    // Find user (from auth middleware)
    const user = req.user;

    // Update fields if provided
    if (personalInfo) user.personalInfo = personalInfo;
    if (education) user.education = education;
    if (skills) user.skills = skills;
    if (projects) user.projects = projects;
    if (socialLinks) user.socialLinks = socialLinks;
    
    // Handle theme updates with validation
    if (theme) {
      // Validate template if provided
      if (theme.template && !ALLOWED_TEMPLATES.includes(theme.template)) {
        return res.status(400).json({
          success: false,
          message: `Invalid template. Allowed values: ${ALLOWED_TEMPLATES.join(', ')}`
        });
      }
      
      // Support partial theme updates
      user.theme = {
        ...user.theme.toObject(),
        ...theme
      };
    }

    // Save updated user
    await user.save();

    // Return updated profile
    res.json({
      success: true,
      data: {
        profile: {
          personalInfo: user.personalInfo,
          education: user.education,
          skills: user.skills,
          projects: user.projects,
          socialLinks: user.socialLinks,
          theme: user.theme
        }
      }
    });
  } catch (error) {
    console.error('Update profile error:', error.message);
    res.status(500).json({ 
      success: false,
      message: 'Server error updating profile' 
    });
  }
});

/**
 * @route   PUT /api/profile/education
 * @desc    Update education details
 * @access  Private
 */
router.put('/education', auth, async (req, res) => {
  try {
    const { education } = req.body;

    // Find user (from auth middleware)
    const user = req.user;

    // Update education
    user.education = education;

    // Save updated user
    await user.save();

    // Return updated profile
    res.json({
      success: true,
      data: {
        education: user.education
      }
    });
  } catch (error) {
    console.error('Update education error:', error.message);
    res.status(500).json({ 
      success: false,
      message: 'Server error updating education' 
    });
  }
});

/**
 * @route   PUT /api/profile/skills
 * @desc    Update skills
 * @access  Private
 */
router.put('/skills', auth, async (req, res) => {
  try {
    const { skills } = req.body;

    // Find user (from auth middleware)
    const user = req.user;

    // Update skills
    user.skills = skills;

    // Save updated user
    await user.save();

    // Return updated profile
    res.json({
      success: true,
      data: {
        skills: user.skills
      }
    });
  } catch (error) {
    console.error('Update skills error:', error.message);
    res.status(500).json({ 
      success: false,
      message: 'Server error updating skills' 
    });
  }
});

/**
 * @route   POST /api/profile/projects
 * @desc    Add a new project
 * @access  Private
 */
router.post('/projects', auth, async (req, res) => {
  try {
    const project = req.body;

    // Find user (from auth middleware)
    const user = req.user;

    // Add new project
    user.projects.push(project);

    // Save updated user
    await user.save();

    // Return updated projects
    res.json({
      success: true,
      data: {
        projects: user.projects
      }
    });
  } catch (error) {
    console.error('Add project error:', error.message);
    res.status(500).json({ 
      success: false,
      message: 'Server error adding project' 
    });
  }
});

/**
 * @route   PUT /api/profile/projects/:id
 * @desc    Update a specific project
 * @access  Private
 */
router.put('/projects/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const projectUpdate = req.body;

    // Find user (from auth middleware)
    const user = req.user;

    // Find project index
    const projectIndex = user.projects.findIndex(p => p._id.toString() === id);

    if (projectIndex === -1) {
      return res.status(404).json({ 
        success: false,
        message: 'Project not found' 
      });
    }

    // Update project
    user.projects[projectIndex] = {
      ...user.projects[projectIndex].toObject(),
      ...projectUpdate
    };

    // Save updated user
    await user.save();

    // Return updated projects
    res.json({
      success: true,
      data: {
        projects: user.projects
      }
    });
  } catch (error) {
    console.error('Update project error:', error.message);
    res.status(500).json({ 
      success: false,
      message: 'Server error updating project' 
    });
  }
});

/**
 * @route   DELETE /api/profile/projects/:id
 * @desc    Delete a specific project
 * @access  Private
 */
router.delete('/projects/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    // Find user (from auth middleware)
    const user = req.user;

    // Remove project
    user.projects = user.projects.filter(p => p._id.toString() !== id);

    // Save updated user
    await user.save();

    // Return updated projects
    res.json({
      success: true,
      data: {
        projects: user.projects
      }
    });
  } catch (error) {
    console.error('Delete project error:', error.message);
    res.status(500).json({ 
      success: false,
      message: 'Server error deleting project' 
    });
  }
});

/**
 * @route   PUT /api/profile/theme
 * @desc    Update theme customization
 * @access  Private
 */
router.put('/theme', auth, async (req, res) => {
  try {
    const { theme } = req.body;

    // Validate theme object
    if (!theme || typeof theme !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Theme data is required'
      });
    }

    // Validate template if provided
    if (theme.template && !ALLOWED_TEMPLATES.includes(theme.template)) {
      return res.status(400).json({
        success: false,
        message: `Invalid template. Allowed values: ${ALLOWED_TEMPLATES.join(', ')}`
      });
    }

    // Find user (from auth middleware)
    const user = req.user;

    // Support partial theme updates
    user.theme = {
      ...user.theme.toObject(),
      ...theme
    };

    // Save updated user
    await user.save();

    // Return updated theme
    res.json({
      success: true,
      data: {
        theme: user.theme
      }
    });
  } catch (error) {
    console.error('Update theme error:', error.message);
    res.status(500).json({ 
      success: false,
      message: 'Server error updating theme' 
    });
  }
});

module.exports = router; 