import React, { useState, useMemo } from 'react';
import {
  FaArrowLeft, FaSearch, FaCheckCircle, FaExclamationTriangle, FaPlus,
  FaEraser, FaFileAlt, FaShieldAlt
} from 'react-icons/fa';
import { parseJD, matchResume } from '../utils/jdMatcher';
import { flattenCategories } from '../utils/resumeModel';
import { profileService } from '../services/api';
import { ToastStack, createToast, ConfirmDialog, EmptyState } from './ui/Feedback';

const SAMPLE_JD = `Frontend Developer (React) — Acme Corp

About the role: You will build responsive web applications used by 200,000 monthly users and improve page load performance.

Required qualifications:
- 2+ years of experience with React and JavaScript
- Strong TypeScript skills and REST API integration experience
- Git version control and code review discipline

Preferred qualifications:
- Node.js and MongoDB exposure
- AWS or Docker experience is a plus
- Excellent communication and collaboration skills`;

const SKILL_CATEGORY_OPTIONS = [
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

const JobMatch = ({ formData, onProfileUpdate, onBack, onOpenAts, saveProfile }) => {
  const persistProfile = saveProfile || ((payload) => profileService.updateProfile(payload));
  const [jd, setJd] = useState('');
  const [toasts, setToasts] = useState([]);
  const [pendingSkill, setPendingSkill] = useState(null); // { term, category, attested, saving }
  const [showReasons, setShowReasons] = useState({});

  const notify = (message, tone = 'info', title) => createToast(setToasts, message, { tone, title });

  const parsed = useMemo(() => (jd.trim().length >= 50 ? parseJD(jd) : null), [jd]);
  const analysis = useMemo(
    () => (parsed ? matchResume(formData, parsed) : null),
    [formData, parsed]
  );

  const startAdd = (term) => setPendingSkill({ term, category: 'other', attested: false, saving: false });

  const confirmAdd = async () => {
    if (!pendingSkill || !pendingSkill.attested || pendingSkill.saving) return;
    const term = pendingSkill.term.trim();
    setPendingSkill((p) => ({ ...p, saving: true }));
    try {
      const cats = { ...(formData.skillCategories || {}) };
      const list = [...(cats[pendingSkill.category] || [])];
      if (!list.some((s) => String(s).toLowerCase() === term.toLowerCase())) list.push(term);
      cats[pendingSkill.category] = list;
      const skills = flattenCategories({ ...Object.fromEntries(SKILL_CATEGORY_OPTIONS.map((c) => [c.key, []])), ...cats });
      const payload = { skillCategories: cats, skills };
      await persistProfile(payload);
      if (onProfileUpdate) onProfileUpdate(payload);
      notify(`“${term}” added to Skills (${SKILL_CATEGORY_OPTIONS.find((c) => c.key === pendingSkill.category)?.label}).`, 'success', 'Skill added');
      setPendingSkill(null);
    } catch (err) {
      notify(err.response?.data?.message || 'Could not add the skill. Please try again.', 'error', 'Add failed');
      setPendingSkill((p) => (p ? { ...p, saving: false } : p));
    }
  };

  return (
    <div className="ds-page" style={{ padding: '1.25rem 0 2rem' }}>
      <ToastStack toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((x) => x.id !== id))} />
      <div className="ds-container" style={{ maxWidth: 1200 }}>
        <div className="ds-row" style={{ justifyContent: 'space-between', flexWrap: 'wrap', marginBottom: 12 }}>
          <div>
            <p className="ds-eyebrow">Job match</p>
            <h1 className="ds-h1">Job Description Matcher</h1>
            <p className="ds-muted">Deterministic local analysis — nothing is sent anywhere, nothing is added without your explicit confirmation.</p>
          </div>
          <div className="ds-row" style={{ flexWrap: 'wrap' }}>
            {onBack && <button className="ds-btn ds-btn-secondary ds-btn-sm" onClick={onBack}><FaArrowLeft aria-hidden="true" /> Back</button>}
            {onOpenAts && <button className="ds-btn ds-btn-ghost ds-btn-sm" onClick={onOpenAts}><FaShieldAlt aria-hidden="true" /> Open ATS Checker</button>}
          </div>
        </div>

        <div className="ds-grid-2" style={{ gridTemplateColumns: 'minmax(0, 5fr) minmax(0, 7fr)', alignItems: 'start' }}>
          {/* Left: JD input */}
          <div className="ds-card ds-card-pad">
            <div className="ds-row" style={{ justifyContent: 'space-between' }}>
              <label className="ds-label" htmlFor="jm-jd" style={{ fontSize: '0.95rem' }}>Job description</label>
              <span className="ds-helper" aria-live="polite">{jd.trim().length} chars</span>
            </div>
            <textarea
              id="jm-jd"
              className="ds-textarea"
              rows={18}
              value={jd}
              onChange={(e) => setJd(e.target.value)}
              placeholder="Paste the full job posting here — title, requirements, preferred skills…"
              style={{ marginTop: 6, fontSize: '0.88rem' }}
            />
            <div className="ds-row" style={{ marginTop: 8, flexWrap: 'wrap' }}>
              <button type="button" className="ds-btn ds-btn-secondary ds-btn-sm" onClick={() => setJd(SAMPLE_JD)}>
                <FaFileAlt aria-hidden="true" /> Load sample
              </button>
              <button type="button" className="ds-btn ds-btn-ghost ds-btn-sm" onClick={() => setJd('')} disabled={jd.length === 0}>
                <FaEraser aria-hidden="true" /> Clear
              </button>
            </div>
            {parsed && (
              <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
                <div>
                  <span className="ds-label">Detected title</span>
                  <p className="ds-muted">{parsed.titles.length > 0 ? parsed.titles.join(', ') : 'No standard title detected'}</p>
                </div>
                <div>
                  <span className="ds-label">Required tech ({parsed.requiredTech.length})</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                    {parsed.requiredTech.length === 0 ? <span className="ds-muted">—</span> : parsed.requiredTech.map((t) => <span key={t} className="ds-badge ds-badge-primary">{t}</span>)}
                  </div>
                </div>
                <div>
                  <span className="ds-label">Preferred tech ({parsed.preferredTech.length})</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                    {parsed.preferredTech.length === 0 ? <span className="ds-muted">—</span> : parsed.preferredTech.map((t) => <span key={t} className="ds-badge">{t}</span>)}
                  </div>
                </div>
                <div className="ds-row" style={{ flexWrap: 'wrap', gap: 12 }}>
                  <span className="ds-helper">Soft skills: {parsed.softSkills.length > 0 ? parsed.softSkills.join(', ') : '—'}</span>
                  <span className="ds-helper">{parsed.yearsRequired ? `~${parsed.yearsRequired} yrs asked` : 'No years stated'}</span>
                  <span className="ds-helper">{parsed.hasRequiredSection ? 'Has required section' : 'No explicit required section'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Right: analysis */}
          <div>
            {!analysis ? (
              <EmptyState
                icon={<FaSearch />}
                title="Paste a job description to begin"
                body="Analysis needs ~50 characters. Everything runs locally and deterministically."
                action={null}
              />
            ) : (
              <>
                <div className="ds-card ds-card-pad" style={{ marginBottom: 12 }}>
                  <div className="ds-row" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
                    <div>
                      <p className="ds-eyebrow">Alignment estimate</p>
                      <h2 className="ds-h1" style={{ margin: 0 }}>{analysis.score}<span className="ds-muted" style={{ fontWeight: 400 }}>/100</span></h2>
                    </div>
                    <span className={`ds-badge ${analysis.score >= 75 ? 'ds-badge-success' : analysis.score >= 45 ? 'ds-badge-warning' : 'ds-badge-error'}`}>
                      {analysis.score >= 75 ? 'Strong alignment' : analysis.score >= 45 ? 'Partial alignment' : 'Low alignment'}
                    </span>
                  </div>
                  <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
                    {analysis.breakdown.map((c) => (
                      <div key={c.key}>
                        <div className="ds-row" style={{ justifyContent: 'space-between' }}>
                          <button
                            type="button" className="ds-btn ds-btn-ghost ds-btn-sm"
                            aria-expanded={!!showReasons[c.key]}
                            onClick={() => setShowReasons((p) => ({ ...p, [c.key]: !p[c.key] }))}
                            style={{ paddingLeft: 0 }}
                          >
                            <strong style={{ fontSize: '0.85rem' }}>{c.label}</strong>
                          </button>
                          <span className="ds-helper">{c.points}/{c.maxPoints} pts</span>
                        </div>
                        <div className="ds-progress" role="progressbar" aria-valuenow={c.score} aria-valuemin={0} aria-valuemax={100} aria-label={`${c.label} score`}>
                          <span style={{ width: `${c.score}%` }} />
                        </div>
                        {showReasons[c.key] && (
                          <ul className="ds-muted" style={{ margin: '4px 0 0 18px', fontSize: '0.83rem', display: 'grid', gap: 2 }}>
                            {c.reasons.map((r, i) => <li key={i}>{r}</li>)}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="ds-helper" style={{ marginTop: 8 }}>Estimate from transparent checks (Skills 40 • Tech evidence 25 • Experience 15 • Title 10 • Summary 10). Not a guaranteed ATS score.</p>
                </div>

                <div className="ds-grid-2" style={{ marginBottom: 12 }}>
                  <div className="ds-card ds-card-pad">
                    <h3 className="ds-h3" style={{ color: 'var(--ds-success)' }}><FaCheckCircle aria-hidden="true" /> Matched skills ({analysis.matchedSkills.length})</h3>
                    {analysis.matchedSkills.length === 0
                      ? <p className="ds-muted">None of the JD technologies are in Skills yet.</p>
                      : <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>{analysis.matchedSkills.map((s) => <span key={s} className="ds-badge ds-badge-success">{s}</span>)}</div>}
                    {analysis.matchedTech.length > 0 && (
                      <>
                        <h3 className="ds-h3" style={{ marginTop: 10 }}>Seen in experience/projects</h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>{analysis.matchedTech.filter((t) => !analysis.matchedSkills.includes(t)).map((s) => <span key={s} className="ds-badge">{s}</span>)}</div>
                      </>
                    )}
                  </div>
                  <div className="ds-card ds-card-pad">
                    <h3 className="ds-h3" style={{ color: 'var(--ds-error)' }}><FaExclamationTriangle aria-hidden="true" /> Not currently found ({analysis.missingSkills.length})</h3>
                    <p className="ds-helper">These stay off the resume unless you confirm you have them.</p>
                    {analysis.missingSkills.length === 0
                      ? <p className="ds-muted">No gaps — all JD technologies are already listed.</p>
                      : <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                        {analysis.missingSkills.map((s) => (
                          <span key={s} className="ds-badge ds-badge-error" style={{ gap: 6 }}>
                            {s}
                            <button
                              type="button" onClick={() => startAdd(s)} aria-label={`Add ${s} to resume after confirmation`}
                              title="Add to resume (asks for confirmation)"
                              style={{ background: 'transparent', border: 0, cursor: 'pointer', color: 'inherit', display: 'flex' }}
                            >
                              <FaPlus aria-hidden="true" size={11} />
                            </button>
                          </span>
                        ))}
                      </div>}
                  </div>
                </div>

                {(analysis.relevantExperience.length > 0 || analysis.relevantProjects.length > 0) && (
                  <div className="ds-card ds-card-pad" style={{ marginBottom: 12 }}>
                    <h3 className="ds-h3">Most relevant entries</h3>
                    {analysis.relevantExperience.map((e) => (
                      <p key={`x${e.index}`} className="ds-muted"><strong style={{ color: 'var(--ds-text)' }}>{e.title}</strong> — matches: {e.matchedTerms.join(', ')}</p>
                    ))}
                    {analysis.relevantProjects.map((e) => (
                      <p key={`p${e.index}`} className="ds-muted"><strong style={{ color: 'var(--ds-text)' }}>{e.title}</strong> — matches: {e.matchedTerms.join(', ')}</p>
                    ))}
                  </div>
                )}

                {analysis.suggestedKeywords.length > 0 && (
                  <div className="ds-card ds-card-pad" style={{ marginBottom: 12 }}>
                    <h3 className="ds-h3">Suggested keywords</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                      {analysis.suggestedKeywords.map((k) => <span key={k} className="ds-badge ds-badge-primary">{k}</span>)}
                    </div>
                    <p className="ds-helper" style={{ marginTop: 6 }}>Use only terms that truthfully describe you.</p>
                  </div>
                )}

                {analysis.sectionRecs.length > 0 && (
                  <div className="ds-alert ds-alert-info" role="status">
                    <FaCheckCircle aria-hidden="true" />
                    <div>
                      <strong>Section recommendations</strong>
                      <ul style={{ margin: '6px 0 0 18px', display: 'grid', gap: 4 }}>
                        {analysis.sectionRecs.map((r, i) => <li key={i}><strong>{r.section}:</strong> {r.rec}</li>)}
                      </ul>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {pendingSkill && (
        <ConfirmDialog
          title={`Add “${pendingSkill.term}” to your resume?`}
          body="Nothing is added automatically. This is the only way a missing term reaches your resume — and only with your explicit confirmation."
          confirmLabel="Yes, I have this skill — add it"
          busy={pendingSkill.saving}
          confirmDisabled={!pendingSkill.attested}
          onCancel={() => !pendingSkill.saving && setPendingSkill(null)}
          onConfirm={confirmAdd}
        >
          <div style={{ display: 'grid', gap: 10 }}>
            <div>
              <label className="ds-label" htmlFor="jm-skill-cat">Skill category</label>
              <select
                id="jm-skill-cat"
                className="ds-select"
                value={pendingSkill.category}
                disabled={pendingSkill.saving}
                onChange={(e) => setPendingSkill((p) => ({ ...p, category: e.target.value }))}
                style={{ marginTop: 4 }}
              >
                {SKILL_CATEGORY_OPTIONS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
            </div>
            <label className="ds-row" style={{ gap: 8, cursor: 'pointer', alignItems: 'flex-start' }} htmlFor="jm-attest">
              <input
                id="jm-attest"
                type="checkbox"
                checked={pendingSkill.attested}
                disabled={pendingSkill.saving}
                onChange={(e) => setPendingSkill((p) => ({ ...p, attested: e.target.checked }))}
                style={{ width: 18, height: 18, marginTop: 2, accentColor: 'var(--ds-primary)' }}
              />
              <span className="ds-body" style={{ fontSize: '0.88rem' }}>
                I confirm I currently have this skill through work, study, or personal projects. I understand listing skills I do not have fails interviews and background checks.
              </span>
            </label>
          </div>
        </ConfirmDialog>
      )}
    </div>
  );
};

export default JobMatch;
