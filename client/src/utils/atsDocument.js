// ---------------------------------------------------------------------------
// ATS document model (pure, dependency-free).
// Builds a parser-friendly resume structure from profile data:
// - single logical column, standard section headings, consistent dates
// - sections ordered per the ATS default order, customized by the user's
//   saved sectionOrder and visibility toggles
// Used by the on-screen ATS preview, the text-based PDF generator and tests.
// ---------------------------------------------------------------------------

export const ATS_DEFAULT_ORDER = [
  'summary',
  'skills',
  'experience',
  'projects',
  'education',
  'certifications',
  'achievements',
  'leadership',
  'languages',
  'publications',
  'volunteering',
];

export const ATS_SECTION_TITLES = {
  summary: 'PROFESSIONAL SUMMARY',
  skills: 'TECHNICAL SKILLS',
  experience: 'EXPERIENCE',
  projects: 'PROJECTS',
  education: 'EDUCATION',
  certifications: 'CERTIFICATIONS',
  achievements: 'ACHIEVEMENTS',
  leadership: 'LEADERSHIP',
  languages: 'LANGUAGES',
  publications: 'PUBLICATIONS',
  volunteering: 'VOLUNTEERING',
};

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// Normalize a free-form date to a consistent "Mon YYYY" / "Month YYYY" form.
// Passes through 'Present' and unparseable values untouched (never dropped).
export function formatAtsDate(value, style = 'short') {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^present$/i.test(raw)) return 'Present';
  let year = null;
  let month = null;
  let m = raw.match(/^(19|20)\d{2}-(0[1-9]|1[0-2])$/);
  if (m) {
    year = raw.slice(0, 4);
    month = parseInt(raw.slice(5, 7), 10);
  } else if (/^(0[1-9]|1[0-2])\/(19|20)\d{2}$/.test(raw)) {
    const parts = raw.split('/');
    month = parseInt(parts[0], 10);
    year = parts[1];
  } else if (/^(19|20)\d{2}$/.test(raw)) {
    year = raw;
  } else {
    return raw;
  }
  const names = style === 'long' ? MONTHS_LONG : MONTHS_SHORT;
  return month ? `${names[month - 1]} ${year}` : year;
}

export function formatAtsRange(item = {}, style = 'short') {
  const start = formatAtsDate(item.startDate || item.issueDate || item.date, style);
  const endRaw = item.current ? 'Present' : (item.endDate || item.expirationDate || '');
  const end = formatAtsDate(endRaw, style);
  if (start && end) return `${start} - ${end}`;
  return start || end;
}

export function stripUrl(u) {
  return String(u || '').replace(/^https?:\/\//, '').replace(/\/$/, '');
}

function enabledOf(form, key) {
  return (form.sectionsEnabled || {})[key] !== false;
}

// Order ATS sections: start from the user's saved order (restricted to known
// ATS sections), then append the rest in ATS default order.
export function atsOrderedSections(form = {}) {
  const saved = Array.isArray(form.sectionOrder)
    ? form.sectionOrder.filter((k) => ATS_DEFAULT_ORDER.includes(k))
    : [];
  const rest = ATS_DEFAULT_ORDER.filter((k) => !saved.includes(k));
  return [...saved, ...rest];
}

function flatSkills(form = {}) {
  const cats = form.skillCategories || {};
  const out = [];
  const seen = new Set();
  const push = (s) => {
    const name = String(s || '').trim();
    if (!name) return;
    const k = name.toLowerCase();
    if (seen.has(k)) return;
    seen.add(k);
    out.push(name);
  };
  for (const c of ['programmingLanguages', 'frameworks', 'libraries', 'databases', 'cloud', 'devOps', 'tools', 'aiMl', 'other']) {
    (cats[c] || []).forEach(push);
  }
  (form.skills || []).forEach(push);
  return out;
}

function legacyEducations(form = {}) {
  if (Array.isArray(form.educations) && form.educations.length > 0) return form.educations;
  const e = form.education || {};
  if (e.college || e.degree) {
    return [{
      institution: e.college || '', degree: e.degree || '', field: e.specialization || '',
      startDate: '', endDate: '', current: false, grade: e.cgpa || '', location: '',
      description: '', coursework: [],
    }];
  }
  return [];
}

// Build the full ATS document model. All text is plain strings — no markup,
// no icons, no images — so renderers (HTML preview, PDF) stay parser-safe.
export function buildAtsDocument(formData = {}, opts = {}) {
  const form = formData || {};
  const dateStyle = opts.dateStyle === 'long' ? 'long' : 'short';
  const pi = form.personalInfo || {};
  const social = form.socialLinks || {};

  const contactParts = [pi.email, pi.phone, pi.location].filter(Boolean);
  const links = [];
  if (social.github) links.push({ text: stripUrl(social.github), url: social.github });
  if (pi.linkedin) links.push({ text: stripUrl(pi.linkedin), url: pi.linkedin });
  if (pi.website) links.push({ text: stripUrl(pi.website), url: pi.website });
  (Array.isArray(pi.links) ? pi.links : []).filter((l) => l && l.url).slice(0, 3).forEach((l) => {
    links.push({ text: l.label ? `${l.label}: ${stripUrl(l.url)}` : stripUrl(l.url), url: l.url });
  });

  const summary = pi.bio || pi.headline || pi.tagline || (form.education || {}).summary || '';
  const skills = flatSkills(form);
  const skillGroups = [];
  const cats = form.skillCategories || {};
  const groupLabels = {
    programmingLanguages: 'Programming Languages', frameworks: 'Frameworks', libraries: 'Libraries',
    databases: 'Databases', cloud: 'Cloud', devOps: 'DevOps', tools: 'Tools', 'aiMl': 'AI/ML', other: 'Other',
  };
  for (const [key, label] of Object.entries(groupLabels)) {
    const items = (cats[key] || []).map((s) => String(s || '').trim()).filter(Boolean);
    if (items.length > 0) skillGroups.push({ label, items });
  }

  const sections = [];
  const pushSection = (key, blocks) => {
    if (!enabledOf(form, key)) return;
    const nonEmpty = (blocks || []).filter(Boolean);
    if (nonEmpty.length === 0) return;
    sections.push({ key, title: ATS_SECTION_TITLES[key], blocks: nonEmpty });
  };

  if (summary) {
    pushSection('summary', [{ type: 'para', text: summary }]);
  }

  if (skills.length > 0) {
    pushSection('skills', skillGroups.length > 0
      ? skillGroups.map((g) => ({ type: 'skills', label: g.label, items: g.items }))
      : [{ type: 'skills', label: null, items: skills }]);
  }

  if ((form.experiences || []).length > 0) pushSection('experience', (form.experiences || []).map((x) => ({
    type: 'entry',
    title: [x.role || 'Role', x.company || 'Company'].filter(Boolean).join(' - '),
    meta: [formatAtsRange(x, dateStyle), x.location, x.employmentType].filter(Boolean).join(' | '),
    desc: x.description || '',
    bullets: (x.bullets || []).map((b) => String(b || '').trim()).filter(Boolean),
    tech: (Array.isArray(x.technologies) ? x.technologies : []).map((t) => String(t || '').trim()).filter(Boolean),
  })));

  if ((form.projects || []).length > 0) pushSection('projects', (form.projects || []).map((p) => {
    const tech = Array.isArray(p.technologies) ? p.technologies.join(', ') : (p.technologies || '');
    const linkBits = [p.liveUrl && `Live: ${stripUrl(p.liveUrl)}`, p.githubUrl && `Code: ${stripUrl(p.githubUrl)}`, p.link && `Link: ${stripUrl(p.link)}`].filter(Boolean);
    return {
      type: 'entry',
      title: p.title ? (p.role ? `${p.title} - ${p.role}` : p.title) : 'Project',
      meta: [tech, formatAtsRange(p, dateStyle)].filter(Boolean).join(' | '),
      desc: p.description || '',
      bullets: (p.bullets || []).map((b) => String(b || '').trim()).filter(Boolean),
      extra: (p.outcomes || []).length > 0 ? `Outcomes: ${p.outcomes.join('; ')}` : '',
      links: linkBits.join(' | '),
    };
  }));

  const educs = legacyEducations(form);
  if (educs.length > 0) pushSection('education', educs.map((e) => ({
    type: 'entry',
    title: [e.degree, e.field].filter(Boolean).join(', ') || 'Degree',
    meta: [e.institution, e.location, formatAtsRange(e, dateStyle)].filter(Boolean).join(', '),
    desc: [e.grade ? `Grade: ${e.grade}` : '', (e.coursework || []).length > 0 ? `Coursework: ${e.coursework.join(', ')}` : '', e.description || ''].filter(Boolean).join('\n'),
    bullets: [],
  })));

  if ((form.certifications || []).length > 0) pushSection('certifications', (form.certifications || []).map((c) => ({
    type: 'line',
    text: [c.name, [c.organization, formatAtsDate(c.issueDate, dateStyle)].filter(Boolean).join(', '), c.credentialId ? `ID: ${c.credentialId}` : ''].filter(Boolean).join(' - '),
    url: c.credentialUrl || null,
  })));

  if ((form.achievements || []).length > 0) pushSection('achievements', (form.achievements || []).map((a) => ({
    type: 'entry',
    title: a.title || 'Achievement',
    meta: [a.organization, formatAtsDate(a.date, dateStyle)].filter(Boolean).join(', '),
    desc: a.description || '',
    bullets: [],
  })));

  if ((form.leadership || []).length > 0) pushSection('leadership', (form.leadership || []).map((l) => ({
    type: 'entry',
    title: l.role ? (l.organization ? `${l.role} - ${l.organization}` : l.role) : 'Leadership',
    meta: formatAtsDate(l.date, dateStyle),
    desc: l.description || '',
    bullets: [],
  })));

  if ((form.languages || []).length > 0) pushSection('languages', [{
    type: 'para',
    text: (form.languages || []).map((l) => `${l.name}${l.proficiency ? ` (${l.proficiency})` : ''}`).join(' | '),
  }]);

  if ((form.publications || []).length > 0) pushSection('publications', (form.publications || []).map((p) => ({
    type: 'line',
    text: [p.title, [p.publisher, formatAtsDate(p.date, dateStyle)].filter(Boolean).join(', ')].filter(Boolean).join(' - '),
    url: p.url || null,
  })));

  if ((form.volunteering || []).length > 0) pushSection('volunteering', (form.volunteering || []).map((v) => ({
    type: 'entry',
    title: `${v.role || 'Volunteer'} - ${v.organization || 'Organization'}`,
    meta: formatAtsRange(v, dateStyle),
    desc: v.description || '',
    bullets: [],
  })));

  // Apply section ordering (summary/skills keep ATS priority unless reordered).
  const order = atsOrderedSections(form);
  sections.sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key));

  return {
    name: pi.name || '',
    headline: pi.headline || pi.tagline || '',
    contact: contactParts,
    links,
    sections,
    dateStyle,
  };
}
