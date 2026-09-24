import React from 'react';
import { SECTION_DEFS } from '../../utils/resumeModel';

// Enable/disable switches for optional resume sections. Core sections
// (education, experience, projects, skills) are always on; the rest can be
// toggled. Templates, preview and ATS respect these flags.
const OPTIONAL = SECTION_DEFS.filter((s) => s.optional);

// Maps section array keys to sectionsEnabled keys (educations->education,
// experiences->experience; everything else is identical).
const enabledKeyFor = (sectionKey) => (
  sectionKey === 'educations' ? 'education' : sectionKey === 'experiences' ? 'experience' : sectionKey
);

const SectionToggles = ({ value = {}, onChange, disabled = false }) => (
  <div style={{ display: 'grid', gap: 8 }}>
    {OPTIONAL.map((s) => {
      const key = enabledKeyFor(s.key);
      const on = value[key] !== false;
      return (
        <label key={s.key} className="ds-row" style={{ justifyContent: 'space-between', cursor: 'pointer', border: '1px solid var(--ds-border)', borderRadius: 10, padding: '0.55rem 0.75rem' }}>
          <span>
            <strong style={{ fontSize: '0.88rem' }}>{s.label}</strong>
            <br />
            <span className="ds-helper">Show in preview, templates and PDF</span>
          </span>
          <input
            type="checkbox"
            role="switch"
            aria-checked={on}
            aria-label={`Show ${s.label} section`}
            checked={on}
            disabled={disabled}
            onChange={(e) => onChange({ ...value, [key]: e.target.checked })}
            style={{ width: 20, height: 20, accentColor: 'var(--ds-primary)' }}
          />
        </label>
      );
    })}
  </div>
);

export default SectionToggles;
