// ---------------------------------------------------------------------------
// Template theme maps: each visual template (and ATS) is a thin skin — a
// class-name map passed to the shared ResumeBlocks. All resume business
// logic lives in the blocks + utils/atsDocument.js; themes only change
// class names, i.e. the design language. See templates.css for the skins.
// ---------------------------------------------------------------------------

const baseKeys = (prefix) => ({
  root: `rt ${prefix}`,
  header: 'rt-header',
  avatar: 'rt-avatar',
  name: 'rt-name',
  headline: 'rt-headline',
  contactWrap: 'rt-contact-wrap',
  contact: 'rt-contact',
  link: 'rt-link',
  section: 'rt-section',
  sectionTitle: 'rt-section-title',
  sectionBody: 'rt-section-body',
  para: 'rt-para',
  skillGroup: 'rt-skill-group',
  skillGroupLabel: 'rt-skill-group-label',
  skillsInline: 'rt-skills-inline',
  skillsChips: 'rt-skills-chips',
  skillChip: 'rt-skill-chip',
  entry: 'rt-entry',
  entryTitle: 'rt-entry-title',
  entryMeta: 'rt-entry-meta',
  entryDesc: 'rt-entry-desc',
  bullets: 'rt-bullets',
  bullet: 'rt-bullet',
  entryExtra: 'rt-entry-extra',
  entryLinks: 'rt-entry-links',
  line: 'rt-line',
  lineBullet: 'rt-line-bullet',
});

export const THEME_MINIMAL = { ...baseKeys('rt-minimal'), avatar: null };

export const THEME_MODERN = baseKeys('rt-modern');

export const THEME_CLASSIC = { ...baseKeys('rt-classic'), avatar: null };

export const THEME_PROFESSIONAL = { ...baseKeys('rt-professional'), avatar: null };

// ATS reuses the long-standing .ats-* stylesheet: zero visual change, and
// parser output stays byte-identical in structure. Chips/avatar are disabled
// (null) so no decorative or duplicated content is rendered.
export const THEME_ATS = {
  root: 'ats-template',
  header: 'ats-header',
  avatar: null,
  name: 'ats-name',
  headline: 'ats-text',
  contactWrap: '',
  contact: 'ats-contact',
  link: '',
  section: 'ats-section',
  sectionTitle: 'ats-section-title',
  sectionBody: '',
  para: 'ats-text',
  skillGroup: '',
  skillGroupLabel: 'ats-text',
  skillsInline: 'ats-text ats-skills',
  skillsChips: '',
  skillChip: null,
  entry: 'ats-project',
  entryTitle: 'ats-project-title',
  entryMeta: 'ats-text ats-tech',
  entryDesc: 'ats-text',
  bullets: 'ats-bullets',
  bullet: 'ats-text',
  entryExtra: 'ats-text',
  entryLinks: 'ats-text',
  line: 'ats-text',
  lineBullet: '',
};
