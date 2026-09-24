// ---------------------------------------------------------------------------
// ATS-safe text sanitization (pure, dependency-free).
//
// jsPDF base-14 fonts (Helvetica/Times) can only encode single-byte Western
// text. Verified by round-trip probe (jsPDF -> pypdf extraction):
//   SAFE: ASCII printables + Latin-1 accents (é ñ ü …) + WinAnsi punctuation
//         (– — “ ” ‘ ’ … • ½ ° × ÷ € £ ¥ © ® ™ § ¶ ± µ).
//   BROKEN (scramble extraction): ł ś ć ń ř ţ ğ ş ā č ď ě ― ₹ ← ↑ → ↓ ★ ☆
//         ✓ ✔, and all non-Latin scripts (CJK, Cyrillic, Arabic, Devanagari…).
// Sanitizing before layout keeps every extracted word faithful. Anything the
// map cannot transliterate is removed (never replaced with invented content),
// and findUnmappableChars() lets the audit engine warn about it instead.
// ---------------------------------------------------------------------------

const TRANSLITERATE = {
  'ł': 'l', 'ś': 's', 'ć': 'c', 'ń': 'n', 'ř': 'r', 'ţ': 't', 'ğ': 'g',
  'ş': 's', 'ā': 'a', 'č': 'c', 'ď': 'd', 'ě': 'e', 'ą': 'a', 'ę': 'e',
  'į': 'i', 'ų': 'u', 'ė': 'e', 'š': 's', 'ž': 'z', 'ő': 'o', 'ű': 'u',
  'ð': 'd', 'þ': 'th', 'ı': 'i', 'Ł': 'L', 'Ś': 'S', 'Ć': 'C', 'Ń': 'N',
  'Ř': 'R', 'Ţ': 'T', 'Ğ': 'G', 'Ş': 'S', 'Ā': 'A', 'Č': 'C', 'Ď': 'D',
  'Ě': 'E', 'Ą': 'A', 'Ę': 'E', 'Į': 'I', 'Ų': 'U', 'Ė': 'E', 'Š': 'S',
  'Ž': 'Z', 'Ő': 'O', 'Ű': 'U', 'Ð': 'D', 'Þ': 'Th', 'Ñ': 'N',
  '―': '-', '†': '+', '‡': '++', '‰': '%', '‹': '<', '›': '>',
  '₹': 'Rs.', '←': '<-', '↑': '^', '→': '->', '↓': 'v',
  '★': '*', '☆': '*', '✓': '[OK]', '✔': '[OK]',
};

// Printable ASCII + Latin-1 + WinAnsi punctuation that round-trips cleanly
// (every member verified by jsPDF -> text-extraction probe).
const SAFE_RE = /^[\x20-\x7E\u00A0-\u00FF\u2013\u2014\u2018\u2019\u201C\u201D\u201E\u2022\u2026\u20AC]*$/;

export function sanitizeAtsText(value) {
  const s = String(value || '');
  if (SAFE_RE.test(s)) return s;
  let out = '';
  for (const ch of s) {
    if (SAFE_RE.test(ch)) {
      out += ch;
    } else if (Object.prototype.hasOwnProperty.call(TRANSLITERATE, ch)) {
      out += TRANSLITERATE[ch];
    }
    // else: drop (no safe representation; audit flags it separately)
  }
  return out.replace(/[ \t]{2,}/g, ' ').trim();
}

// Returns distinct characters in the text that cannot be represented in the
// ATS PDF (for audit warnings). Empty array = fully representable.
export function findUnmappableChars(value) {
  const s = String(value || '');
  if (SAFE_RE.test(s)) return [];
  const bad = new Set();
  for (const ch of s) {
    if (!SAFE_RE.test(ch) && !Object.prototype.hasOwnProperty.call(TRANSLITERATE, ch)) {
      bad.add(ch);
    }
  }
  return [...bad];
}
