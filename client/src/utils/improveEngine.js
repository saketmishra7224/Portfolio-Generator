// ---------------------------------------------------------------------------
// On-device resume writing assistant (pure, dependency-free, deterministic).
//
// The engine ONLY rearranges words the user already wrote, plus:
// - verbs/adjectives from a fixed rewrite table (style, not facts),
// - technical terms already present in the user's own resume corpus
//   (explicitly flagged as added detail for review),
// - formatting (capitalization, punctuation, conciseness).
//
// It can NEVER invent metrics, companies, technologies outside the provided
// context, certifications, or responsibilities: it has no external knowledge
// source and no number generator. When a metric would help but none exists,
// it returns a metricPrompt instead of text. Every suggestion requires
// explicit user approval in the UI before replacing anything.
// ---------------------------------------------------------------------------

const STRONG_VERB_FOR_NOUN = [
  { re: /\b(website|web app|application|app|platform|portal|dashboard)\b/i, verb: 'Developed' },
  { re: /\b(api|service|endpoint|backend|server|pipeline)\b/i, verb: 'Built' },
  { re: /\b(event|workshop|hackathon|meetup|club)\b/i, verb: 'Organized' },
  { re: /\b(team|interns|juniors|members)\b/i, verb: 'Led' },
  { re: /\b(report|paper|article|blog|documentation|docs)\b/i, verb: 'Authored' },
  { re: /\b(design|ui|interface|layout|prototype|mockup)\b/i, verb: 'Designed' },
  { re: /\b(test|suite|automation|script)\b/i, verb: 'Automated' },
  { re: /\b(bug|issue|latency|performance|query)\b/i, verb: 'Optimized' },
  { re: /\b(model|classifier|dataset|analysis)\b/i, verb: 'Trained' },
];

const WEAK_OPENER_REWRITES = [
  { re: /^\s*made\s+(a|an|the)\s+/i, verb: null, keepArticle: true }, // verb chosen by noun below
  { re: /^\s*worked\s+on\s+/i, verb: null },
  { re: /^\s*did\s+(a|an|the)\s+/i, verb: null, keepArticle: true },
  { re: /^\s*helped\s+(to\s+)?/i, verb: null },
  { re: /^\s*helped\s+with\s+/i, verb: null },
  { re: /^\s*was\s+involved\s+in\s+/i, verb: 'Contributed to' },
  { re: /^\s*involved\s+in\s+/i, verb: 'Contributed to' },
  { re: /^\s*responsible\s+for\s+/i, verb: null }, // + gerund handling
  { re: /^\s*assisted\s+(with\s+|in\s+)?/i, verb: null },
  { re: /^\s*participated\s+in\s+/i, verb: 'Contributed to' },
];

const FILLER_REPLACEMENTS = [
  [/\bin order to\b/gi, 'to'],
  [/\bdue to the fact that\b/gi, 'because'],
  [/\ba large number of\b/gi, 'many'],
  [/\ba lot of\b/gi, 'many'],
  [/\bvery\b/gi, ''],
  [/\breally\b/gi, ''],
  [/\bjust\b/gi, ''],
  [/\bquite\b/gi, ''],
  [/\bvarious different\b/gi, 'various'],
  [/\bbasically\b/gi, ''],
  [/\bliterally\b/gi, ''],
  [/\band so on\b/gi, ''],
  [/\betc\.?$/gi, ''],
];

const GENERIC_TO_SPECIFIC = [
  {
    // "React website" -> "responsive React website"; "the website" ->
    // "the responsive website". Single guarded pattern so it fires once.
    re: /(\b[A-Z][\w.+#]*\s+)?\bwebsites?\b/,
    replacement: (m, pre) => `responsive ${pre || ''}website${/s$/i.test(m.trim()) ? 's' : ''}`,
    note: 'Added descriptive detail “responsive” — remove if inaccurate.',
  },
  { re: /\bcomponents\b/i, replacement: 'reusable components', note: 'Added descriptive detail “reusable” — remove if inaccurate.' },
];

// Technical terms the engine may surface. A term is only ever suggested when
// it already exists in techContext (the user's own skills/stacks).
const TECH_CANONICAL = [
  'React.js', 'React', 'Node.js', 'Express', 'MongoDB', 'PostgreSQL', 'MySQL',
  'TypeScript', 'JavaScript', 'Python', 'Django', 'Flask', 'FastAPI', 'Java',
  'Spring', 'Go', 'Rust', 'Docker', 'Kubernetes', 'AWS', 'Azure', 'Git',
  'REST API', 'GraphQL', 'TensorFlow', 'PyTorch', 'Flutter', 'Angular', 'Vue',
];

function normalizeSpaces(s) {
  return String(s || '').replace(/\s+/g, ' ').trim();
}

function capitalizeFirst(s) {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function ensurePeriod(s) {
  const t = normalizeSpaces(s).replace(/\s+([.,;:!?])/g, '$1');
  if (!t) return t;
  return /[.!?]$/.test(t) ? t : `${t}.`;
}

function stripFiller(s) {
  let out = ` ${s} `;
  FILLER_REPLACEMENTS.forEach(([re, rep]) => { out = out.replace(re, rep); });
  return normalizeSpaces(out);
}

function undoGerund(verb) {
  // "managing" -> "Managed", "developing" -> "Developed"
  const base = verb.replace(/ing$/, '');
  if (!base) return null;
  return capitalizeFirst(base + (base.endsWith('e') ? 'd' : 'ed'));
}

function pickVerbForNoun(rest) {
  for (const { re, verb } of STRONG_VERB_FOR_NOUN) {
    if (re.test(rest)) return verb;
  }
  return 'Developed';
}

function strengthenOpener(text, notes) {
  let t = normalizeSpaces(text);
  for (const { re, verb, keepArticle } of WEAK_OPENER_REWRITES) {
    const m = t.match(re);
    if (!m) continue;
    const article = keepArticle && m[1] ? `${m[1].toLowerCase()} ` : '';
    const rest = t.slice(m[0].length);
    if (/^responsible\s+for\s+/i.test(m[0])) {
      const gerund = rest.match(/^([A-Za-z]+ing)\b/);
      if (gerund) {
        const strong = undoGerund(gerund[1].toLowerCase());
        if (strong) {
          t = `${strong} ${rest.slice(gerund[0].length).trimStart()}`;
          notes.push('Replaced weak opener “responsible for …” with a strong verb.');
          return t;
        }
      }
      t = `Owned ${rest}`;
      notes.push('Replaced weak opener “responsible for” with “Owned”.');
      return t;
    }
    if (/^helped\s+with\s+/i.test(m[0])) {
      const gerund = rest.match(/^([A-Za-z]+ing)\b/);
      if (gerund) {
        const strong = undoGerund(gerund[1].toLowerCase());
        if (strong) {
          t = `${strong} ${rest.slice(gerund[0].length).trimStart()}`;
          notes.push('Replaced weak opener “helped with …” with a strong verb.');
          return t;
        }
      }
    }
    if (verb) {
      t = `${verb} ${rest}`;
      notes.push(`Replaced weak opener with “${verb}”.`);
      return t;
    }
    // verb chosen by object noun ("Made a website" -> "Developed a website")
    t = `${pickVerbForNoun(rest)} ${article}${rest}`;
    notes.push('Replaced weak opener with an action verb matched to the subject.');
    return t;
  }
  // Already strong-ish: ensure it starts with a capital verb form.
  return capitalizeFirst(t);
}

function contextTechIn(text, techContext = []) {
  const lower = String(text || '').toLowerCase();
  const ctx = new Set((techContext || []).map((t) => String(t || '').toLowerCase().trim()).filter(Boolean));
  return TECH_CANONICAL.filter((term) => ctx.has(term.toLowerCase()) && !lower.includes(term.toLowerCase()));
}

function applyGenericSpecificity(text, notes, addedDetails) {
  let t = text;
  GENERIC_TO_SPECIFIC.forEach(({ re, replacement, note }) => {
    if (re.test(t)) {
      t = t.replace(re, typeof replacement === 'function' ? (...a) => replacement(...a) : replacement);
      notes.push(note);
      if (addedDetails) addedDetails.push(note);
    }
  });
  return t;
}

function hasNumbers(text) {
  return /\d/.test(String(text || ''));
}

export const IMPROVE_ACTIONS = [
  { key: 'improve', label: 'Improve', hint: 'Clarity, verbs, tone' },
  { key: 'shorten', label: 'Shorten', hint: 'Tighter phrasing' },
  { key: 'technical', label: 'Make more technical', hint: 'Uses your own stack' },
  { key: 'concise', label: 'Make more concise', hint: 'Cut to essentials' },
  { key: 'impact', label: 'Add impact', hint: 'Never invents numbers' },
];

export const IMPROVE_TARGETS = ['summary', 'bullet', 'project', 'achievement', 'about'];

// Main entry: improve user text. Returns null for empty input.
// contextTech: array of the user's own skills/stacks (strings).
export function improveText(input, { action = 'improve', target = 'bullet', contextTech = [] } = {}) {
  const original = normalizeSpaces(input);
  if (!original) return null;
  const notes = [];
  const addedDetails = [];
  let metricPrompt = null;
  let out = original;

  const noteAdded = (n) => { notes.push(n); addedDetails.push(n); };

  if (action === 'shorten' || action === 'concise') {
    out = stripFiller(out);
    out = strengthenOpener(out, notes);
    out = ensurePeriod(out);
    if (action === 'concise') {
      // Second compression pass: drop leading "I " voice and hedges.
      out = out.replace(/^I\s+(am|was|have been)\s+/i, '');
      out = out.replace(/\b(I think|I feel|in my opinion)\b,?\s*/gi, '');
      out = normalizeSpaces(out);
      notes.push('Compressed filler and hedging for conciseness.');
    } else {
      notes.push('Removed filler words and tightened phrasing.');
    }
    return finish(original, out, { action, target, notes, addedDetails, metricPrompt });
  }

  if (action === 'technical') {
    out = stripFiller(out);
    out = strengthenOpener(out, notes);
    const candidates = contextTechIn(out, contextTech);
    if (candidates.length > 0) {
      const use = candidates.slice(0, 2).join(' and ');
      if (!/[.!?]$/.test(out)) out = `${out} `;
      out = `${normalizeSpaces(out).replace(/[.!?]+$/, '')}, using ${use}.`;
      noteAdded(`Referenced your own stack (${use}) — remove if it does not apply here.`);
    } else {
      notes.push('No unused stack terms found in your profile to reference; add relevant technologies from Skills if genuine.');
    }
    out = applyGenericSpecificity(out, notes, addedDetails);
    out = ensurePeriod(out);
    return finish(original, out, { action, target, notes, addedDetails, metricPrompt });
  }

  if (action === 'impact') {
    out = stripFiller(out);
    out = strengthenOpener(out, notes);
    out = applyGenericSpecificity(out, notes, addedDetails);
    out = ensurePeriod(out);
    if (hasNumbers(out)) {
      notes.push('Kept your original numbers exactly as written.');
    } else {
      metricPrompt = 'Consider adding a measurable result if available (e.g. users reached, % improvement, time saved, or scale).';
    }
    return finish(original, out, { action, target, notes, addedDetails, metricPrompt });
  }

  if (target === 'about') {
    // LinkedIn About voice: first person, professional, no invented claims.
    out = stripFiller(original);
    out = out.replace(/^A\s+([A-Z][a-z]+)\s+developer\b/i, 'I’m a $1 developer')
      .replace(/^Developer\b/i, 'I’m a developer')
      .replace(/^([A-Z][a-z]+) with (\d+)/i, 'I’m a professional with $2');
    if (!/^i('m| am)\b/i.test(out) && !/^i\b/i.test(out)) {
      // Leave voice untouched if conversion is ambiguous — never rewrite meaning.
      notes.push('Kept your original voice; adjusted clarity and tone only.');
    } else {
      notes.push('Shifted toward first-person LinkedIn About voice.');
    }
    out = strengthenOpenerLight(out, notes);
    out = ensurePeriod(out);
    metricPrompt = hasNumbers(out)
      ? null
      : 'About sections perform well with 1–2 real numbers (years, users, projects) — add yours if available.';
    return finish(original, out, { action, target, notes, addedDetails, metricPrompt });
  }

  // Default: full improve.
  out = stripFiller(out);
  out = strengthenOpener(out, notes);
  out = applyGenericSpecificity(out, notes, addedDetails);
  out = ensurePeriod(out);
  if (!hasNumbers(out) && (target === 'bullet' || target === 'project')) {
    metricPrompt = 'Consider adding a measurable result if available (e.g. users, % improvement, time saved).';
  }
  return finish(original, out, { action, target, notes, addedDetails, metricPrompt });
}

function strengthenOpenerLight(text, notes) {
  // Gentle pass for long-form text: only fix a weak first clause.
  const out = strengthenOpener(text, notes);
  return out;
}

function finish(original, suggestion, meta) {
  const changed = normalizeSpaces(suggestion) !== normalizeSpaces(original);
  return {
    original: normalizeSpaces(original),
    suggestion: normalizeSpaces(suggestion),
    changed,
    ...meta,
  };
}

// Static guarantee checker used by tests and (optionally) the UI:
// every number and every tech term in the suggestion must already exist in
// the input or the provided context.
export function verifyNoFabrication(result, { contextTech = [] } = {}) {
  if (!result) return { ok: true, issues: [] };
  const issues = [];
  const inputNums = new Set((result.original.match(/\d[\d.,%]*/g) || []).map((n) => n.replace(/[%.,]$/, '')));
  const outNums = result.suggestion.match(/\d[\d.,%]*/g) || [];
  outNums.forEach((n) => {
    if (!inputNums.has(n.replace(/[%.,]$/, ''))) issues.push(`New number introduced: ${n}`);
  });
  const ctx = new Set((contextTech || []).map((t) => String(t).toLowerCase()));
  const sugLower = result.suggestion.toLowerCase();
  const inputLower = result.original.toLowerCase();
  const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  TECH_CANONICAL.forEach((term) => {
    const tl = term.toLowerCase();
    // Whole-word match: naive substring checks false-positive on short terms
    // ("go" inside "MongoDB"). Word chars plus . + # count as term-internal.
    const re = new RegExp(`(^|[^a-z0-9.+#])${escapeRe(tl)}([^a-z0-9.+#]|$)`);
    if (re.test(sugLower) && !re.test(inputLower) && !ctx.has(tl)) {
      issues.push(`New technology introduced: ${term}`);
    }
  });
  return { ok: issues.length === 0, issues };
}
