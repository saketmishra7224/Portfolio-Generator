const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getJwtSecret } = require('../utils/jwtSecret');

// ---------------------------------------------------------------------------
// Resume-builder evolution (additive, backward compatible):
// - Every new top-level path below is optional with a default, so documents
//   created by older app versions load and validate unchanged.
// - Legacy `education` (single object), `skills` (string array) and
//   `socialLinks` are KEPT. New structured arrays live alongside them and the
//   API keeps the legacy shapes in sync (see routes/profile.js).
// ---------------------------------------------------------------------------

const URL_PATTERN = /^(https?:\/\/)[^\s$.?#].[^\s]*$/i;

function optionalUrl(path) {
  return {
    type: String,
    default: '',
    trim: true,
    maxlength: 500,
    validate: {
      validator: function(v) {
        return !v || URL_PATTERN.test(v);
      },
      message: path + ' must be a valid http(s) URL'
    }
  };
}

const LinkSchema = new mongoose.Schema({
  label: { type: String, default: '', trim: true, maxlength: 60 },
  url: { ...optionalUrl('Link URL'), required: true }
}, { _id: true });

const ProjectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 120
  },
  // Relaxed from required (old docs always have these; new entries may fill
  // structured fields instead). Existing documents remain valid.
  technologies: {
    type: String,
    default: '',
    trim: true,
    maxlength: 500
  },
  description: {
    type: String,
    default: '',
    maxlength: 2000
  },
  link: {
    type: String,
    trim: true,
    maxlength: 500
  },
  bullets: { type: [String], default: [] },
  liveUrl: optionalUrl('Live URL'),
  githubUrl: optionalUrl('GitHub URL'),
  startDate: { type: String, default: '', trim: true, maxlength: 20 },
  endDate: { type: String, default: '', trim: true, maxlength: 20 },
  role: { type: String, default: '', trim: true, maxlength: 120 },
  outcomes: { type: [String], default: [] }
});

const EducationEntrySchema = new mongoose.Schema({
  institution: { type: String, required: true, trim: true, maxlength: 160 },
  degree: { type: String, default: '', trim: true, maxlength: 160 },
  field: { type: String, default: '', trim: true, maxlength: 160 },
  startDate: { type: String, default: '', trim: true, maxlength: 20 },
  endDate: { type: String, default: '', trim: true, maxlength: 20 },
  current: { type: Boolean, default: false },
  grade: { type: String, default: '', trim: true, maxlength: 40 },
  location: { type: String, default: '', trim: true, maxlength: 120 },
  description: { type: String, default: '', maxlength: 1500 },
  coursework: { type: [String], default: [] }
});

const ExperienceEntrySchema = new mongoose.Schema({
  company: { type: String, required: true, trim: true, maxlength: 160 },
  role: { type: String, required: true, trim: true, maxlength: 160 },
  location: { type: String, default: '', trim: true, maxlength: 120 },
  employmentType: { type: String, default: '', trim: true, maxlength: 60 },
  startDate: { type: String, default: '', trim: true, maxlength: 20 },
  endDate: { type: String, default: '', trim: true, maxlength: 20 },
  current: { type: Boolean, default: false },
  description: { type: String, default: '', maxlength: 2000 },
  bullets: { type: [String], default: [] },
  technologies: { type: [String], default: [] }
});

const SKILL_CATEGORY_KEYS = [
  'programmingLanguages', 'frameworks', 'libraries', 'databases',
  'cloud', 'devOps', 'tools', 'aiMl', 'other'
];

const SkillCategoriesSchema = new mongoose.Schema(
  SKILL_CATEGORY_KEYS.reduce((acc, key) => {
    acc[key] = { type: [String], default: [] };
    return acc;
  }, {}),
  { _id: false }
);

const CertificationSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 160 },
  organization: { type: String, default: '', trim: true, maxlength: 160 },
  issueDate: { type: String, default: '', trim: true, maxlength: 20 },
  expirationDate: { type: String, default: '', trim: true, maxlength: 20 },
  credentialId: { type: String, default: '', trim: true, maxlength: 120 },
  credentialUrl: optionalUrl('Credential URL')
});

const AchievementSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 160 },
  description: { type: String, default: '', maxlength: 1000 },
  date: { type: String, default: '', trim: true, maxlength: 20 },
  organization: { type: String, default: '', trim: true, maxlength: 160 }
});

const LanguageSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 60 },
  proficiency: { type: String, default: '', trim: true, maxlength: 40 }
});

const PublicationSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 200 },
  publisher: { type: String, default: '', trim: true, maxlength: 160 },
  date: { type: String, default: '', trim: true, maxlength: 20 },
  url: optionalUrl('Publication URL'),
  description: { type: String, default: '', maxlength: 1000 }
});

const LeadershipSchema = new mongoose.Schema({
  role: { type: String, required: true, trim: true, maxlength: 160 },
  organization: { type: String, default: '', trim: true, maxlength: 160 },
  date: { type: String, default: '', trim: true, maxlength: 20 },
  description: { type: String, default: '', maxlength: 1000 }
});

const VolunteeringSchema = new mongoose.Schema({
  organization: { type: String, required: true, trim: true, maxlength: 160 },
  role: { type: String, default: '', trim: true, maxlength: 160 },
  startDate: { type: String, default: '', trim: true, maxlength: 20 },
  endDate: { type: String, default: '', trim: true, maxlength: 20 },
  current: { type: Boolean, default: false },
  description: { type: String, default: '', maxlength: 1500 }
});

const SectionsEnabledSchema = new mongoose.Schema({
  education: { type: Boolean, default: true },
  experience: { type: Boolean, default: true },
  projects: { type: Boolean, default: true },
  skills: { type: Boolean, default: true },
  certifications: { type: Boolean, default: true },
  achievements: { type: Boolean, default: true },
  languages: { type: Boolean, default: true },
  publications: { type: Boolean, default: true },
  volunteering: { type: Boolean, default: true },
  leadership: { type: Boolean, default: true }
}, { _id: false });

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
    // Optional at the schema level so Google sign-ups (which have no phone
    // yet) can be created. Email/password registration still requires a
    // phone number via route-level validation.
    default: '',
    trim: true
  },
  profileImage: {
    type: String,
    default: null
  },
  bio: {
    type: String,
    default: '',
    trim: true
  },
  tagline: {
    type: String,
    default: '',
    trim: true
  },
  headline: {
    type: String,
    default: '',
    trim: true,
    maxlength: 160
  },
  location: {
    type: String,
    default: '',
    trim: true,
    maxlength: 120
  },
  website: optionalUrl('Website'),
  linkedin: optionalUrl('LinkedIn URL'),
  links: {
    type: [LinkSchema],
    default: []
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
    // Required only for email/password accounts. Google-authenticated
    // accounts have no local password. Route-level validation still
    // enforces a password for local registration.
    required: function() {
      return this.authProvider !== 'google';
    },
    minLength: 6
  },
  // How this account authenticates. 'local' = email/password (original
  // behaviour). 'google' = created via Google Sign-In. A local account that
  // later links a Google identity keeps 'local' so the password keeps working.
  authProvider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
  },
  // Google's stable user ID (the `sub` claim). Unique + sparse so local-only
  // accounts (no googleId) never collide with each other.
  googleId: {
    type: String,
    default: undefined,
    index: true,
    unique: true,
    sparse: true
  },
  // Whether the email address has been verified by its provider.
  emailVerified: {
    type: Boolean,
    default: false
  },
  personalInfo: {
    type: PersonalInfoSchema,
    required: true
  },
  education: {
    type: EducationSchema,
    default: () => ({})
  },
  // Multiple education entries (new). Legacy `education` above is preserved
  // and mirrored from educations[0] on save for old-template compatibility.
  educations: {
    type: [EducationEntrySchema],
    default: []
  },
  experiences: {
    type: [ExperienceEntrySchema],
    default: []
  },
  skills: {
    type: [String],
    default: []
  },
  // Categorized skills (new). Legacy `skills` flat array is kept in sync.
  skillCategories: {
    type: SkillCategoriesSchema,
    default: () => ({})
  },
  certifications: {
    type: [CertificationSchema],
    default: []
  },
  achievements: {
    type: [AchievementSchema],
    default: []
  },
  languages: {
    type: [LanguageSchema],
    default: []
  },
  publications: {
    type: [PublicationSchema],
    default: []
  },
  volunteering: {
    type: [VolunteeringSchema],
    default: []
  },
  leadership: {
    type: [LeadershipSchema],
    default: []
  },
  sectionsEnabled: {
    type: SectionsEnabledSchema,
    default: () => ({})
  },
  sectionOrder: {
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
  // Active resume version (opt-in). Null/undefined = legacy single-resume
  // mode: the profile lives directly on this document, exactly as before.
  // Existing users have no value here and are completely unaffected.
  activeResumeVersion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ResumeVersion',
    default: null
  },
  // Session generation counter for "logout all sessions". Bumped by
  // POST /api/auth/logout-all; tokens carrying an older generation are
  // rejected. Tokens issued before this field existed carry no claim and
  // keep working (backward compatible).
  tokenVersion: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving (only when a password is set, e.g. local accounts)
UserSchema.pre('save', async function(next) {
  try {
    if (this.isModified('password') && this.password) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Compare passwords (Google-only accounts have no password, so never match)
UserSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    if (!this.password || !candidatePassword) return false;
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    console.error('Password comparison error:', error);
    return false;
  }
};

// Generate JWT token (embeds the session generation for logout-all support)
UserSchema.methods.generateAuthToken = function() {
  try {
    return jwt.sign(
      { id: this._id, tv: this.tokenVersion || 0 },
      getJwtSecret(),
      { expiresIn: '7d' }
    );
  } catch (error) {
    console.error('Token generation error:', error);
    throw error;
  }
};

const User = mongoose.model('User', UserSchema);

// Re-exported so ResumeVersion reuses the exact same sub-document shapes
// (no schema drift between the main profile and version snapshots).
module.exports = User;
module.exports.User = User;
module.exports.ResumeSchemas = {
  PersonalInfoSchema,
  EducationSchema,
  EducationEntrySchema,
  ExperienceEntrySchema,
  ProjectSchema,
  SocialLinksSchema,
  SkillCategoriesSchema,
  CertificationSchema,
  AchievementSchema,
  LanguageSchema,
  PublicationSchema,
  VolunteeringSchema,
  LeadershipSchema,
  SectionsEnabledSchema,
  ThemeSchema,
}; 