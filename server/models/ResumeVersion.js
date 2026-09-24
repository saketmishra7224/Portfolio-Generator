const mongoose = require('mongoose');
const { ResumeSchemas } = require('./User');

// ---------------------------------------------------------------------------
// ResumeVersion: named resume variants (e.g. "Frontend Developer Resume").
//
// Design notes:
// - One document per variant, owned via userId. The User account itself is
//   never duplicated — variants only reference it.
// - `data` mirrors the main-profile resume shapes exactly (same sub-schemas),
//   so builders, templates, ATS and matching work unchanged on snapshots.
// - Users without any versions keep working on the User document directly
//   (User.activeResumeVersion == null). No migration needed or performed.
// ---------------------------------------------------------------------------

const ResumeVersionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 80
  },
  targetRole: {
    type: String,
    default: '',
    trim: true,
    maxlength: 120
  },
  targetJobDescription: {
    type: String,
    default: '',
    maxlength: 20000
  },
  template: {
    type: String,
    default: 'minimal',
    trim: true
  },
  theme: {
    accentColor: { type: String, default: '#2563eb', trim: true },
    font: { type: String, default: 'Inter', trim: true }
  },
  data: {
    personalInfo: { type: ResumeSchemas.PersonalInfoSchema, default: undefined },
    education: { type: ResumeSchemas.EducationSchema, default: undefined },
    educations: { type: [ResumeSchemas.EducationEntrySchema], default: undefined },
    experiences: { type: [ResumeSchemas.ExperienceEntrySchema], default: undefined },
    skills: { type: [String], default: undefined },
    skillCategories: { type: ResumeSchemas.SkillCategoriesSchema, default: undefined },
    projects: { type: [ResumeSchemas.ProjectSchema], default: undefined },
    socialLinks: { type: ResumeSchemas.SocialLinksSchema, default: undefined },
    certifications: { type: [ResumeSchemas.CertificationSchema], default: undefined },
    achievements: { type: [ResumeSchemas.AchievementSchema], default: undefined },
    leadership: { type: [ResumeSchemas.LeadershipSchema], default: undefined },
    languages: { type: [ResumeSchemas.LanguageSchema], default: undefined },
    publications: { type: [ResumeSchemas.PublicationSchema], default: undefined },
    volunteering: { type: [ResumeSchemas.VolunteeringSchema], default: undefined },
    sectionsEnabled: { type: ResumeSchemas.SectionsEnabledSchema, default: undefined },
    sectionOrder: { type: [String], default: undefined }
  }
}, { timestamps: true });

// A user can have at most MAX_VERSIONS_PER_USER variants.
ResumeVersionSchema.statics.MAX_VERSIONS_PER_USER = 10;

// Ownership lookups always filter by userId and sort by recency.
ResumeVersionSchema.index({ userId: 1, updatedAt: -1 });

const ResumeVersion = mongoose.model('ResumeVersion', ResumeVersionSchema);

module.exports = ResumeVersion;
