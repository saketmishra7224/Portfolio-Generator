const express = require('express');
const router = express.Router();
const User = require('../models/User');
const ResumeVersion = require('../models/ResumeVersion');
const auth = require('../middleware/auth');
const {
  SECTION_CONFIG,
  ORDERABLE_SECTIONS,
  VERSION_DATA_KEYS,
  flattenSkillCategories,
  ALLOWED_TEMPLATES,
} = require('./profile');

// ---------------------------------------------------------------------------
// Resume versions API. All routes are authenticated and strictly scoped to
// the caller's own documents (userId match). Users without versions are
// untouched: their profile keeps living on the User document.
// ---------------------------------------------------------------------------

function toClient(version) {
  const obj = version.toObject ? version.toObject() : version;
  return {
    id: String(obj._id),
    name: obj.name,
    targetRole: obj.targetRole || '',
    targetJobDescription: obj.targetJobDescription || '',
    template: obj.template || 'minimal',
    theme: {
      accentColor: (obj.theme && obj.theme.accentColor) || '#2563eb',
      font: (obj.theme && obj.theme.font) || 'Inter',
    },
    data: obj.data || {},
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  };
}

function pickVersionData(body = {}) {
  const data = {};
  for (const key of VERSION_DATA_KEYS) {
    if (body[key] !== undefined) data[key] = body[key];
  }
  return data;
}

function validateVersionData(data, res) {
  for (const [key, value] of Object.entries(data)) {
    if (key === 'sectionOrder') {
      if (!Array.isArray(value)) return 'sectionOrder must be an array';
      const unknown = value.filter((k) => !ORDERABLE_SECTIONS.includes(k));
      if (unknown.length > 0) return `Unknown sections in order: ${unknown.join(', ')}`;
      continue;
    }
    if (key === 'skillCategories' || key === 'sectionsEnabled') {
      if (!value || typeof value !== 'object' || Array.isArray(value)) return `${key} must be an object`;
      continue;
    }
    if (key === 'personalInfo' || key === 'education' || key === 'socialLinks') {
      if (!value || typeof value !== 'object' || Array.isArray(value)) return `${key} must be an object`;
      continue;
    }
    if (!Array.isArray(value)) return `${key} must be an array`;
    const cfg = SECTION_CONFIG[key];
    if (cfg && value.length > cfg.maxItems) return `Too many ${key} (max ${cfg.maxItems})`;
  }
  return null;
}

function validationError(res, error, fallback) {
  if (error && error.name === 'ValidationError') {
    const details = Object.values(error.errors || {}).map((e) => e.message);
    return res.status(400).json({
      success: false,
      message: details[0] || 'Validation failed. Please check your input.',
      details,
    });
  }
  console.error(fallback, error && error.message);
  return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
}

async function ownedVersion(userId, id, res) {
  const version = await ResumeVersion.findOne({ _id: id, userId });
  if (!version) {
    res.status(404).json({ success: false, message: 'Resume version not found' });
    return null;
  }
  return version;
}

/**
 * @route   GET /api/resumes
 * @desc    List the caller's resume versions (newest first)
 * @access  Private
 */
router.get('/', auth, async (req, res) => {
  try {
    const versions = await ResumeVersion.find({ userId: req.user._id }).sort({ updatedAt: -1 });
    res.json({ success: true, data: { versions: versions.map(toClient), activeVersionId: req.user.activeResumeVersion ? String(req.user.activeResumeVersion) : null } });
  } catch (error) {
    console.error('List versions error:', error.message);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

/**
 * @route   POST /api/resumes
 * @desc    Create a version. Pass `data` for a blank/custom start, or
 *          `fromCurrent: true` to snapshot the current main profile.
 * @access  Private
 */
router.post('/', auth, async (req, res) => {
  try {
    const { name, targetRole, template, theme, targetJobDescription, data, fromCurrent } = req.body || {};
    if (!name || String(name).trim() === '') {
      return res.status(400).json({ success: false, message: 'Version name is required' });
    }
    const count = await ResumeVersion.countDocuments({ userId: req.user._id });
    if (count >= ResumeVersion.MAX_VERSIONS_PER_USER) {
      return res.status(400).json({ success: false, message: `Version limit reached (max ${ResumeVersion.MAX_VERSIONS_PER_USER}). Delete one first.` });
    }
    if (template && !ALLOWED_TEMPLATES.includes(template)) {
      return res.status(400).json({ success: false, message: `Invalid template. Allowed values: ${ALLOWED_TEMPLATES.join(', ')}` });
    }
    let snapshot = pickVersionData(data);
    if (fromCurrent) {
      const u = req.user;
      snapshot = {
        personalInfo: u.personalInfo, education: u.education, educations: u.educations,
        experiences: u.experiences, skills: u.skills, skillCategories: u.skillCategories,
        projects: u.projects, socialLinks: u.socialLinks, certifications: u.certifications,
        achievements: u.achievements, leadership: u.leadership, languages: u.languages,
        publications: u.publications, volunteering: u.volunteering,
        sectionsEnabled: u.sectionsEnabled, sectionOrder: u.sectionOrder,
      };
    }
    const err = validateVersionData(snapshot, res);
    if (err) return res.status(400).json({ success: false, message: err });

    const version = new ResumeVersion({
      userId: req.user._id,
      name: String(name).trim().slice(0, 80),
      targetRole: String(targetRole || '').trim().slice(0, 120),
      targetJobDescription: String(targetJobDescription || '').slice(0, 20000),
      template: template || (req.user.theme && req.user.theme.template) || 'minimal',
      theme: {
        accentColor: (theme && theme.accentColor) || (req.user.theme && req.user.theme.accentColor) || '#2563eb',
        font: (theme && theme.font) || (req.user.theme && req.user.theme.font) || 'Inter',
      },
      data: snapshot,
    });
    // Keep the legacy flat-skills mirror consistent when categories are set.
    if (snapshot.skillCategories && snapshot.skills === undefined) {
      const flat = flattenSkillCategories(snapshot.skillCategories);
      if (flat) version.data.skills = flat;
    }
    await version.save();
    res.status(201).json({ success: true, data: { version: toClient(version) } });
  } catch (error) {
    return validationError(res, error, 'Create version error:');
  }
});

/**
 * @route   PUT /api/resumes/active
 * @desc    Select the active version ({ versionId }) or return to the main
 *          resume ({ versionId: null }). Body ownership is verified.
 * @access  Private
 *
 * NOTE: registered before '/:id' so Express does not treat 'active' as an id.
 */
router.put('/active', auth, async (req, res) => {
  try {
    const { versionId } = req.body || {};
    if (versionId === null || versionId === undefined || versionId === '') {
      req.user.activeResumeVersion = null;
      await req.user.save();
      return res.json({ success: true, data: { activeVersionId: null } });
    }
    const version = await ownedVersion(req.user._id, versionId, res);
    if (!version) return;
    req.user.activeResumeVersion = version._id;
    await req.user.save();
    res.json({ success: true, data: { activeVersionId: String(version._id), version: toClient(version) } });
  } catch (error) {
    console.error('Set active version error:', error.message);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

/**
 * @route   GET /api/resumes/:id
 * @desc    Fetch one owned version
 * @access  Private
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const version = await ownedVersion(req.user._id, req.params.id, res);
    if (!version) return;
    res.json({ success: true, data: { version: toClient(version) } });
  } catch (error) {
    console.error('Get version error:', error.message);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

/**
 * @route   PUT /api/resumes/:id
 * @desc    Rename / retarget / update a version (meta + resume data + theme)
 * @access  Private
 */
router.put('/:id', auth, async (req, res) => {
  try {
    const version = await ownedVersion(req.user._id, req.params.id, res);
    if (!version) return;
    const { name, targetRole, targetJobDescription, template, theme } = req.body || {};

    if (name !== undefined) {
      if (!String(name).trim()) return res.status(400).json({ success: false, message: 'Version name cannot be empty' });
      version.name = String(name).trim().slice(0, 80);
    }
    if (targetRole !== undefined) version.targetRole = String(targetRole).slice(0, 120);
    if (targetJobDescription !== undefined) version.targetJobDescription = String(targetJobDescription).slice(0, 20000);
    if (template !== undefined) {
      if (!ALLOWED_TEMPLATES.includes(template)) {
        return res.status(400).json({ success: false, message: `Invalid template. Allowed values: ${ALLOWED_TEMPLATES.join(', ')}` });
      }
      version.template = template;
    }
    if (theme !== undefined) {
      if (!theme || typeof theme !== 'object') return res.status(400).json({ success: false, message: 'theme must be an object' });
      version.theme = { accentColor: theme.accentColor || version.theme.accentColor, font: theme.font || version.theme.font };
    }

    const data = pickVersionData(req.body || {});
    const err = validateVersionData(data, res);
    if (err) return res.status(400).json({ success: false, message: err });
    for (const [key, value] of Object.entries(data)) {
      version.data[key] = value;
    }
    if (data.skillCategories !== undefined && data.skills === undefined) {
      const flat = flattenSkillCategories(data.skillCategories);
      if (flat) version.data.skills = flat;
    }
    await version.save();
    res.json({ success: true, data: { version: toClient(version) } });
  } catch (error) {
    return validationError(res, error, 'Update version error:');
  }
});

/**
 * @route   POST /api/resumes/:id/duplicate
 * @desc    Duplicate an owned version (copy)
 * @access  Private
 */
router.post('/:id/duplicate', auth, async (req, res) => {
  try {
    const version = await ownedVersion(req.user._id, req.params.id, res);
    if (!version) return;
    const count = await ResumeVersion.countDocuments({ userId: req.user._id });
    if (count >= ResumeVersion.MAX_VERSIONS_PER_USER) {
      return res.status(400).json({ success: false, message: `Version limit reached (max ${ResumeVersion.MAX_VERSIONS_PER_USER}). Delete one first.` });
    }
    const src = version.toObject();
    delete src._id;
    delete src.createdAt;
    delete src.updatedAt;
    delete src.__v;
    const copy = new ResumeVersion({ ...src, userId: req.user._id, name: `${src.name} (copy)`.slice(0, 80) });
    await copy.save();
    res.status(201).json({ success: true, data: { version: toClient(copy) } });
  } catch (error) {
    return validationError(res, error, 'Duplicate version error:');
  }
});

/**
 * @route   DELETE /api/resumes/:id
 * @desc    Delete an owned version (clears active pointer if needed)
 * @access  Private
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const version = await ownedVersion(req.user._id, req.params.id, res);
    if (!version) return;
    await ResumeVersion.deleteOne({ _id: version._id });
    if (req.user.activeResumeVersion && String(req.user.activeResumeVersion) === String(version._id)) {
      req.user.activeResumeVersion = null;
      await req.user.save();
    }
    res.json({ success: true, message: 'Version deleted' });
  } catch (error) {
    console.error('Delete version error:', error.message);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

module.exports = router;
