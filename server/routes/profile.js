const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// Allowed template names for validation
const ALLOWED_TEMPLATES = ['minimal', 'modern', 'classic', 'professional'];

// Resume sections that support generic item CRUD below. Each entry lists the
// fields that must be non-empty (after trim) and a cap to prevent abuse.
// Legacy single-object `education`, flat `skills` and `socialLinks` keep their
// dedicated routes above; the new structured arrays are managed here.
const SECTION_CONFIG = {
  educations: { required: ['institution'], maxItems: 10 },
  experiences: { required: ['company', 'role'], maxItems: 15 },
  projects: { required: ['title'], maxItems: 30 },
  certifications: { required: ['name'], maxItems: 20 },
  achievements: { required: ['title'], maxItems: 20 },
  languages: { required: ['name'], maxItems: 15 },
  publications: { required: ['title'], maxItems: 15 },
  volunteering: { required: ['organization'], maxItems: 15 },
  leadership: { required: ['role'], maxItems: 15 }
};

// Canonical resume order. Clients may persist a custom `sectionOrder`, which
// is validated against this list on bulk update.
const ORDERABLE_SECTIONS = [
  'education', 'experience', 'projects', 'skills', 'certifications',
  'achievements', 'leadership', 'languages', 'publications', 'volunteering'
];

// Resume data keys shared with the versions API (single source of truth for
// which top-level resume fields a version snapshot may carry).
const VERSION_DATA_KEYS = [
  'personalInfo', 'education', 'educations', 'experiences', 'skills',
  'skillCategories', 'projects', 'socialLinks', 'certifications',
  'achievements', 'leadership', 'languages', 'publications', 'volunteering',
  'sectionsEnabled', 'sectionOrder'
];

const SECTION_DATA_KEYS = [
  'educations', 'experiences', 'skillCategories', 'certifications',
  'achievements', 'languages', 'publications', 'volunteering', 'leadership',
  'sectionsEnabled', 'sectionOrder'
];

// Flatten categorized skills into the legacy flat `skills` array so old
// templates, ATS output and clients keep working unchanged.
function flattenSkillCategories(skillCategories) {
  if (!skillCategories || typeof skillCategories !== 'object') return null;
  const seen = new Set();
  const flat = [];
  for (const key of Object.keys(skillCategories)) {
    const list = skillCategories[key];
    if (!Array.isArray(list)) continue;
    for (const s of list) {
      const name = String(s || '').trim().slice(0, 80);
      if (!name) continue;
      const lower = name.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        flat.push(name);
      }
    }
  }
  return flat;
}

// Mirror educations[0] into the legacy single-object `education` so old
// templates and old clients keep rendering meaningful data.
function mirrorLegacyEducation(user) {
  const first = user.educations && user.educations[0];
  if (!first) return;
  user.education = {
    college: first.institution || '',
    degree: first.degree || '',
    specialization: first.field || '',
    cgpa: first.grade || '',
    summary: user.education && user.education.summary ? user.education.summary : (first.description || '')
  };
}

function fullProfilePayload(user) {
  return {
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
    theme: user.theme
  };
}

function validationErrorResponse(res, error, fallback) {
  if (error && error.name === 'ValidationError') {
    const details = Object.values(error.errors || {}).map(e => e.message);
    return res.status(400).json({
      success: false,
      message: details[0] || 'Validation failed. Please check your input.',
      details
    });
  }
  console.error(fallback, error && error.message);
  return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
}

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
      data: { profile: fullProfilePayload(req.user) }
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
    const {
      personalInfo, education, skills, projects, socialLinks, theme,
      educations, experiences, skillCategories, certifications, achievements,
      languages, publications, volunteering, leadership, sectionsEnabled, sectionOrder
    } = req.body;

    // Find user (from auth middleware)
    const user = req.user;

    // Update fields if provided (legacy shapes preserved as-is)
    if (personalInfo) user.personalInfo = personalInfo;
    if (education) user.education = education;
    if (skills) user.skills = skills;
    if (projects) user.projects = projects;
    if (socialLinks) user.socialLinks = socialLinks;

    // New resume sections (bulk replace; generic item routes below handle
    // single add/edit/delete). Caps guard against oversized payloads.
    const sectionUpdates = {
      educations, experiences, certifications, achievements,
      languages, publications, volunteering, leadership, sectionOrder
    };
    for (const [key, value] of Object.entries(sectionUpdates)) {
      if (value === undefined) continue;
      if (!Array.isArray(value)) {
        return res.status(400).json({ success: false, message: `${key} must be an array` });
      }
      if (key === 'sectionOrder') {
        const unknown = value.filter((k) => !ORDERABLE_SECTIONS.includes(k));
        if (unknown.length > 0) {
          return res.status(400).json({ success: false, message: `Unknown sections in order: ${unknown.join(', ')}` });
        }
      }
      const cfg = SECTION_CONFIG[key];
      if (cfg && value.length > cfg.maxItems) {
        return res.status(400).json({ success: false, message: `Too many ${key} (max ${cfg.maxItems})` });
      }
      user[key] = value;
    }
    if (skillCategories !== undefined) {
      if (!skillCategories || typeof skillCategories !== 'object' || Array.isArray(skillCategories)) {
        return res.status(400).json({ success: false, message: 'skillCategories must be an object' });
      }
      user.skillCategories = skillCategories;
      // Keep legacy flat skills in sync unless the caller set them explicitly.
      if (skills === undefined) {
        const flat = flattenSkillCategories(skillCategories);
        if (flat) user.skills = flat;
      }
    }
    if (sectionsEnabled !== undefined) {
      if (!sectionsEnabled || typeof sectionsEnabled !== 'object') {
        return res.status(400).json({ success: false, message: 'sectionsEnabled must be an object' });
      }
      user.sectionsEnabled = { ...user.sectionsEnabled.toObject(), ...sectionsEnabled };
    }
    // Keep legacy single-object education in sync for old templates/clients.
    if (educations !== undefined) mirrorLegacyEducation(user);

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
      data: { profile: fullProfilePayload(user) }
    });
  } catch (error) {
    return validationErrorResponse(res, error, 'Update profile error:');
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
 * Generic resume-section item CRUD.
 *
 * @route   POST /api/profile/sections/:section
 * @desc    Append one item to a resume section array
 * @access  Private
 */
router.post('/sections/:section', auth, async (req, res) => {
  try {
    const { section } = req.params;
    const cfg = SECTION_CONFIG[section];
    if (!cfg) {
      return res.status(400).json({ success: false, message: `Unknown section: ${section}` });
    }
    const item = req.body;
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      return res.status(400).json({ success: false, message: 'Item data is required' });
    }
    for (const field of cfg.required) {
      if (!item[field] || String(item[field]).trim() === '') {
        return res.status(400).json({ success: false, message: `${field} is required` });
      }
    }
    const user = req.user;
    if (user[section].length >= cfg.maxItems) {
      return res.status(400).json({ success: false, message: `Too many ${section} (max ${cfg.maxItems})` });
    }
    user[section].push(item);
    if (section === 'educations') mirrorLegacyEducation(user);
    await user.save();
    res.json({ success: true, data: { [section]: user[section] } });
  } catch (error) {
    return validationErrorResponse(res, error, 'Add section item error:');
  }
});

/**
 * @route   PUT /api/profile/sections/:section/:id
 * @desc    Update one item within a resume section array
 * @access  Private
 */
router.put('/sections/:section/:id', auth, async (req, res) => {
  try {
    const { section, id } = req.params;
    const cfg = SECTION_CONFIG[section];
    if (!cfg) {
      return res.status(400).json({ success: false, message: `Unknown section: ${section}` });
    }
    const user = req.user;
    const index = user[section].findIndex(e => e._id && e._id.toString() === id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }
    const update = { ...req.body };
    delete update._id;
    const merged = { ...user[section][index].toObject(), ...update };
    for (const field of cfg.required) {
      if (!merged[field] || String(merged[field]).trim() === '') {
        return res.status(400).json({ success: false, message: `${field} is required` });
      }
    }
    // Apply via .set() so the subdocument keeps its _id (identity is stable
    // across edits — required for subsequent update/delete calls).
    user[section][index].set(update);
    if (section === 'educations') mirrorLegacyEducation(user);
    await user.save();
    res.json({ success: true, data: { [section]: user[section] } });
  } catch (error) {
    return validationErrorResponse(res, error, 'Update section item error:');
  }
});

/**
 * @route   DELETE /api/profile/sections/:section/:id
 * @desc    Delete one item from a resume section array
 * @access  Private
 */
router.delete('/sections/:section/:id', auth, async (req, res) => {
  try {
    const { section, id } = req.params;
    const cfg = SECTION_CONFIG[section];
    if (!cfg) {
      return res.status(400).json({ success: false, message: `Unknown section: ${section}` });
    }
    const user = req.user;
    const before = user[section].length;
    user[section] = user[section].filter(e => !(e._id && e._id.toString() === id));
    if (user[section].length === before) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }
    await user.save();
    res.json({ success: true, data: { [section]: user[section] } });
  } catch (error) {
    return validationErrorResponse(res, error, 'Delete section item error:');
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

/**
 * @route   DELETE /api/profile
 * @desc    Delete user profile and account
 * @access  Private
 */
router.delete('/', auth, async (req, res) => {
  try {
    // Find and delete the user
    await User.findByIdAndDelete(req.user._id);
    
    res.json({
      success: true,
      message: 'Profile deleted successfully'
    });
  } catch (error) {
    console.error('Delete profile error:', error.message);
    res.status(500).json({ 
      success: false,
      message: 'Server error deleting profile' 
    });
  }
});

module.exports = router;
module.exports.SECTION_CONFIG = SECTION_CONFIG;
module.exports.ORDERABLE_SECTIONS = ORDERABLE_SECTIONS;
module.exports.VERSION_DATA_KEYS = VERSION_DATA_KEYS;
module.exports.flattenSkillCategories = flattenSkillCategories;
module.exports.ALLOWED_TEMPLATES = ALLOWED_TEMPLATES; 