import { findUnmappableChars } from './atsText';

// ---------------------------------------------------------------------------
// ATS audit engine (pure, dependency-free apart from the shared text rules).
// Produces an "ATS readiness estimate" from transparent, inspectable checks —
// never pretending to reproduce a proprietary ATS algorithm.
// Categories: Structure 25% | Completeness 20% | Formatting 20% |
// Keywords 20% | Readability 15%. When no job description is supplied the
// keyword category is marked unevaluated and weight is redistributed.
// ---------------------------------------------------------------------------

const STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'of', 'to', 'in', 'on', 'for', 'with', 'as',
  'at', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been', 'will', 'would',
  'we', 'you', 'our', 'your', 'their', 'this', 'that', 'these', 'those', 'it',
  'its', 'who', 'which', 'what', 'when', 'where', 'how', 'all', 'any', 'each',
  'have', 'has', 'had', 'do', 'does', 'did', 'not', 'no', 'but', 'if', 'then',
  'than', 'so', 'such', 'into', 'over', 'under', 'about', 'between', 'through',
  'during', 'including', 'ideal', 'join', 'us', 'team', 'work', 'working',
  'looking', 'seeking', 'role', 'candidate', 'ability', 'strong', 'good',
  'great', 'best', 'plus', 'etc', 'eg', 'ie', 'per', 'via', 'job', 'apply',
  'company', 'position', 'opportunity', 'joining', 'hiring', 'required',
  'plus', 'preferred', 'bonus', 'description', 'responsibilities',
  'qualifications', 'requirements', 'benefits', 'salary', 'employer',
  'preferred', 'nice',
]);

// Skill/tool lexicon used ONLY to filter which job-description terms are
// worth surfacing as "missing". This keeps generic JD boilerplate ("hiring",
// "required", "big") out of suggestions. We never invent skills — missing
// terms are framed as "add only if you genuinely have them".
const TECH_LEXICON = new Set([
  'react', 'angular', 'vue', 'svelte', 'next.js', 'nextjs', 'typescript',
  'javascript', 'node.js', 'nodejs', 'node', 'express', 'python', 'django',
  'flask', 'fastapi', 'java', 'spring', 'kotlin', 'swift', 'go', 'golang',
  'rust', 'php', 'laravel', 'ruby', 'rails', 'c++', 'c#', '.net', 'sql',
  'nosql', 'mongodb', 'postgres', 'postgresql', 'mysql', 'redis',
  'elasticsearch', 'graphql', 'rest', 'api', 'aws', 'azure', 'gcp',
  'docker', 'kubernetes', 'terraform', 'jenkins', 'github', 'gitlab',
  'ci/cd', 'linux', 'bash', 'git', 'jira', 'figma', 'jest', 'cypress',
  'playwright', 'selenium', 'tensorflow', 'pytorch', 'pandas', 'numpy',
  'machine', 'html', 'css', 'sass', 'tailwind', 'redux', 'webpack', 'vite',
  'firebase', 'supabase', 'kafka', 'rabbitmq', 'nginx', 'oauth', 'jwt',
  'agile', 'scrum', 'tdd', 'microservices', 'android', 'ios', 'flutter',
  'react-native', 'typescript', 'prisma', 'trpc', 'graphql',
]);

function isWorthSurfacing(term) {
  if (term.includes(' ')) return true; // repeated bigrams are specific
  if (/[+#]/.test(term) || /\d/.test(term)) return true;
  return TECH_LEXICON.has(term);
}

const GENERIC_WORDS = [
  'various', 'multiple', 'several', 'helped', 'responsible', 'worked',
  'involved', 'assisted', 'liaison', 'synergy', 'synergize', 'hardworking',
  'hard-working', 'passionate', 'guru', 'ninja', 'rockstar', 'dynamic',
  'proactive', 'self-starter', 'team-player', 'detail-oriented', 'results-driven',
];

function normToken(t) {
  return String(t || '').toLowerCase().replace(/^[^a-z0-9+#]+|[^a-z0-9+#]+$/g, '');
}

function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s-]/g, ' ')
    .split(/[\s,;|/()]+/)
    .map(normToken)
    .filter((t) => t && t.length >= 2 && !STOPWORDS.has(t));
}

function resumeCorpus(form = {}) {
  const pi = form.personalInfo || {};
  const bits = [
    pi.bio, pi.headline, pi.tagline,
    (form.education || {}).summary,
    ...((form.skills || []).join(' ') ? [form.skills.join(' ')] : []),
    ...Object.values(form.skillCategories || {}).map((l) => (l || []).join(' ')),
    ...(form.experiences || []).flatMap((x) => [x.company, x.role, x.description, (x.bullets || []).join(' '), (x.technologies || []).join(' ')]),
    ...(form.projects || []).flatMap((p) => [p.title, typeof p.technologies === 'string' ? p.technologies : (p.technologies || []).join(' '), p.description, (p.bullets || []).join(' '), (p.outcomes || []).join(' ')]),
    ...(form.educations || []).flatMap((e) => [e.institution, e.degree, e.field, (e.coursework || []).join(' ')]),
    ...(form.certifications || []).flatMap((c) => [c.name, c.organization]),
    ...(form.achievements || []).flatMap((a) => [a.title, a.description]),
  ];
  return tokenize(bits.join(' '));
}

function jdTerms(jd) {
  const tokens = tokenize(jd);
  const freq = new Map();
  tokens.forEach((t) => freq.set(t, (freq.get(t) || 0) + 1));
  // Bigrams of adjacent meaningful tokens.
  for (let i = 0; i < tokens.length - 1; i++) {
    const bg = `${tokens[i]} ${tokens[i + 1]}`;
    freq.set(bg, (freq.get(bg) || 0) + 1);
  }
  const uni = [...freq.entries()]
    .filter(([t]) => !t.includes(' '))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(([t]) => t);
  const bi = [...freq.entries()]
    .filter(([t, c]) => t.includes(' ') && c >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([t]) => t);
  return { terms: [...uni, ...bi], freq };
}

function bulletStats(form = {}) {
  const bullets = [
    ...((form.experiences || []).flatMap((x) => x.bullets || [])),
    ...((form.projects || []).flatMap((p) => p.bullets || [])),
  ].map((b) => String(b || '').trim()).filter(Boolean);
  return bullets;
}

const WEAK_OPENERS = [/^\s*worked on\b/i, /^\s*responsible for\b/i, /^\s*helped\b/i, /^\s*involved in\b/i, /^\s*assisted\b/i];
const ACTION_VERBS = ['develop', 'built', 'design', 'implement', 'creat', 'ship', 'launch', 'lead', 'manag', 'improv', 'reduc', 'increas', 'automat', 'optimiz', 'migrat', 'architect', 'deploy', 'test', 'debug', 'mentor', 'collaborat', 'deliver', 'drove', 'owned'];

export function auditResume(formData = {}, jobDescription = '') {
  const form = formData || {};
  const pi = form.personalInfo || {};
  const edu = form.education || {};
  const categories = [];
  const suggestions = [];

  const has = (v) => v && String(v).trim().length > 0;
  const skills = [...new Set([
    ...((form.skills || []).map((s) => String(s || '').trim()).filter(Boolean)),
    ...Object.values(form.skillCategories || {}).flat().map((s) => String(s || '').trim()).filter(Boolean),
  ])];
  const educCount = (form.educations || []).length + ((edu.college || edu.degree) && (form.educations || []).length === 0 ? 1 : 0);
  const expCount = (form.experiences || []).length;
  const projCount = (form.projects || []).length;
  const bullets = bulletStats(form);

  // ---- Structure (25) ----
  let structurePts = 0;
  const structureReasons = [];
  const sChecks = [
    { ok: has(pi.name), label: 'Full name present', miss: 'Add your full name at the top.' },
    { ok: has(pi.email), label: 'Email present', miss: 'Add your email address.' },
    { ok: has(pi.phone), label: 'Phone present', miss: 'Add your phone number.' },
    { ok: has(pi.bio) || has(pi.headline) || has(pi.tagline) || has(edu.summary), label: 'Professional summary present', miss: 'Add a 2–4 sentence professional summary.' },
    { ok: educCount > 0, label: 'Education section present', miss: 'Add at least one education entry.' },
    { ok: skills.length > 0, label: 'Skills section present', miss: 'Add technical skills for keyword matching.' },
    { ok: expCount + projCount > 0, label: 'Experience or projects present', miss: 'Add experience or at least one project.' },
  ];
  const nonEmptySections = ['summary', 'skills', 'experience', 'projects', 'education', 'certifications', 'achievements', 'leadership', 'languages', 'publications', 'volunteering'].filter((k) => {
    switch (k) {
      case 'summary': return has(pi.bio) || has(pi.headline) || has(pi.tagline) || has(edu.summary);
      case 'skills': return skills.length > 0;
      case 'experience': return expCount > 0;
      case 'projects': return projCount > 0;
      case 'education': return educCount > 0;
      case 'certifications': return (form.certifications || []).length > 0;
      case 'achievements': return (form.achievements || []).length > 0;
      case 'leadership': return (form.leadership || []).length > 0;
      case 'languages': return (form.languages || []).length > 0;
      case 'publications': return (form.publications || []).length > 0;
      case 'volunteering': return (form.volunteering || []).length > 0;
      default: return false;
    }
  });
  sChecks.forEach((c) => {
    const pts = 100 / (sChecks.length + 1);
    if (c.ok) { structurePts += pts; structureReasons.push(`✓ ${c.label}`); }
    else { structureReasons.push(`✗ ${c.label}`); suggestions.push(c.miss); }
  });
  const totalTextLength = [
    pi.bio, pi.headline, pi.tagline, edu.summary,
    ...(form.experiences || []).flatMap((x) => [x.description, (x.bullets || []).join(' ')]),
    ...(form.projects || []).flatMap((p) => [p.description, (p.bullets || []).join(' ')]),
  ].join(' ').trim().length;
  if (nonEmptySections.length > 9 && totalTextLength < 600) {
    structurePts -= 8;
    structureReasons.push('✗ Many sections with thin content — parsers handle focused resumes best.');
    suggestions.push('Consider hiding your least relevant optional section (visibility switches) to keep the resume focused.');
  } else {
    structurePts += 100 / (sChecks.length + 1);
    structureReasons.push('✓ Standard section headings in a predictable order.');
  }
  structurePts = Math.max(0, Math.min(100, Math.round(structurePts)));
  categories.push({ key: 'structure', label: 'Structure', weight: 25, score: structurePts, reasons: structureReasons });

  // ---- Content completeness (20) ----
  let compPts = 0;
  const compReasons = [];
  const summary = pi.bio || pi.headline || pi.tagline || edu.summary || '';
  // Checks for absent sections are excluded (not auto-passed), so empty
  // profiles can never inflate this category.
  const cChecks = [
    { pts: 30, ok: String(summary).trim().length >= 100, good: 'Summary has substance (100+ characters).', miss: 'Expand the professional summary (aim roughly 300–600 characters).' },
    { pts: 30, ok: skills.length >= 5, good: `${skills.length} skills listed.`, miss: 'Add 5+ skills you genuinely have for stronger matching.' },
    ...(projCount > 0 ? [{ pts: 20, ok: (form.projects || []).every((p) => String(p.description || '').trim().length >= 50), good: 'Project descriptions are detailed.', miss: 'Expand thin project descriptions to 50+ characters with your role and outcome.' }] : []),
    ...(expCount > 0 ? [{ pts: 20, ok: (form.experiences || []).some((x) => (x.bullets || []).length > 0), good: 'Experience uses achievement bullets.', miss: 'Add achievement bullets to experience entries.' }] : []),
  ];
  const cTotal = cChecks.reduce((a, c) => a + c.pts, 0);
  cChecks.forEach((c) => {
    if (c.ok) { compPts += c.pts; compReasons.push(`✓ ${c.good}`); }
    else { compReasons.push(`✗ ${c.miss}`); suggestions.push(c.miss); }
  });
  compPts = cTotal > 0 ? Math.round((compPts / cTotal) * 100) : 0;
  categories.push({ key: 'completeness', label: 'Content completeness', weight: 20, score: compPts, reasons: compReasons });

  // ---- Formatting compatibility (20) ----
  let fmtPts = 0;
  const fmtReasons = [];
  const dateSamples = [
    ...(form.experiences || []).flatMap((x) => [x.startDate, x.endDate]),
    ...(form.projects || []).flatMap((p) => [p.startDate, p.endDate]),
    ...(form.educations || []).flatMap((e) => [e.startDate, e.endDate]),
  ].map((d) => String(d || '').trim()).filter(Boolean);
  const dateStyles = new Set(dateSamples.map((d) => {
    if (/^\d{4}-\d{2}$/.test(d)) return 'iso';
    if (/^\d{2}\/\d{4}$/.test(d)) return 'slash';
    if (/^\d{4}$/.test(d)) return 'year';
    if (/^present$/i.test(d)) return 'present';
    return 'free';
  }));
  dateStyles.delete('present');
  const consistentDates = dateStyles.size <= 1;
  // Characters the ATS PDF cannot represent are transliterated (never dropped
  // silently for Latin scripts); anything else is flagged here instead.
  const unmappable = [...new Set(
    [pi.name, pi.bio, pi.headline, ...(form.experiences || []).flatMap((x) => [x.company, x.role, x.description, (x.bullets || []).join(' ')]),
      ...(form.projects || []).flatMap((p) => [p.title, p.description, (p.bullets || []).join(' ')]),
    ].flatMap((t) => findUnmappableChars(t))
  )].slice(0, 8);
  const fChecks = [
    { pts: 25, ok: true, good: 'Single-column layout with no tables, text boxes or multi-column areas.' },
    { pts: 20, ok: true, good: 'Standard fonts only (Helvetica / Times) with normal text hierarchy.' },
    { pts: 15, ok: true, good: 'No photos, icons, skill bars, charts or decorative graphics in ATS output.' },
    { pts: 15, ok: true, good: 'Plain-text contact block and hyperlinks (no icon-dependent info).' },
    { pts: 15, ok: consistentDates, good: 'Consistent date format throughout.', miss: 'Unify date formats (e.g. all YYYY-MM) so parsers read them reliably.' },
    { pts: 10, ok: unmappable.length === 0, good: 'All characters are representable in ATS-safe fonts.', miss: `Non-Latin characters detected (${unmappable.join(' ')}). The PDF transliterates what it can; consider an English rendering for ATS use.` },
  ];
  const fTotal = fChecks.reduce((a, c) => a + c.pts, 0);
  fChecks.forEach((c) => {
    if (c.ok) { fmtPts += c.pts; fmtReasons.push(`✓ ${c.good}`); }
    else { fmtReasons.push(`✗ ${c.miss}`); suggestions.push(c.miss); }
  });
  fmtPts = Math.round((fmtPts / fTotal) * 100);
  categories.push({ key: 'formatting', label: 'Formatting compatibility', weight: 20, score: fmtPts, reasons: fmtReasons });

  // ---- Keywords (20, only when a JD is supplied) ----
  const jd = String(jobDescription || '').trim();
  let keywords = { matched: [], missing: [], overused: [], evaluated: false };
  if (jd.length >= 50) {
    keywords.evaluated = true;
    const { terms } = jdTerms(jd);
    const corpus = new Set(resumeCorpus(form));
    const corpusText = resumeCorpus(form).join(' ');
    const matched = terms.filter((t) => t.includes(' ') ? corpusText.includes(t) : corpus.has(t)).slice(0, 15);
    const missing = terms
      .filter((t) => !(t.includes(' ') ? corpusText.includes(t) : corpus.has(t)))
      .filter(isWorthSurfacing)
      .slice(0, 12);
    const counts = new Map();
    resumeCorpus(form).forEach((t) => counts.set(t, (counts.get(t) || 0) + 1));
    const overused = [...counts.entries()]
      .filter(([t, c]) => c >= 8 && t.length > 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([t, c]) => `${t} (×${c})`);
    keywords = { matched, missing, overused, evaluated: true };
    const denom = Math.max(1, matched.length + missing.length);
    const kwScore = Math.round((matched.length / denom) * 100);
    const kwReasons = [
      `${matched.length} of ${denom} extracted job-description terms appear in the resume.`,
      ...(missing.length > 0 ? [`Missing: ${missing.slice(0, 5).join(', ')}${missing.length > 5 ? '…' : ''}`] : ['No major missing terms detected.']),
      ...(overused.length > 0 ? [`Possibly overused: ${overused.join(', ')}`] : []),
    ];
    categories.push({ key: 'keywords', label: 'Keyword alignment', weight: 20, score: kwScore, reasons: kwReasons });
    if (missing.length > 0) {
      suggestions.push(`Add ${Math.min(3, missing.length)} relevant technologies to Skills if you genuinely have them: ${missing.slice(0, 3).join(', ')}. Only list skills you actually possess.`);
    }
  } else {
    categories.push({
      key: 'keywords', label: 'Keyword alignment', weight: 20, score: null, evaluated: false,
      reasons: ['Not evaluated — paste a target job description to compare its terms against the resume.'],
    });
    suggestions.push('Paste a target job description to unlock keyword alignment analysis.');
  }

  // ---- Readability (15) ----
  let readPts = 0;
  const readReasons = [];
  const weak = bullets.filter((b) => WEAK_OPENERS.some((re) => re.test(b)));
  const withMetrics = bullets.filter((b) => /\d/.test(b));
  const avgLen = bullets.length > 0 ? bullets.reduce((a, b) => a + b.length, 0) / bullets.length : 0;
  const hasBullets = bullets.length > 0;
  const needsBullets = expCount + projCount > 0;
  // No vacuous passes: a resume with almost no text scores 0 here, so empty
  // profiles are never inflated.
  const tooLittleText = totalTextLength < 100;
  const rChecks = [
    { pts: 35, ok: !tooLittleText && (!hasBullets ? !needsBullets : weak.length / bullets.length < 0.3), good: 'Bullets start with strong action language.', miss: tooLittleText ? 'Add substantive content (descriptions, bullets) before readability can be assessed.' : `Rewrite ${weak.length} weak bullet${weak.length === 1 ? '' : 's'} starting with “worked on / responsible for / helped”.` },
    { pts: 35, ok: !tooLittleText && (!hasBullets ? !needsBullets : withMetrics.length > 0), good: 'Bullets include measurable outcomes.', miss: tooLittleText ? 'Add substantive content (descriptions, bullets) before readability can be assessed.' : 'Add measurable outcomes (numbers you actually achieved) to bullets where applicable.' },
    { pts: 30, ok: !tooLittleText && (!hasBullets ? totalTextLength > 300 : (avgLen >= 40 && avgLen <= 280)), good: 'Bullet and paragraph lengths are parser-friendly.', miss: 'Keep bullets roughly 40–280 characters for clean extraction.' },
  ];
  rChecks.forEach((c) => {
    if (c.ok) { readPts += c.pts; readReasons.push(`✓ ${c.good}`); }
    else { readReasons.push(`✗ ${c.miss}`); suggestions.push(c.miss); }
  });
  // Action-verb presence (informational, folded into readability messaging).
  const corpusJoined = resumeCorpus(form).join(' ');
  const verbsFound = ACTION_VERBS.filter((v) => corpusJoined.includes(v));
  if (verbsFound.length > 0) readReasons.push(`✓ Action verbs present (${verbsFound.slice(0, 5).join(', ')}${verbsFound.length > 5 ? '…' : ''}).`);
  else {
    readReasons.push('✗ Few action verbs detected.');
    suggestions.push('Start bullets with action verbs (Developed, Built, Automated, Improved…).');
  }
  categories.push({ key: 'readability', label: 'Readability', weight: 15, score: readPts, reasons: readReasons });

  // Generic-language check → suggestion (not double-counted in score).
  const genericHits = GENERIC_WORDS.filter((w) => corpusJoined.includes(w));
  if (genericHits.length > 0) {
    suggestions.push(`Replace generic wording where possible: ${[...new Set(genericHits)].slice(0, 5).join(', ')}.`);
  }

  // Weighted total over evaluated categories (renormalized when JD absent).
  const evaluated = categories.filter((c) => c.score !== null && c.score !== undefined);
  const totalWeight = evaluated.reduce((a, c) => a + c.weight, 0);
  const estimate = Math.round(evaluated.reduce((a, c) => a + (c.score * c.weight) / totalWeight, 0));

  return {
    estimate,
    maxScore: 100,
    label: 'ATS readiness estimate',
    disclaimer: 'An internal estimate from transparent checks — not a guaranteed ATS score. Real applicant-tracking systems are proprietary.',
    categories: evaluated.map((c) => ({
      key: c.key, label: c.label, weight: c.weight,
      score: c.score, points: Math.round((c.score * c.weight) / 100), maxPoints: c.weight,
      reasons: c.reasons,
    })),
    keywordsEvaluated: keywords.evaluated,
    keywords,
    suggestions: [...new Set(suggestions)].slice(0, 10),
    stats: {
      sections: nonEmptySections.length, skills: skills.length,
      bullets: bullets.length, weakBullets: weak.length, withMetrics: withMetrics.length,
      textLength: totalTextLength,
    },
  };
}
