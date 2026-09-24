// ---------------------------------------------------------------------------
// Per-user activity log (localStorage). Records only real local events —
// profile saves, PDF exports, ATS checks — with timestamps. Used for the
// workspace "Recent activity" and "last updated" displays. No analytics,
// no tracking, no network calls.
// ---------------------------------------------------------------------------

const keyFor = (email) => `resume-activity:${(email || 'anon').toLowerCase()}`;

export const ACTIVITY_TYPES = ['edited', 'exported', 'ats-check'];

export function getActivity(email) {
  try {
    const raw = localStorage.getItem(keyFor(email));
    if (!raw) return { lastEdited: null, lastExported: null, lastAtsCheck: null };
    const parsed = JSON.parse(raw);
    return {
      lastEdited: parsed.lastEdited || null,
      lastExported: parsed.lastExported || null,
      lastAtsCheck: parsed.lastAtsCheck || null,
    };
  } catch {
    return { lastEdited: null, lastExported: null, lastAtsCheck: null };
  }
}

const FIELD_FOR_TYPE = { edited: 'lastEdited', exported: 'lastExported', 'ats-check': 'lastAtsCheck' };

export function logActivity(email, type) {
  const field = FIELD_FOR_TYPE[type];
  if (!field) return;
  try {
    const current = getActivity(email);
    current[field] = new Date().toISOString();
    localStorage.setItem(keyFor(email), JSON.stringify(current));
  } catch {
    // Storage unavailable (private mode, quota) — activity display degrades
    // to "not yet" instead of breaking the app.
  }
}

export function formatRelativeTime(iso) {
  if (!iso) return 'Not yet';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return 'Not yet';
  const diffMs = Date.now() - then;
  if (diffMs < 0) return 'Just now';
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days} days ago`;
  try {
    return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return 'Earlier';
  }
}

export function greetingFor(date = new Date()) {
  const h = date.getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}
