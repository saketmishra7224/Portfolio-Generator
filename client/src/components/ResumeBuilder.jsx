import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  FaSave, FaExclamationTriangle, FaCheckCircle, FaChevronUp, FaChevronDown,
  FaEye, FaEdit, FaLightbulb, FaArrowLeft, FaFileAlt, FaMagic
} from 'react-icons/fa';
import SectionEditor from './resume/SectionEditor';
import SkillCategoryEditor from './resume/SkillCategoryEditor';
import SectionToggles from './resume/SectionToggles';
import ImproveDialog from './assistant/ImproveDialog';
import { ResumeHeader, renderDocSections } from './templates/shared/ResumeBlocks';
import { THEME_ATS } from './templates/themes';
import { buildAtsDocument } from '../utils/atsDocument';
import {
  normalizeProfile, prepareForSave, useAutosave, displaySkills, displayEducations,
  orderedSections, resumeCompleteness, contentWarnings,
  analyzeBullet, bulletSuggestion, flattenCategories, BUILDER_SECTIONS,
  CANONICAL_SECTION_ORDER, moveItem, isValidUrl
} from '../utils/resumeModel';
import { ToastStack, createToast } from './ui/Feedback';

const draftKey = (email) => `resume-draft:${(email || 'anon').toLowerCase()}`;
const isEssentiallyEmpty = (d) => (
  !d?.personalInfo?.name && (displayEducations(d).length === 0)
  && (d?.experiences || []).length === 0 && (d?.projects || []).length === 0
  && displaySkills(d).length === 0
);

function CharHint({ value = '', recommended = [300, 600], label = 'Characters' }) {
  const len = String(value || '').length;
  const [lo, hi] = recommended;
  const inRange = len >= lo && len <= hi;
  return (
    <p className="ds-helper" role="status" style={{ color: len === 0 ? undefined : inRange ? 'var(--ds-success)' : 'var(--ds-warning)' }}>
      {label}: {len}{recommended ? ` (recommended roughly ${lo}–${hi})` : ''} — guidance only, never enforced.
    </p>
  );
}

function WritingTips({ items = [], bulletKey = 'bullets', maxShow = 4, onImprove }) {
  const tips = useMemo(() => {
    const out = [];
    (items || []).forEach((entry, ei) => {
      (entry[bulletKey] || []).forEach((b, bi) => {
        if (!b || !String(b).trim()) return;
        const analysis = analyzeBullet(b);
        if (analysis && !analysis.strong) {
          out.push({ ei, bi, where: `Entry ${ei + 1}, bullet ${bi + 1}`, text: b, findings: analysis.findings });
        }
      });
    });
    return out.slice(0, maxShow);
  }, [items, bulletKey, maxShow]);

  if (tips.length === 0) return null;
  return (
    <div className="ds-alert ds-alert-warning" style={{ marginTop: 10 }}>
      <FaLightbulb aria-hidden="true" />
      <div>
        <strong>Writing suggestions ({tips.length})</strong>
        <ul style={{ margin: '6px 0 0 18px', display: 'grid', gap: 8 }}>
          {tips.map((t, i) => (
            <li key={i}>
              <div className="ds-helper">“{t.text}” <span style={{ opacity: 0.8 }}>({t.where})</span></div>
              <ul style={{ margin: '2px 0 0 16px', display: 'grid', gap: 2 }}>
                {t.findings.map((f, fi) => <li key={fi} style={{ fontSize: '0.82rem' }}><strong>{f.label}:</strong> {f.tip}</li>)}
              </ul>
              <div className="ds-helper" style={{ marginTop: 2 }}>{bulletSuggestion(t.text)}</div>
              {onImprove && (
                <button
                  type="button" className="ds-btn ds-btn-secondary ds-btn-sm" style={{ marginTop: 4 }}
                  onClick={() => onImprove(t.ei, t.bi, t.text)}
                >
                  <FaMagic aria-hidden="true" /> Improve this bullet
                </button>
              )}
            </li>
          ))}
        </ul>
        <p className="ds-helper" style={{ marginTop: 6 }}>Weak example: “Worked on a website.” Stronger: “Developed a responsive React.js website that reduced page load time by 30%.” Always use metrics you actually achieved — never invent numbers.</p>
      </div>
    </div>
  );
}

// Live preview reuses the exact shared blocks + ATS skin as the ATS
// template, so what users see while editing is what the audit scores.
function BuilderPreview({ data }) {
  const doc = buildAtsDocument(data, { dateStyle: 'short' });
  return (
    <div className={THEME_ATS.root} aria-label="Live resume preview">
      <ResumeHeader doc={doc} T={THEME_ATS} />
      {renderDocSections(doc, THEME_ATS)}
    </div>
  );
}

const sectionHasContent = (data, id) => {
  switch (id) {
    case 'personal': return !!(data.personalInfo?.name && data.personalInfo?.email);
    case 'summary': return !!(data.personalInfo?.bio || data.personalInfo?.headline);
    case 'experience': return (data.experiences || []).length > 0;
    case 'education': return displayEducations(data).length > 0;
    case 'projects': return (data.projects || []).length > 0;
    case 'skills': return displaySkills(data).length > 0;
    case 'certifications': return (data.certifications || []).length > 0;
    case 'achievements': return (data.achievements || []).length > 0;
    case 'leadership': return (data.leadership || []).length > 0;
    case 'additional': return (data.languages || []).length + (data.publications || []).length + (data.volunteering || []).length > 0;
    default: return false;
  }
};

const ResumeBuilder = ({ formData, onChange, onSave, onExit, onPreview }) => {
  const [data, setData] = useState(() => normalizeProfile(formData));
  const [activeSection, setActiveSection] = useState('personal');
  const [mobileView, setMobileView] = useState('editor');
  const [hasEdited, setHasEdited] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [piErrors, setPiErrors] = useState({});
  const userEditingRef = useRef(false);
  const onChangeRef = useRef(onChange);
  const onSaveRef = useRef(onSave);
  onChangeRef.current = onChange;
  onSaveRef.current = onSave;

  // Draft persistence: restore a browser draft only when the server profile is
  // essentially empty (never overwrite real data with a stale draft).
  useEffect(() => {
    const email = formData?.personalInfo?.email || '';
    try {
      const raw = localStorage.getItem(draftKey(email));
      if (raw && isEssentiallyEmpty(normalizeProfile(formData))) {
        const draft = JSON.parse(raw);
        if (draft && !isEssentiallyEmpty(draft)) {
          const normalized = normalizeProfile(draft);
          setData(normalized);
          userEditingRef.current = true;
          setHasEdited(true);
          createToast(setToasts, 'Restored your unsaved draft from this browser.', { tone: 'info', title: 'Draft restored' });
          return;
        }
      }
    } catch { /* corrupted draft — ignore */ }
    if (!userEditingRef.current) setData(normalizeProfile(formData));
  }, []);

  const update = (patch) => {
    userEditingRef.current = true;
    setHasEdited(true);
    setData((prev) => ({ ...prev, ...patch }));
  };
  const setSection = (key, value) => update({ [key]: value });
  const setPersonal = (field, value) => {
    update({ personalInfo: { ...data.personalInfo, [field]: value } });
    if (['website', 'linkedin'].includes(field)) {
      setPiErrors((p) => ({ ...p, [field]: value && !isValidUrl(value) ? 'Must be a valid http(s) URL' : null }));
    }
  };

  // Lift edits + autosave (debounced, never on mount).
  useEffect(() => {
    if (userEditingRef.current && onChangeRef.current) onChangeRef.current(data);
  }, [data]);

  const autosave = useAutosave(data,
    async (v) => {
      const payload = prepareForSave(v);
      await onSaveRef.current(payload);
      try { localStorage.setItem(draftKey(v.personalInfo?.email || ''), JSON.stringify(payload)); } catch { /* quota — ignore */ }
    },
    { delay: 1500, enabled: hasEdited }
  );

  const progress = useMemo(() => resumeCompleteness(data), [data]);
  const warnings = useMemo(() => contentWarnings(data), [data]);
  const order = orderedSections(data);

  // Tech context for the assistant: only terms already on the resume.
  const techContext = useMemo(() => {
    const fromCats = flattenCategories(data.skillCategories || {});
    const fromExp = (data.experiences || []).flatMap((x) => x.technologies || []);
    const fromProj = (data.projects || []).flatMap((p) => (
      Array.isArray(p.technologies) ? p.technologies : String(p.technologies || '').split(',').map((t) => t.trim())
    ));
    return [...new Set([...fromCats, ...fromExp, ...fromProj].map((t) => String(t || '').trim()).filter(Boolean))];
  }, [data]);

  // Improve dialog state; apply() writes the approved suggestion back.
  const [improve, setImprove] = useState(null);
  const openImprove = (label, value, target, apply) => setImprove({ label, value, target, apply });
  const improveBullet = (sectionKey, ei, bi, text) => {
    openImprove(`Bullet (entry ${ei + 1})`, text, 'bullet', (nv) => {
      update({
        [sectionKey]: (data[sectionKey] || []).map((entry, xi) => (
          xi === ei
            ? { ...entry, bullets: (entry.bullets || []).map((b, xbi) => (xbi === bi ? nv : b)) }
            : entry
        )),
      });
    });
  };

  const moveSection = (dir) => {
    const i = order.indexOf(activeSection);
    if (i < 0) return;
    update({ sectionOrder: moveItem(order, i, i + dir) });
  };
  const orderIndex = order.indexOf(activeSection);

  // Keyboard: Ctrl/Cmd+S saves now; Escape returns to editor on mobile preview.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        autosave.flush();
        createToast(setToasts, 'Save requested — changes sync now.', { tone: 'info', title: 'Saving' });
      }
      if (e.key === 'Escape' && mobileView === 'preview') setMobileView('editor');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [autosave, mobileView]);

  const saveState = !hasEdited ? 'Saved' : autosave.saving ? 'Saving…' : autosave.error ? 'Unable to save' : autosave.lastSaved ? 'Saved' : 'Unsaved changes';

  const editorFor = (id) => {
    switch (id) {
      case 'personal': {
        const pi = data.personalInfo || {};
        const field = (name, label, type = 'text', placeholder) => (
          <div key={name}>
            <label className="ds-label" htmlFor={`rb-${name}`}>{label}</label>
            <input id={`rb-${name}`} className="ds-input" type={type} value={pi[name] || ''} maxLength={name === 'headline' ? 160 : 500}
              onChange={(e) => setPersonal(name, e.target.value)} placeholder={placeholder}
              aria-invalid={piErrors[name] ? 'true' : 'false'} style={{ marginTop: 4 }} />
            {piErrors[name] && <p role="alert" className="ds-field-error">{piErrors[name]}</p>}
          </div>
        );
        return (
          <div className="ds-stack">
            {field('name', 'Full name', 'text', 'Jane Cooper')}
            {field('headline', 'Professional headline', 'text', 'Full-Stack Developer | React + Node')}
            {field('email', 'Email', 'email', 'you@example.com')}
            {field('phone', 'Phone', 'tel', '+91 98765 43210')}
            {field('location', 'Location', 'text', 'Bengaluru, India')}
            {field('website', 'Website', 'url', 'https://…')}
            {field('linkedin', 'LinkedIn', 'url', 'https://linkedin.com/in/…')}
            <div>
              <label className="ds-label" htmlFor="rb-github">GitHub</label>
              <input id="rb-github" className="ds-input" type="url" value={data.socialLinks?.github || ''}
                onChange={(e) => update({ socialLinks: { ...(data.socialLinks || {}), github: e.target.value } })}
                placeholder="https://github.com/…" style={{ marginTop: 4 }} />
            </div>
          </div>
        );
      }
      case 'summary':
        return (
          <div className="ds-stack">
            <div>
              <div className="ds-row" style={{ justifyContent: 'space-between' }}>
                <label className="ds-label" htmlFor="rb-bio">Professional summary</label>
                <span className="ds-row" style={{ gap: 6 }}>
                  {String(data.personalInfo?.bio || '').trim() && (
                    <>
                      <button
                        type="button" className="ds-btn ds-btn-ghost ds-btn-sm"
                        onClick={() => openImprove('Professional summary', data.personalInfo.bio, 'summary', (nv) => setPersonal('bio', nv))}
                        title="Improve with assistant (asks before applying)"
                      >
                        <FaMagic aria-hidden="true" /> Improve
                      </button>
                      <button
                        type="button" className="ds-btn ds-btn-ghost ds-btn-sm"
                        onClick={() => openImprove('LinkedIn About text', data.personalInfo.bio, 'about', (nv) => setPersonal('bio', nv))}
                        title="Rewrite in first-person LinkedIn About voice"
                      >
                        <FaMagic aria-hidden="true" /> LinkedIn About
                      </button>
                    </>
                  )}
                </span>
              </div>
              <textarea id="rb-bio" className="ds-textarea" rows={6} maxLength={2000} value={data.personalInfo?.bio || ''}
                onChange={(e) => setPersonal('bio', e.target.value)}
                placeholder="2–4 sentences: years of experience, strongest skills, what you are looking for…" style={{ marginTop: 4 }} />
              <CharHint value={data.personalInfo?.bio} recommended={[300, 600]} label="Summary length" />
            </div>
            <div>
              <label className="ds-label" htmlFor="rb-tagline">Tagline (short alternative)</label>
              <input id="rb-tagline" className="ds-input" value={data.personalInfo?.tagline || ''} maxLength={160}
                onChange={(e) => setPersonal('tagline', e.target.value)} placeholder="React developer who loves clean UIs" style={{ marginTop: 4 }} />
            </div>
            <p className="ds-helper">Good summaries name your experience, 2–3 core skills, and the kind of role you want. No buzzword stuffing.</p>
          </div>
        );
      case 'experience':
        return (
          <div>
            <SectionEditor section="experiences" items={data.experiences || []} onChange={(v) => setSection('experiences', v)} techContext={techContext} />
            <WritingTips items={data.experiences} onImprove={(ei, bi, text) => improveBullet('experiences', ei, bi, text)} />
            <p className="ds-helper" style={{ marginTop: 8 }}>Bullets work best at roughly 80–200 characters: strong verb + what you built + measurable result.</p>
          </div>
        );
      case 'education':
        return (
          <div>
            <p className="ds-helper" style={{ marginBottom: 8 }}>The first entry doubles as your primary education in portfolio templates.</p>
            <SectionEditor section="educations" items={data.educations || []} onChange={(v) => setSection('educations', v)} techContext={techContext} />
          </div>
        );
      case 'projects':
        return (
          <div>
            <SectionEditor section="projects" items={data.projects || []} onChange={(v) => setSection('projects', v)} techContext={techContext} />
            <WritingTips items={data.projects} onImprove={(ei, bi, text) => improveBullet('projects', ei, bi, text)} />
            <p className="ds-helper" style={{ marginTop: 8 }}>Describe the problem, your role, stack, and at least one outcome with numbers you actually measured.</p>
          </div>
        );
      case 'skills':
        return (
          <div>
            <SkillCategoryEditor value={data.skillCategories || {}} onChange={(v) => setSection('skillCategories', v)} />
            <p className="ds-helper" style={{ marginTop: 8 }}>List skills you can defend in an interview. Duplicates across categories merge automatically on save.</p>
          </div>
        );
      case 'certifications':
        return <SectionEditor section="certifications" items={data.certifications || []} onChange={(v) => setSection('certifications', v)} techContext={techContext} />;
      case 'achievements':
        return <SectionEditor section="achievements" items={data.achievements || []} onChange={(v) => setSection('achievements', v)} techContext={techContext} />;
      case 'leadership':
        return (
          <div>
            <SectionEditor section="leadership" items={data.leadership || []} onChange={(v) => setSection('leadership', v)} techContext={techContext} />
            <p className="ds-helper" style={{ marginTop: 8 }}>Clubs led, teams mentored, events organized — with the outcome for each.</p>
          </div>
        );
      case 'additional':
        return (
          <div className="ds-stack" style={{ gap: 20 }}>
            <div>
              <h3 className="ds-h3">Section visibility</h3>
              <p className="ds-helper" style={{ marginBottom: 8 }}>Hide optional sections from preview and PDF without deleting them.</p>
              <SectionToggles value={data.sectionsEnabled || {}} onChange={(v) => setSection('sectionsEnabled', v)} />
            </div>
            {[
              { key: 'languages', title: 'Languages' },
              { key: 'publications', title: 'Publications' },
              { key: 'volunteering', title: 'Volunteering' },
            ].map(({ key, title }) => (
              <div key={key}>
                <h3 className="ds-h3" style={{ marginBottom: 8 }}>{title}</h3>
                <SectionEditor section={key} items={data[key] || []} onChange={(v) => setSection(key, v)} techContext={techContext} />
              </div>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  const activeDef = BUILDER_SECTIONS.find((s) => s.id === activeSection);
  const reorderable = CANONICAL_SECTION_ORDER.includes(activeSection);

  return (
    <div className="ds-page">
      <ToastStack toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((x) => x.id !== id))} />
      {/* Top bar */}
      <div className="rb-topbar">
        <button className="ds-btn ds-btn-ghost ds-btn-sm" onClick={onExit} aria-label="Back to dashboard">
          <FaArrowLeft aria-hidden="true" /> Dashboard
        </button>
        <div className="ds-row" style={{ gap: 10 }}>
          <span className={`ds-badge ${saveState === 'Saved' ? 'ds-badge-success' : saveState === 'Saving…' ? 'ds-badge-primary' : saveState === 'Unable to save' ? 'ds-badge-error' : ''}`} role="status" aria-live="polite" title={autosave.error ? String(autosave.error?.response?.data?.message || autosave.error?.message || 'Save failed') : saveState}>
            <FaSave aria-hidden="true" /> {saveState}
          </span>
          <button className="ds-btn ds-btn-secondary ds-btn-sm" onClick={() => { autosave.flush(); }} disabled={autosave.saving}>
            Save now
          </button>
          {onPreview && <button className="ds-btn ds-btn-primary ds-btn-sm" onClick={onPreview}><FaFileAlt aria-hidden="true" /> Preview PDF</button>}
        </div>
      </div>

      {/* Mobile editor/preview toggle */}
      <div className="rb-mobile-toggle" role="tablist" aria-label="Editor or preview">
        <button role="tab" aria-selected={mobileView === 'editor'} className={`ds-btn ds-btn-sm ${mobileView === 'editor' ? 'ds-btn-primary' : 'ds-btn-secondary'}`} onClick={() => setMobileView('editor')}>
          <FaEdit aria-hidden="true" /> Editor
        </button>
        <button role="tab" aria-selected={mobileView === 'preview'} className={`ds-btn ds-btn-sm ${mobileView === 'preview' ? 'ds-btn-primary' : 'ds-btn-secondary'}`} onClick={() => setMobileView('preview')}>
          <FaEye aria-hidden="true" /> Preview
        </button>
      </div>

      <div className={`rb-layout ${mobileView === 'preview' ? 'rb-show-preview' : 'rb-show-editor'}`}>
        {/* Left sidebar */}
        <aside className="rb-side" aria-label="Resume sections">
          <div className="ds-card ds-card-pad" style={{ marginBottom: 10 }}>
            <div className="ds-row" style={{ justifyContent: 'space-between' }}>
              <strong>Completeness</strong>
              <span className="ds-badge ds-badge-primary">{progress.score}%</span>
            </div>
            <div className="ds-progress" role="progressbar" aria-valuenow={progress.score} aria-valuemin={0} aria-valuemax={100} aria-label="Resume completeness" style={{ margin: '8px 0' }}>
              <span style={{ width: `${progress.score}%` }} />
            </div>
            {progress.missing.length > 0 ? (
              <ul className="ds-muted" style={{ margin: '4px 0 0 18px', display: 'grid', gap: 3, fontSize: '0.82rem' }}>
                {progress.missing.slice(0, 4).map((m) => <li key={m}>{m}</li>)}
              </ul>
            ) : (
              <p className="ds-helper"><FaCheckCircle color="#16a34a" aria-hidden="true" /> All important sections complete.</p>
            )}
            {warnings.length > 0 && (
              <div className="ds-alert ds-alert-warning" role="status" style={{ marginTop: 8, fontSize: '0.8rem' }}>
                <FaExclamationTriangle aria-hidden="true" />
                <ul style={{ margin: 0, paddingLeft: 16, display: 'grid', gap: 2 }}>
                  {warnings.slice(0, 3).map((w, i) => <li key={i}>{w}</li>)}
                </ul>
              </div>
            )}
          </div>

          <nav aria-label="Sections" style={{ display: 'grid', gap: 4 }}>
            {BUILDER_SECTIONS.map((s) => {
              const done = sectionHasContent(data, s.id);
              const current = activeSection === s.id;
              const countKey = { experience: 'experiences', education: 'educations', projects: 'projects', skills: null, certifications: 'certifications', achievements: 'achievements', leadership: 'leadership' }[s.id];
              const count = countKey ? (data[countKey] || []).length : (s.id === 'skills' ? displaySkills(data).length : 0);
              return (
                <button
                  key={s.id}
                  className="ds-side-link"
                  aria-current={current ? 'page' : undefined}
                  onClick={() => { setActiveSection(s.id); setMobileView('editor'); }}
                  title={s.hint}
                >
                  <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: '50%', background: done ? 'var(--ds-success)' : 'var(--ds-border-strong)', flexShrink: 0 }} />
                  <span style={{ flex: 1 }}>{s.label}</span>
                  {count > 0 && <span className="ds-helper">{count}</span>}
                </button>
              );
            })}
          </nav>

          <div className="ds-card ds-card-pad" style={{ marginTop: 10 }}>
            <strong style={{ fontSize: '0.85rem' }}>Section order</strong>
            <p className="ds-helper" style={{ margin: '2px 0 6px' }}>Controls the live preview order.</p>
            <ol style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 2, fontSize: '0.82rem' }} aria-label="Current section order">
              {order.map((k) => <li key={k} style={{ textTransform: 'capitalize' }}>{k}</li>)}
            </ol>
          </div>
        </aside>

        {/* Center editor */}
        <section className="rb-editor" aria-label={`${activeDef?.label} editor`}>
          <div className="ds-card ds-card-pad">
            <div className="ds-row" style={{ justifyContent: 'space-between', flexWrap: 'wrap', marginBottom: 4 }}>
              <div>
                <h2 className="ds-h1" style={{ fontSize: '1.3rem', margin: 0 }}>{activeDef?.label}</h2>
                <p className="ds-muted">{activeDef?.hint}</p>
              </div>
              {reorderable && (
                <div className="ds-row" role="group" aria-label={`Reorder ${activeDef?.label} section`}>
                  <button className="ds-btn ds-btn-ghost ds-btn-sm" disabled={orderIndex <= 0}
                    onClick={() => moveSection(-1)} aria-label={`Move ${activeDef?.label} section up`}>
                    <FaChevronUp aria-hidden="true" /> Move up
                  </button>
                  <button className="ds-btn ds-btn-ghost ds-btn-sm" disabled={orderIndex < 0 || orderIndex >= order.length - 1}
                    onClick={() => moveSection(1)} aria-label={`Move ${activeDef?.label} section down`}>
                    <FaChevronDown aria-hidden="true" /> Move down
                  </button>
                </div>
              )}
            </div>
            <hr className="ds-divider" />
            {editorFor(activeSection)}
          </div>
          <p className="ds-helper" style={{ marginTop: 8 }}>Tip: press <kbd className="ds-kbd">Ctrl</kbd> + <kbd className="ds-kbd">S</kbd> to save now. Everything also autosaves.</p>
        </section>

        {/* Right live preview */}
        <aside className="rb-preview" aria-label="Live resume preview">
          <div className="ds-card" style={{ overflow: 'hidden', position: 'sticky', top: 76 }}>
            <div style={{ padding: '0.7rem 1rem', borderBottom: '1px solid var(--ds-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: '0.88rem' }}>Live preview</strong>
              <span className="ds-badge ds-badge-success">{progress.score}% complete</span>
            </div>
            <div style={{ padding: '1rem', maxHeight: 'calc(100vh - 220px)', overflowY: 'auto', background: '#fff' }}>
              <BuilderPreview data={data} />
            </div>
          </div>
        </aside>
      </div>

      {improve && (
        <ImproveDialog
          fieldLabel={improve.label}
          original={improve.value}
          target={improve.target}
          contextTech={techContext}
          onClose={() => setImprove(null)}
          onApply={(nv) => { improve.apply(nv); setImprove(null); }}
        />
      )}
    </div>
  );
};

export default ResumeBuilder;
