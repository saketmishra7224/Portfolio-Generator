import React, { useState, useMemo } from 'react';
import { FaShieldAlt, FaExclamationTriangle, FaCheckCircle, FaDownload, FaInfoCircle } from 'react-icons/fa';
import { auditResume } from '../../utils/atsAudit';

// Reusable ATS audit panel: job-description input, transparent readiness
// estimate with per-category reasons, actionable suggestions and keyword
// alignment (matched / missing / overused). Never claims a guaranteed score.
const AtsPanel = ({ formData, exportSettings, onExportSettingsChange, onDownloadAtsPdf, downloadingPdf }) => {
  const [jobDescription, setJobDescription] = useState('');
  const [showReasons, setShowReasons] = useState({});

  const audit = useMemo(
    () => auditResume(formData, jobDescription),
    [formData, jobDescription]
  );

  const setExport = (patch) => {
    if (onExportSettingsChange) onExportSettingsChange({ ...(exportSettings || {}), ...patch });
  };

  return (
    <div>
      {/* Score header */}
      <div className="ds-row" style={{ justifyContent: 'space-between', flexWrap: 'wrap', marginBottom: 10 }}>
        <div>
          <p className="ds-eyebrow">ATS readiness estimate</p>
          <h2 className="ds-h1" style={{ margin: '2px 0' }}>
            {audit.estimate}<span className="ds-muted" style={{ fontWeight: 400 }}>/100</span>
          </h2>
          <p className="ds-helper" style={{ maxWidth: '34rem' }}>{audit.disclaimer}</p>
        </div>
        <span className={`ds-badge ${audit.estimate >= 80 ? 'ds-badge-success' : audit.estimate >= 50 ? 'ds-badge-warning' : 'ds-badge-error'}`}>
          <FaShieldAlt aria-hidden="true" /> {audit.estimate >= 80 ? 'Strong' : audit.estimate >= 50 ? 'Fair' : 'Needs work'}
        </span>
      </div>

      {/* Category breakdown */}
      <div style={{ display: 'grid', gap: 8, marginBottom: 12 }}>
        {audit.categories.map((c) => (
          <div key={c.key} className="ds-card" style={{ padding: '0.7rem 0.85rem', background: 'var(--ds-surface-2)' }}>
            <div className="ds-row" style={{ justifyContent: 'space-between' }}>
              <strong style={{ fontSize: '0.88rem' }}>{c.label} <span className="ds-helper">(weight {c.weight}%)</span></strong>
              <span className="ds-row" style={{ gap: 8 }}>
                <span className="ds-helper">{c.points}/{c.maxPoints} pts</span>
                <button
                  type="button"
                  className="ds-btn ds-btn-ghost ds-btn-sm"
                  aria-expanded={!!showReasons[c.key]}
                  onClick={() => setShowReasons((p) => ({ ...p, [c.key]: !p[c.key] }))}
                >
                  {showReasons[c.key] ? 'Hide reasons' : 'Why?'}
                </button>
              </span>
            </div>
            <div className="ds-progress" role="progressbar" aria-valuenow={c.score} aria-valuemin={0} aria-valuemax={100} aria-label={`${c.label} score`} style={{ marginTop: 6 }}>
              <span style={{ width: `${c.score}%` }} />
            </div>
            {showReasons[c.key] && (
              <ul className="ds-muted" style={{ margin: '6px 0 0 18px', display: 'grid', gap: 2, fontSize: '0.83rem' }}>
                {c.reasons.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            )}
          </div>
        ))}
      </div>

      {/* Suggestions */}
      {audit.suggestions.length > 0 ? (
        <div className="ds-alert ds-alert-warning" role="status" style={{ marginBottom: 12 }}>
          <FaExclamationTriangle aria-hidden="true" />
          <div>
            <strong>Suggestions ({audit.suggestions.length})</strong>
            <ul style={{ margin: '6px 0 0 18px', display: 'grid', gap: 3 }}>
              {audit.suggestions.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
        </div>
      ) : (
        <div className="ds-alert ds-alert-success" role="status" style={{ marginBottom: 12 }}>
          <FaCheckCircle aria-hidden="true" /><span>No outstanding suggestions. Paste a job description below to check keyword alignment.</span>
        </div>
      )}

      {/* Job description + keywords */}
      <div className="ds-card ds-card-pad" style={{ marginBottom: 12 }}>
        <label className="ds-label" htmlFor="ats-jd">Target job description (optional)</label>
        <textarea
          id="ats-jd"
          className="ds-textarea"
          rows={5}
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Paste the job posting here. Terms are extracted locally and compared against the resume — nothing is uploaded anywhere."
          style={{ marginTop: 4 }}
        />
        <p className="ds-helper" style={{ marginTop: 4 }}>
          <FaInfoCircle aria-hidden="true" /> Keyword comparison is literal text matching. Missing terms are suggestions to add only if you genuinely have those skills.
        </p>
        {audit.keywordsEvaluated ? (
          <div className="ds-grid-3" style={{ marginTop: 10 }}>
            <div>
              <h3 className="ds-h3" style={{ color: 'var(--ds-success)' }}>Matched ({audit.keywords.matched.length})</h3>
              {audit.keywords.matched.length === 0
                ? <p className="ds-muted">None yet.</p>
                : <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>{audit.keywords.matched.map((k) => <span key={k} className="ds-badge ds-badge-success">{k}</span>)}</div>}
            </div>
            <div>
              <h3 className="ds-h3" style={{ color: 'var(--ds-error)' }}>Missing ({audit.keywords.missing.length})</h3>
              {audit.keywords.missing.length === 0
                ? <p className="ds-muted">No major gaps.</p>
                : <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>{audit.keywords.missing.map((k) => <span key={k} className="ds-badge ds-badge-error">{k}</span>)}</div>}
            </div>
            <div>
              <h3 className="ds-h3">Possibly overused ({audit.keywords.overused.length})</h3>
              {audit.keywords.overused.length === 0
                ? <p className="ds-muted">No repetition flags.</p>
                : <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>{audit.keywords.overused.map((k) => <span key={k} className="ds-badge ds-badge-warning">{k}</span>)}</div>}
            </div>
          </div>
        ) : (
          <p className="ds-muted" style={{ marginTop: 8 }}>Keyword alignment activates once the description reaches ~50 characters.</p>
        )}
        <p className="ds-helper" style={{ marginTop: 8 }}>
          Stats: {audit.stats.sections} sections • {audit.stats.skills} skills • {audit.stats.bullets} bullets ({audit.stats.weakBullets} weak, {audit.stats.withMetrics} with numbers).
        </p>
      </div>

      {/* Export settings + download */}
      {exportSettings && (
        <div className="ds-card ds-card-pad">
          <h3 className="ds-h3" style={{ marginBottom: 8 }}>ATS PDF export — selectable text, A4 or US Letter</h3>
          <div className="ds-grid-3">
            <div>
              <label className="ds-label" htmlFor="ats-font">Font</label>
              <select id="ats-font" className="ds-select" value={exportSettings.font || 'helvetica'} onChange={(e) => setExport({ font: e.target.value })} style={{ marginTop: 4 }}>
                <option value="helvetica">Helvetica (sans-serif)</option>
                <option value="times">Times (serif)</option>
              </select>
              <p className="ds-helper" style={{ marginTop: 4 }}>Helvetica renders like Arial; Times like Times New Roman. Both are parser-safe base fonts.</p>
            </div>
            <div>
              <label className="ds-label" htmlFor="ats-page">Page size</label>
              <select id="ats-page" className="ds-select" value={exportSettings.pageSize || 'a4'} onChange={(e) => setExport({ pageSize: e.target.value })} style={{ marginTop: 4 }}>
                <option value="a4">A4 (210 × 297 mm)</option>
                <option value="letter">US Letter (8.5 × 11 in)</option>
              </select>
            </div>
            <div>
              <label className="ds-label" htmlFor="ats-dates">Date format</label>
              <select id="ats-dates" className="ds-select" value={exportSettings.dateStyle || 'short'} onChange={(e) => setExport({ dateStyle: e.target.value })} style={{ marginTop: 4 }}>
                <option value="short">Jan 2025 – May 2025</option>
                <option value="long">January 2025 – May 2025</option>
              </select>
              <p className="ds-helper" style={{ marginTop: 4 }}>One format is applied consistently throughout.</p>
            </div>
          </div>
          <button
            type="button"
            className="ds-btn ds-btn-primary"
            style={{ marginTop: 12 }}
            disabled={downloadingPdf}
            aria-busy={downloadingPdf}
            onClick={onDownloadAtsPdf}
          >
            <FaDownload aria-hidden="true" /> {downloadingPdf ? 'Generating PDF…' : 'Download ATS PDF (selectable text)'}
          </button>
          <p className="ds-helper" style={{ marginTop: 6 }}>
            Parser-safe fonts cover Western text; other scripts are transliterated where possible
            (e.g. ₹ → Rs.) and flagged by the audit above — the on-screen preview always shows your originals.
          </p>
        </div>
      )}
    </div>
  );
};

export default AtsPanel;
