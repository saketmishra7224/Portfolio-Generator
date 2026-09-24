// ---------------------------------------------------------------------------
// Job-description resume matcher (pure, dependency-free, deterministic).
//
// All analysis runs locally in the browser: no network calls, no LLM, no
// data leaves the device except the app's own existing profile-save API.
// Same input always produces the same output.
//
// Honesty rules enforced by construction:
// - "Missing"/"not found" terms are NEVER written to the resume automatically.
// - The only write path is an explicit per-skill user confirmation in the UI.
// - Missing terms are framed as "add only if you genuinely have this skill".
// ---------------------------------------------------------------------------

const STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'of', 'to', 'in', 'on', 'for', 'with', 'as',
  'at', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been', 'will', 'would',
  'we', 'you', 'our', 'your', 'their', 'this', 'that', 'these', 'those', 'it',
  'its', 'who', 'which', 'what', 'when', 'where', 'how', 'all', 'any', 'each',
  'have', 'has', 'had', 'do', 'does', 'did', 'not', 'no', 'but', 'if', 'then',
  'than', 'so', 'such', 'into', 'over', 'under', 'about', 'between', 'through',
  'during', 'including', 'we’re', 'you’ll', 'join', 'looking', 'seeking',
  'hiring', 'required', 'plus', 'preferred', 'bonus', 'description',
  'responsibilities', 'qualifications', 'requirements', 'benefits', 'salary',
  'employer', 'ideal', 'candidate', 'company', 'position', 'opportunity',
  'role', 'team', 'work', 'job', 'apply', 'year', 'years', 'experience',
]);

const TECH_LEXICON = new Set([
  'react', 'angular', 'vue', 'svelte', 'next.js', 'nextjs', 'typescript',
  'javascript', 'node.js', 'nodejs', 'node', 'express', 'python', 'django',
  'flask', 'fastapi', 'java', 'spring', 'kotlin', 'swift', 'go', 'golang',
  'rust', 'php', 'laravel', 'ruby', 'rails', 'c++', 'c#', '.net', 'sql',
  'nosql', 'mongodb', 'postgres', 'postgresql', 'mysql', 'redis',
  'elasticsearch', 'graphql', 'rest', 'api', 'aws', 'azure', 'gcp',
  'docker', 'kubernetes', 'terraform', 'jenkins', 'github', 'gitlab',
  'linux', 'bash', 'git', 'jira', 'figma', 'jest', 'cypress',
  'playwright', 'selenium', 'tensorflow', 'pytorch', 'pandas', 'numpy',
  'html', 'css', 'sass', 'tailwind', 'redux', 'webpack', 'vite',
  'firebase', 'supabase', 'kafka', 'rabbitmq', 'nginx', 'oauth', 'jwt',
  'agile', 'scrum', 'microservices', 'android', 'ios', 'flutter',
  'react-native', 'prisma', 'ci/cd',
]);

const SOFT_SKILLS = [
  'communication', 'collaboration', 'teamwork', 'leadership', 'mentoring',
  'problem-solving', 'adaptability', 'time management', 'ownership',
  'attention to detail', 'critical thinking', 'stakeholder management',
];

const TITLE_PATTERNS = [
  'frontend developer', 'front-end developer', 'backend developer',
  'back-end developer', 'full-stack developer', 'full stack developer',
  'software engineer', 'software developer', 'data scientist',
  'data engineer', 'data analyst', 'devops engineer', 'site reliability engineer',
  'mobile developer', 'android developer', 'ios developer', 'qa engineer',
  'test engineer', 'ui engineer', 'ux designer', 'product manager',
  'engineering manager', 'tech lead', 'ml engineer', 'machine learning engineer',
  'security engineer', 'cloud engineer', 'intern', 'analyst', 'consultant',
  'solutions architect',
];

function normToken(t) {
  return String(t || '').toLowerCase().replace(/^[^a-z0-9+#]+|[^a-z0-9+#]+$/g, '');
}

function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s/-]/g, ' ')
    .split(/[\s,;|/()]+/)
    .map(normToken)
    .filter((t) => t && t.length >= 2 && !STOPWORDS.has(t));
}

function splitSections(jd) {
  const lines = String(jd || '').split('\n');
  const sections = [{ name: 'general', text: [] }];
  lines.forEach((line) => {
    const l = line.trim().toLowerCase();
    if (/^(must have|required|requirements|basic qualifications|minimum qualifications|what you('ll| will) bring|you have)\b/.test(l)) {
      sections.push({ name: 'required', text: [] });
    } else if (/^(preferred|nice.to.have|bonus|pluses|desired|preferred qualifications|good to have)\b/.test(l)) {
      sections.push({ name: 'preferred', text: [] });
    } else if (/^(responsibilities|what you('ll| will) do|the role|about the role|job description|overview|about us)\b/.test(l)) {
      sections.push({ name: 'general', text: [] });
    } else {
      sections[sections.length - 1].text.push(line);
    }
  });
  return sections.map((s) => ({ name: s.name, text: s.text.join('\n') }));
}

function topTerms(text, limit, minLen = 3) {
  const freq = new Map();
  tokenize(text).forEach((t) => {
    if (t.length < minLen && !/[+#\d]/.test(t)) return;
    freq.set(t, (freq.get(t) || 0) + 1);
  });
  return [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([t]) => t);
}

function repeatedBigrams(text, minCount = 2, limit = 12) {
  const tokens = tokenize(text);
  const freq = new Map();
  for (let i = 0; i < tokens.length - 1; i++) {
    const bg = `${tokens[i]} ${tokens[i + 1]}`;
    freq.set(bg, (freq.get(bg) || 0) + 1);
  }
  return [...freq.entries()]
    .filter(([, c]) => c >= minCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([t]) => t);
}

// Parse a job description into structured, inspectable parts.
export function parseJD(jdText) {
  const jd = String(jdText || '');
  const lower = jd.toLowerCase();
  const sections = splitSections(jd);
  const byName = (n) => sections.filter((s) => s.name === n).map((s) => s.text).join('\n');
  const requiredText = byName('required');
  const preferredText = byName('preferred');

  const techIn = (text) => [...new Set(tokenize(text).filter((t) => TECH_LEXICON.has(t)))];
  const allTech = techIn(jd);
  const requiredTech = techIn(requiredText);
  const preferredTech = techIn(preferredText);

  const titles = TITLE_PATTERNS.filter((t) => lower.includes(t));
  const softSkills = [...new Set(
    SOFT_SKILLS.filter((s) => lower.includes(s))
  )];
  const domains = repeatedBigrams(jd);

  let yearsRequired = null;
  const ym = jd.match(/(\d+)\s*\+?\s*(years?|yrs?)\b/i);
  if (ym) yearsRequired = parseInt(ym[1], 10);

  return {
    titles: titles.slice(0, 5),
    required: topTerms(requiredText || jd, 20),
    preferred: topTerms(preferredText, 15),
    techSkills: allTech.slice(0, 25),
    requiredTech,
    preferredTech,
    softSkills: softSkills.slice(0, 10),
    domains,
    yearsRequired,
    length: jd.trim().length,
    hasRequiredSection: requiredText.trim().length > 0,
    hasPreferredSection: preferredText.trim().length > 0,
  };
}

function resumeSkillSet(form = {}) {
  const set = new Set();
  (form.skills || []).forEach((s) => { const t = normToken(s); if (t) set.add(t); });
  Object.values(form.skillCategories || {}).forEach((list) => {
    (list || []).forEach((s) => { const t = normToken(s); if (t) set.add(t); });
  });
  return set;
}

function resumeTechCorpus(form = {}) {
  const bits = [
    ...(form.experiences || []).flatMap((x) => [x.role, x.description, (x.bullets || []).join(' '), (x.technologies || []).join(' ')]),
    ...(form.projects || []).flatMap((p) => [p.title, typeof p.technologies === 'string' ? p.technologies : (p.technologies || []).join(' '), p.description, (p.bullets || []).join(' ')]),
  ];
  return new Set(tokenize(bits.join(' ')));
}

function entryHits(entryText, requiredTerms, preferredTerms) {
  const tokens = new Set(tokenize(entryText));
  const req = requiredTerms.filter((t) => (t.includes(' ') ? entryText.toLowerCase().includes(t) : tokens.has(t)));
  const pref = preferredTerms.filter((t) => (t.includes(' ') ? entryText.toLowerCase().includes(t) : tokens.has(t)));
  return { req, pref, score: req.length * 2 + pref.length };
}

// Match a parsed JD against resume data. Transparent weighted estimate:
// Skills coverage 40 | Tech-stack coverage 25 | Experience relevance 15 |
// Title & background alignment 10 | Summary keyword presence 10.
export function matchResume(formData = {}, parsed) {
  const form = formData || {};
  const pi = form.personalInfo || {};
  const empty = {
    score: 0, evaluated: false,
    matchedSkills: [], missingSkills: [],
    matchedTech: [], missingTech: [],
    relevantExperience: [], relevantProjects: [],
    suggestedKeywords: [], sectionRecs: [], breakdown: [],
  };
  if (!parsed || parsed.length < 50) return empty;

  const skillSet = resumeSkillSet(form);
  const corpus = resumeTechCorpus(form);
  const corpusText = [...corpus].join(' ');
  const inResume = (t) => (t.includes(' ') ? corpusText.includes(t) || [...skillSet].join(' ').includes(t) : skillSet.has(t) || corpus.has(t));

  // Skills vs JD tech (required terms weigh double).
  const jdTech = [...new Set([...(parsed.requiredTech || []), ...(parsed.preferredTech || []), ...(parsed.techSkills || [])])].slice(0, 25);
  const matchedSkills = jdTech.filter((t) => skillSet.has(t));
  const missingSkills = jdTech.filter((t) => !skillSet.has(t));
  const reqTech = parsed.requiredTech || [];
  const reqMatched = reqTech.filter((t) => skillSet.has(t));
  const skillsScore = jdTech.length > 0
    ? Math.round(((reqMatched.length * 2 + (matchedSkills.length - reqMatched.length)) / Math.max(1, reqTech.length * 2 + Math.max(0, jdTech.length - reqTech.length))) * 100)
    : 100;

  // Tech-stack (experience + projects) coverage of JD tech.
  const matchedTech = jdTech.filter((t) => corpus.has(t) || skillSet.has(t));
  const missingTech = jdTech.filter((t) => !corpus.has(t) && !skillSet.has(t));
  const techScore = jdTech.length > 0 ? Math.round((matchedTech.length / jdTech.length) * 100) : 100;

  // Relevant experience / projects, ranked by required-term overlap.
  const reqTerms = [...new Set([...(parsed.required || []), ...(parsed.preferred || [])])].slice(0, 30);
  const prefTerms = [...new Set(parsed.preferred || [])].slice(0, 15);
  const relevantExperience = (form.experiences || [])
    .map((x, i) => {
      const text = [x.role, x.company, x.description, (x.bullets || []).join(' '), (x.technologies || []).join(' ')].join(' ');
      const h = entryHits(text, reqTerms, prefTerms);
      return { index: i, title: `${x.role || 'Role'} @ ${x.company || 'Company'}`, matchedTerms: [...h.req, ...h.pref].slice(0, 6), relevance: h.score };
    })
    .filter((e) => e.relevance > 0)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 3);
  const relevantProjects = (form.projects || [])
    .map((p, i) => {
      const tech = typeof p.technologies === 'string' ? p.technologies : (p.technologies || []).join(' ');
      const text = [p.title, tech, p.description, (p.bullets || []).join(' ')].join(' ');
      const h = entryHits(text, reqTerms, prefTerms);
      return { index: i, title: p.title || `Project ${i + 1}`, matchedTerms: [...h.req, ...h.pref].slice(0, 6), relevance: h.score };
    })
    .filter((e) => e.relevance > 0)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 3);
  const expScore = (parsed.requiredTech || []).length === 0 && reqTerms.length === 0
    ? 100
    : Math.min(100, Math.round(((relevantExperience.length > 0 ? 50 : 0) + (relevantProjects.length > 0 ? 50 : 0))));

  // Title & background alignment.
  const resumeText = [pi.headline, pi.tagline, pi.bio, ...(form.experiences || []).map((x) => x.role)].join(' ').toLowerCase();
  const titleHit = (parsed.titles || []).some((t) => resumeText.includes(t.split(' ')[0]));
  const eduHit = ((form.educations || []).length > 0 || pi.bio) ? true : false;
  const titleScore = (parsed.titles.length === 0 ? 50 : titleHit ? 50 : 0) + (eduHit ? 50 : 0);

  // Summary keyword presence.
  const summaryText = [pi.bio, pi.headline, pi.tagline].join(' ').toLowerCase();
  const summaryTokens = new Set(tokenize(summaryText));
  const jdTop = [...new Set([...(parsed.required || []), ...(parsed.techSkills || [])])].slice(0, 15);
  const summaryHits = jdTop.filter((t) => (t.includes(' ') ? summaryText.includes(t) : summaryTokens.has(t)));
  const summaryScore = jdTop.length > 0 ? Math.round((summaryHits.length / jdTop.length) * 100) : 100;

  const breakdown = [
    { key: 'skills', label: 'Skills coverage', weight: 40, score: skillsScore, reasons: [`${matchedSkills.length} of ${jdTech.length} JD technologies are in Skills${reqTech.length > 0 ? ` (${reqMatched.length}/${reqTech.length} required)` : ''}.`] },
    { key: 'tech', label: 'Tech-stack evidence', weight: 25, score: techScore, reasons: [`${matchedTech.length} of ${jdTech.length} JD technologies appear in experience/projects/skills.`] },
    { key: 'experience', label: 'Experience relevance', weight: 15, score: expScore, reasons: [relevantExperience.length + relevantProjects.length > 0 ? `${relevantExperience.length} relevant experience entries, ${relevantProjects.length} relevant projects.` : 'No experience or project entries overlap JD terms yet.'] },
    { key: 'title', label: 'Title & background', weight: 10, score: titleScore, reasons: [parsed.titles.length === 0 ? 'No explicit title detected in the JD.' : titleHit ? 'A JD title appears in the resume.' : `JD titles (${parsed.titles.slice(0, 3).join(', ')}) not echoed in headline/roles.`] },
    { key: 'summary', label: 'Summary keywords', weight: 10, score: summaryScore, reasons: [`${summaryHits.length} of ${jdTop.length} top JD terms appear in the summary/headline.`] },
  ];
  const score = Math.round(breakdown.reduce((a, c) => a + (c.score * c.weight) / 100, 0));

  // Suggested keywords: missing JD tech + domain bigrams absent from resume.
  const missingDomains = (parsed.domains || []).filter((d) => !corpusText.includes(d)).slice(0, 6);
  const suggestedKeywords = [...new Set([...missingSkills.slice(0, 8), ...missingDomains])].slice(0, 12);

  // Section-level recommendations (actionable, honesty-framed).
  const sectionRecs = [];
  if (missingSkills.length > 0) {
    sectionRecs.push({ section: 'Skills', rec: `Consider adding ${missingSkills.slice(0, 3).join(', ')} — but only if you genuinely have each skill through work, study, or projects.` });
  }
  const thinExp = (form.experiences || []).filter((x) => (x.bullets || []).length === 0);
  if (thinExp.length > 0) {
    sectionRecs.push({ section: 'Experience', rec: `${thinExp.length} experience ${thinExp.length === 1 ? 'entry has' : 'entries have'} no bullets. Add 2–3 bullets each, echoing JD terms where truthful (e.g. ${reqTerms.slice(0, 2).join(', ') || 'relevant tools'}).` });
  }
  if (summaryHits.length < Math.max(1, Math.floor(jdTop.length / 3)) && jdTop.length > 0) {
    sectionRecs.push({ section: 'Summary', rec: `Weave ${Math.min(3, jdTop.length - summaryHits.length)} top JD terms into the summary honestly (e.g. ${jdTop.filter((t) => !summaryHits.includes(t)).slice(0, 3).join(', ')}), if they describe you.` });
  }
  const projWithoutTech = (form.projects || []).filter((p) => {
    const tech = typeof p.technologies === 'string' ? p.technologies : (p.technologies || []).join(' ');
    return !(parsed.techSkills || []).some((t) => tech.toLowerCase().includes(t));
  });
  if (projWithoutTech.length > 0 && (parsed.techSkills || []).length > 0) {
    sectionRecs.push({ section: 'Projects', rec: `${projWithoutTech.length} project${projWithoutTech.length === 1 ? '' : 's'} mention none of the JD technologies. Tag real stacks used (${(parsed.techSkills || []).slice(0, 4).join(', ')} where true).` });
  }
  if (parsed.yearsRequired && !/\d+\s*(years?|yrs?)/i.test([pi.bio, pi.headline].join(' '))) {
    sectionRecs.push({ section: 'Summary', rec: `The JD asks for ~${parsed.yearsRequired} years. State your real years of experience in the summary or headline.` });
  }
  if ((parsed.softSkills || []).length > 0) {
    const resumeAll = [pi.bio, pi.headline, ...(form.experiences || []).flatMap((x) => [x.description, (x.bullets || []).join(' ')]), ...(form.achievements || []).map((a) => a.description)].join(' ').toLowerCase();
    const missingSoft = parsed.softSkills.filter((s) => !resumeAll.includes(s));
    if (missingSoft.length > 0) {
      sectionRecs.push({ section: 'Experience', rec: `JD values ${missingSoft.slice(0, 3).join(', ')}. Demonstrate ${missingSoft[0]} with a concrete bullet rather than claiming it outright.` });
    }
  }

  return {
    score, evaluated: true,
    matchedSkills, missingSkills, matchedTech, missingTech,
    relevantExperience, relevantProjects, suggestedKeywords,
    sectionRecs: sectionRecs.slice(0, 8),
    breakdown: breakdown.map((c) => ({ ...c, points: Math.round((c.score * c.weight) / 100), maxPoints: c.weight })),
  };
}
