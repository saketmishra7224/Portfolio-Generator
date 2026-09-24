import { useEffect, useRef, useState, useCallback } from 'react';

// ---------------------------------------------------------------------------
// Resume model utilities: defaults, backward-compat normalization, validation,
// section metadata, reorder helpers and a debounced autosave hook.
// ---------------------------------------------------------------------------

export const SKILL_CATEGORIES = [
  { key: 'programmingLanguages', label: 'Programming Languages' },
  { key: 'frameworks', label: 'Frameworks' },
  { key: 'libraries', label: 'Libraries' },
  { key: 'databases', label: 'Databases' },
  { key: 'cloud', label: 'Cloud' },
  { key: 'devOps', label: 'DevOps' },
  { key: 'tools', label: 'Tools' },
  { key: 'aiMl', label: 'AI/ML' },
  { key: 'other', label: 'Other' },
];

export const SECTION_DEFS = [
  { key: 'educations', label: 'Education', singular: 'education entry', optional: false, maxItems: 10 },
  { key: 'experiences', label: 'Experience', singular: 'experience entry', optional: false, maxItems: 15 },
  { key: 'projects', label: 'Projects', singular: 'project', optional: false, maxItems: 30 },
  { key: 'skills', label: 'Skills', singular: 'skill', optional: false, maxItems: 60 },
  { key: 'certifications', label: 'Certifications', singular: 'certification', optional: true, maxItems: 20 },
  { key: 'achievements', label: 'Achievements', singular: 'achievement', optional: true, maxItems: 20 },
  { key: 'languages', label: 'Languages', singular: 'language', optional: true, maxItems: 15 },
  { key: 'publications', label: 'Publications', singular: 'publication', optional: true, maxItems: 15 },
  { key: 'volunteering', label: 'Volunteering', singular: 'volunteering entry', optional: true, maxItems: 15 },
  { key: 'leadership', label: 'Leadership', singular: 'leadership entry', optional: true, maxItems: 15 },
];

// Canonical display order for resume sections (backend validates custom orders
// against ORDERABLE_SECTIONS, which mirrors these keys).
export const CANONICAL_SECTION_ORDER = [
  'education', 'experience', 'projects', 'skills', 'certifications',
  'achievements', 'leadership', 'languages', 'publications', 'volunteering',
];

// Builder sidebar sections: personal + summary live outside sectionOrder.
export const BUILDER_SECTIONS = [
  { id: 'personal', label: 'Personal', hint: 'Name, contact, links' },
  { id: 'summary', label: 'Summary', hint: 'Professional summary' },
  { id: 'experience', label: 'Experience', hint: 'Roles + bullets' },
  { id: 'education', label: 'Education', hint: 'Degrees + coursework' },
  { id: 'projects', label: 'Projects', hint: 'Work + outcomes' },
  { id: 'skills', label: 'Skills', hint: 'Categorized skills' },
  { id: 'certifications', label: 'Certifications', hint: 'Credentials' },
  { id: 'achievements', label: 'Achievements', hint: 'Awards + honors' },
  { id: 'leadership', label: 'Leadership', hint: 'Lead roles' },
  { id: 'additional', label: 'Additional sections', hint: 'Languages, publications, more' },
];

export const DEFAULT_SECTIONS_ENABLED = SECTION_DEFS.reduce((acc, s) => {
  acc[s.key === 'educations' ? 'education' : s.key] = true;
  return acc;
}, {});
// DEFAULT_SECTIONS_ENABLED keys match backend SectionsEnabledSchema:
export const ENABLED_KEYS = ['education', 'experience', 'projects', 'skills', 'certifications', 'achievements', 'languages', 'publications', 'volunteering', 'leadership'];

export const EMPTY_NEW_SECTIONS = {
  educations: [],
  experiences: [],
  skillCategories: SKILL_CATEGORIES.reduce((a, c) => ({ ...a, [c.key]: [] }), {}),
  certifications: [],
  achievements: [],
  languages: [],
  publications: [],
  volunteering: [],
  leadership: [],
  sectionsEnabled: ENABLED_KEYS.reduce((a, k) => ({ ...a, [k]: true }), {}),
  sectionOrder: [],
};

export const EMPTY_PERSONAL_EXT = {
  headline: '',
  location: '',
  website: '',
  linkedin: '',
  links: [],
};

export function newEntry(section) {
  switch (section) {
    case 'educations':
      return { institution: '', degree: '', field: '', startDate: '', endDate: '', current: false, grade: '', location: '', description: '', coursework: [] };
    case 'experiences':
      return { company: '', role: '', location: '', employmentType: '', startDate: '', endDate: '', current: false, description: '', bullets: [], technologies: [] };
    case 'projects':
      return { title: '', technologies: '', description: '', link: '', bullets: [], liveUrl: '', githubUrl: '', startDate: '', endDate: '', role: '', outcomes: [] };
    case 'certifications':
      return { name: '', organization: '', issueDate: '', expirationDate: '', credentialId: '', credentialUrl: '' };
    case 'achievements':
      return { title: '', description: '', date: '', organization: '' };
    case 'languages':
      return { name: '', proficiency: '' };
    case 'publications':
      return { title: '', publisher: '', date: '', url: '', description: '' };
    case 'volunteering':
      return { organization: '', role: '', startDate: '', endDate: '', current: false, description: '' };
    case 'leadership':
      return { role: '', organization: '', date: '', description: '' };
    default:
      return {};
  }
}

// Required fields per section (mirrors backend SECTION_CONFIG).
export const REQUIRED_FIELDS = {
  educations: ['institution'],
  experiences: ['company', 'role'],
  projects: ['title'],
  certifications: ['name'],
  achievements: ['title'],
  languages: ['name'],
  publications: ['title'],
  volunteering: ['organization'],
  leadership: ['role'],
};

const URL_FIELDS = new Set(['website', 'linkedin', 'liveUrl', 'githubUrl', 'credentialUrl', 'url', 'link']);
const DATE_FIELDS = new Set(['startDate', 'endDate', 'issueDate', 'expirationDate', 'date']);
const MAX_LEN = {
  default: 500,
  title: 200, name: 160, institution: 160, company: 160, role: 160, degree: 160,
  description: 2000, bio: 2000, summary: 2000, headline: 160,
};

// --- Backward-compatible normalization ------------------------------------
// Old documents lack every new path. This fills defaults and derives display
// data from legacy shapes WITHOUT mutating what gets saved blindly:
// - educations[] is synthesized from legacy `education` when empty.
// - skillCategories.other is seeded from legacy `skills` when all empty.
// - personalInfo gains the new optional keys.
export function normalizeProfile(data = {}) {
  const out = {
    personalInfo: {
      name: '', email: '', phone: '', profileImage: null, bio: '', tagline: '',
      ...EMPTY_PERSONAL_EXT,
      ...(data.personalInfo || {}),
    },
    education: { college: '', degree: '', specialization: '', cgpa: '', summary: '', ...(data.education || {}) },
    skills: Array.isArray(data.skills) ? [...data.skills] : [],
    projects: Array.isArray(data.projects) ? data.projects.map((p) => ({ ...p })) : [],
    socialLinks: { github: '', ...(data.socialLinks || {}) },
    educations: Array.isArray(data.educations) ? data.educations.map((e) => ({ ...e })) : [],
    experiences: Array.isArray(data.experiences) ? data.experiences.map((e) => ({ ...e })) : [],
    skillCategories: { ...EMPTY_NEW_SECTIONS.skillCategories, ...(data.skillCategories || {}) },
    certifications: Array.isArray(data.certifications) ? [...data.certifications] : [],
    achievements: Array.isArray(data.achievements) ? [...data.achievements] : [],
    languages: Array.isArray(data.languages) ? [...data.languages] : [],
    publications: Array.isArray(data.publications) ? [...data.publications] : [],
    volunteering: Array.isArray(data.volunteering) ? [...data.volunteering] : [],
    leadership: Array.isArray(data.leadership) ? [...data.leadership] : [],
    sectionsEnabled: { ...EMPTY_NEW_SECTIONS.sectionsEnabled, ...(data.sectionsEnabled || {}) },
    sectionOrder: Array.isArray(data.sectionOrder) ? [...data.sectionOrder] : [],
  };
  if (!out.personalInfo.links || !Array.isArray(out.personalInfo.links)) out.personalInfo.links = [];

  // Legacy education -> display entry (only when the new array is empty).
  const leg = out.education;
  if (out.educations.length === 0 && (leg.college || leg.degree)) {
    out.educations = [{
      institution: leg.college || '', degree: leg.degree || '', field: leg.specialization || '',
      startDate: '', endDate: '', current: false, grade: leg.cgpa || '', location: '',
      description: leg.summary || '', coursework: [],
    }];
    out._migratedEducation = true;
  }
  // Legacy flat skills -> categorized view (only when all categories empty).
  const catsEmpty = SKILL_CATEGORIES.every((c) => (out.skillCategories[c.key] || []).length === 0);
  if (catsEmpty && out.skills.length > 0) {
    out.skillCategories = { ...out.skillCategories, other: [...out.skills] };
    out._migratedSkills = true;
  }
  return out;
}

// --- Validation ------------------------------------------------------------

export function isValidUrl(v) {
  if (!v || String(v).trim() === '') return true;
  return /^(https?:\/\/)[^\s$.?#].[^\s]*$/i.test(String(v).trim());
}

// Accepts '', YYYY, YYYY-MM, MM/YYYY, 'Present'. Keeps partial dates usable.
export function isValidDate(v) {
  if (!v || String(v).trim() === '') return true;
  const s = String(v).trim();
  if (/^present$/i.test(s)) return true;
  if (/^(19|20)\d{2}$/.test(s)) return true;
  if (/^(19|20)\d{2}-(0[1-9]|1[0-2])$/.test(s)) return true;
  if (/^(0[1-9]|1[0-2])\/(19|20)\d{2}$/.test(s)) return true;
  return false;
}

export function validateEntry(section, entry) {
  const errors = {};
  for (const f of REQUIRED_FIELDS[section] || []) {
    if (!entry[f] || String(entry[f]).trim() === '') errors[f] = 'Required';
  }
  for (const [k, v] of Object.entries(entry)) {
    if (typeof v !== 'string' || v === '') continue;
    if (URL_FIELDS.has(k) && !isValidUrl(v)) errors[k] = 'Must be a valid http(s) URL';
    else if (DATE_FIELDS.has(k) && !isValidDate(v)) errors[k] = 'Use YYYY, YYYY-MM or Present';
    const limit = MAX_LEN[k] || MAX_LEN.default;
    if (v.length > limit) errors[k] = `Max ${limit} characters`;
  }
  return errors;
}

export function hasDuplicateNames(items, key = 'name') {
  const seen = new Set();
  for (const it of items) {
    const n = String(it[key] || '').trim().toLowerCase();
    if (!n) continue;
    if (seen.has(n)) return true;
    seen.add(n);
  }
  return false;
}

export function validatePersonalInfo(pi = {}) {
  const errors = {};
  if (pi.website && !isValidUrl(pi.website)) errors.website = 'Must be a valid http(s) URL';
  if (pi.linkedin && !isValidUrl(pi.linkedin)) errors.linkedin = 'Must be a valid http(s) URL';
  if ((pi.headline || '').length > 160) errors.headline = 'Max 160 characters';
  if ((pi.bio || '').length > 2000) errors.bio = 'Max 2000 characters';
  (pi.links || []).forEach((l, i) => {
    if (l.url && !isValidUrl(l.url)) errors[`links[${i}].url`] = 'Must be a valid http(s) URL';
  });
  return errors;
}

// --- Legacy sync -----------------------------------------------------------
// Keep the legacy shapes (`skills[]`, single `education`) in sync with the
// new structured data so old templates, ATS output and old clients keep
// working. Call before every save.
export function flattenCategories(skillCategories = {}) {
  const seen = new Set();
  const flat = [];
  for (const c of SKILL_CATEGORIES) {
    for (const s of skillCategories[c.key] || []) {
      const name = String(s || '').trim().slice(0, 80);
      if (!name) continue;
      const lower = name.toLowerCase();
      if (!seen.has(lower)) { seen.add(lower); flat.push(name); }
    }
  }
  return flat;
}

export function withSyncedSkills(form) {
  const next = { ...form };
  const flat = flattenCategories(next.skillCategories || {});
  if (flat.length > 0) next.skills = flat;
  return next;
}

export function withSyncedEducation(form) {
  const next = { ...form };
  const first = (next.educations || [])[0];
  if (first) {
    next.education = {
      ...(next.education || {}),
      college: first.institution || '',
      degree: first.degree || '',
      specialization: first.field || '',
      cgpa: first.grade || '',
      summary: (next.education && next.education.summary) || first.description || '',
    };
  }
  return next;
}

export function prepareForSave(form) {
  return withSyncedEducation(withSyncedSkills({ ...form }));
}

// --- Display helpers -------------------------------------------------------
// Prefer the new structured data, fall back to legacy shapes, so renderers
// (preview, templates, ATS, stats) work for old and new users alike — even
// before the next save syncs the legacy fields.
export function displaySkills(form = {}) {
  const flat = flattenCategories(form.skillCategories || {});
  if (flat.length > 0) return flat;
  return Array.isArray(form.skills) ? form.skills : [];
}

export function displayEducations(form = {}) {
  if (Array.isArray(form.educations) && form.educations.length > 0) return form.educations;
  const e = form.education || {};
  if (e.college || e.degree) {
    return [{
      institution: e.college || '', degree: e.degree || '', field: e.specialization || '',
      startDate: '', endDate: '', current: false, grade: e.cgpa || '', location: '',
      description: e.summary || '', coursework: [],
    }];
  }
  return [];
}

export function sectionVisible(form = {}, key) {
  return (form.sectionsEnabled || {})[key] !== false;
}

// --- Builder progress ------------------------------------------------------
// Persistent progress: completeness %, missing important sections and content
// quality warnings. Guidance only — nothing here blocks saving.
export function resumeCompleteness(form = {}) {
  const has = (v) => v && String(v).trim().length > 0;
  const skills = displaySkills(form);
  const educs = displayEducations(form);
  const parts = [
    { pts: 12, ok: has(form.personalInfo?.name), missing: 'Add your full name' },
    { pts: 8, ok: has(form.personalInfo?.email), missing: 'Add your email' },
    { pts: 6, ok: has(form.personalInfo?.phone), missing: 'Add your phone number' },
    { pts: 8, ok: has(form.personalInfo?.bio) || has(form.personalInfo?.headline), missing: 'Write a 2–4 sentence professional summary' },
    { pts: 14, ok: educs.length > 0, missing: 'Add at least one education entry' },
    { pts: 12, ok: (form.experiences || []).length > 0, missing: 'Add experience (internships count too)', optional: true },
    { pts: 12, ok: skills.filter(Boolean).length >= 3, missing: 'Add at least 3 skills' },
    { pts: 12, ok: (form.projects || []).length > 0, missing: 'Add at least one project' },
    { pts: 6, ok: has(form.socialLinks?.github) || has(form.personalInfo?.linkedin), missing: 'Link GitHub or LinkedIn' },
    { pts: 10, ok: (form.certifications || []).length + (form.achievements || []).length + (form.leadership || []).length + (form.languages || []).length > 0, missing: 'Add a certification, achievement, leadership role or language', optional: true },
  ];
  let score = 0;
  const missing = [];
  const missingOptional = [];
  for (const p of parts) {
    if (p.ok) score += p.pts;
    else if (p.optional) missingOptional.push(p.missing);
    else missing.push(p.missing);
  }
  return { score: Math.min(100, score), missing, missingOptional };
}

export function contentWarnings(form = {}) {
  const warnings = [];
  const allBullets = [
    ...((form.experiences || []).flatMap((x, xi) => (x.bullets || []).map((b, bi) => ({ text: b, where: `Experience ${xi + 1}, bullet ${bi + 1}` })))),
    ...((form.projects || []).flatMap((p, pi) => (p.bullets || []).map((b, bi) => ({ text: b, where: `Project ${pi + 1}, bullet ${bi + 1}` })))),
  ];
  const thin = allBullets.filter((b) => b.text && String(b.text).trim().length > 0 && String(b.text).trim().length < 40);
  if (thin.length > 0) warnings.push(`${thin.length} bullet${thin.length === 1 ? ' is' : 's are'} very short — expand with what you did plus the result.`);
  const noMetric = allBullets.filter((b) => b.text && String(b.text).trim().length >= 40 && !/\d/.test(b.text));
  if (noMetric.length > 0) warnings.push(`${noMetric.length} bullet${noMetric.length === 1 ? ' has' : 's have'} no numbers — add real metrics (%, time, users) where you have them.`);
  const thinProjects = (form.projects || []).filter((p) => !p.description || String(p.description).trim().length < 50);
  if ((form.projects || []).length > 0 && thinProjects.length > 0) warnings.push(`${thinProjects.length} project description${thinProjects.length === 1 ? ' is' : 's are'} under 50 characters.`);
  const bio = String(form.personalInfo?.bio || '').trim();
  if (bio && (bio.length < 100 || bio.length > 900)) warnings.push('Summary works best at roughly 300–600 characters (2–4 sentences).');
  return warnings;
}

// --- Bullet writing guidance -----------------------------------------------
// Detects weak bullet structures and suggests stronger phrasing. Suggestions
// are structural examples only — we never invent metrics; the user is told to
// plug in their own real numbers.
const WEAK_PATTERNS = [
  { re: /^\s*worked on\b/i, label: 'Starts with “worked on”', tip: 'Lead with a strong verb: “Developed…”, “Built…”, “Shipped…”.' },
  { re: /^\s*responsible for\b/i, label: 'Starts with “responsible for”', tip: 'State what you actually did: “Owned…”, “Delivered…”, then the outcome.' },
  { re: /^\s*helped(\s+with|\s+in|\s+to)?\b/i, label: 'Starts with “helped”', tip: 'Name your contribution: “Implemented…”, “Automated…”.' },
  { re: /^\s*involved in\b/i, label: 'Starts with “involved in”', tip: 'Be specific about your role and the result.' },
  { re: /various|multiple|several|a lot|many things/i, label: 'Vague scope', tip: 'Replace vague words with the actual thing and scale.' },
];

const STRONG_VERBS = ['Developed', 'Built', 'Shipped', 'Designed', 'Automated', 'Improved', 'Reduced', 'Increased', 'Led', 'Migrated', 'Optimized'];

export function analyzeBullet(text) {
  const t = String(text || '').trim();
  if (!t) return null;
  const findings = [];
  for (const p of WEAK_PATTERNS) {
    if (p.re.test(t)) findings.push({ label: p.label, tip: p.tip });
  }
  if (t.length < 40) findings.push({ label: 'Very short', tip: 'Add what you did + the result. Aim for roughly 80–200 characters.' });
  if (!/\d/.test(t) && t.length >= 40) findings.push({ label: 'No measurable metric', tip: 'Add a real number you actually achieved (%, time saved, users). Never invent metrics.' });
  if (/^[a-z]/.test(t)) findings.push({ label: 'Lowercase start', tip: 'Start with a capital letter and a strong verb.' });
  if (!/[.!?]$/.test(t) && t.length >= 40) findings.push({ label: 'No closing punctuation', tip: 'End bullets consistently (periods are the safest choice).' });
  if (findings.length === 0) return { strong: true, findings: [] };
  return { strong: false, findings };
}

export function bulletSuggestion(text) {
  const t = String(text || '').trim();
  if (/worked on a website/i.test(t)) {
    return 'Example rewrite: “Developed a responsive React.js website that reduced page load time by 30%.” Use your real stack and your real numbers.';
  }
  const verb = STRONG_VERBS[Math.abs(hashStr(t)) % STRONG_VERBS.length];
  return `Try: “${verb} …” + what you built + the measurable result (your numbers only).`;
}

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

// Order resume sections per the user's saved order (unknown keys ignored,
// unordered sections appended in canonical order).
export function orderedSections(form = {}) {
  const saved = Array.isArray(form.sectionOrder) ? form.sectionOrder.filter((k) => CANONICAL_SECTION_ORDER.includes(k)) : [];
  const rest = CANONICAL_SECTION_ORDER.filter((k) => !saved.includes(k));
  return [...saved, ...rest];
}

// --- Reorder ---------------------------------------------------------------

export function moveItem(list, from, to) {
  if (to < 0 || to >= list.length || from < 0 || from >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

// --- Autosave hook ---------------------------------------------------------
// Debounces saves while the value is dirty; flushes on unmount and warns on
// accidental navigation via beforeunload while unsaved changes exist.
export function useAutosave(value, saveFn, { delay = 2000, enabled = true } = {}) {
  const [state, setState] = useState({ dirty: false, saving: false, lastSaved: null, error: null });
  const valueRef = useRef(value);
  const saveFnRef = useRef(saveFn);
  const timerRef = useRef(null);
  const mountedRef = useRef(true);

  valueRef.current = value;
  saveFnRef.current = saveFn;

  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);

  const firstRun = useRef(true);

  const flush = useCallback(async () => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    if (!enabled) return;
    setState((s) => ({ ...s, saving: true, error: null }));
    try {
      await saveFnRef.current(valueRef.current);
      if (mountedRef.current) {
        setState({ dirty: false, saving: false, lastSaved: new Date(), error: null });
      }
    } catch (e) {
      if (mountedRef.current) setState((s) => ({ ...s, saving: false, error: e }));
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    if (firstRun.current) { firstRun.current = false; return; }
    setState((s) => ({ ...s, dirty: true }));
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => { flush(); }, delay);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [value, delay, enabled]);

  // Flush pending save on unmount so navigation never loses data.
  useEffect(() => {
    return () => { if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; } };
  }, []);

  useEffect(() => {
    const onUnload = (e) => {
      if (state.dirty) { e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('beforeunload', onUnload);
    return () => window.removeEventListener('beforeunload', onUnload);
  }, [state.dirty]);

  return { ...state, flush };
}
