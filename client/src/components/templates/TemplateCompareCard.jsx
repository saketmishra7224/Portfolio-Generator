import React from 'react';
import { FaEye, FaShieldAlt } from 'react-icons/fa';
import './templates.css';

// Explains the core contract of the template engine: visual templates are
// optimized for PRESENTATION, the ATS template for PARSING + job
// applications. Every template renders the same underlying resume data.
const TemplateCompareCard = ({ variant = 'full', onChooseVisual, onChooseAts }) => {
  if (variant === 'slim') {
    return (
      <div className="ds-card ds-card-pad" style={{ marginBottom: 12 }}>
        <div className="ds-row" style={{ flexWrap: 'wrap', gap: 12 }}>
          <span className="ds-badge ds-badge-primary"><FaEye aria-hidden="true" /> Visual: for presentation</span>
          <span className="ds-badge ds-badge-success"><FaShieldAlt aria-hidden="true" /> ATS: for parsing & applications</span>
          <span className="ds-helper">Same resume data — different output. Use ATS mode when applying through job portals.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="ds-card ds-card-pad" style={{ marginBottom: 16 }}>
      <h3 className="ds-h1" style={{ fontSize: '1.15rem', marginBottom: 4 }}>Visual vs ATS: pick the right output</h3>
      <p className="ds-muted" style={{ marginBottom: 12 }}>
        All templates render the <strong>same resume data</strong>. Only the presentation differs —
        use visual templates for humans, the ATS template for machines.
      </p>
      <div className="tpl-compare">
        <div>
          <div className="tpl-mock tpl-mock-visual" role="img" aria-label="Stylized visual resume mock">
            <div className="tpl-mock-head">
              <div className="tpl-mock-line" style={{ width: '45%', height: 10 }} />
              <div className="tpl-mock-line" style={{ width: '70%' }} />
            </div>
            <div className="tpl-mock-body">
              <div className="tpl-mock-line" style={{ width: '100%' }} />
              <div className="tpl-mock-line" style={{ width: '90%' }} />
              <div className="tpl-mock-chiprow">
                <span className="tpl-mock-chip" />
                <span className="tpl-mock-chip" />
                <span className="tpl-mock-chip" />
              </div>
              <div className="tpl-mock-line" style={{ width: '100%' }} />
              <div className="tpl-mock-line" style={{ width: '75%' }} />
            </div>
          </div>
          <p style={{ marginTop: 8 }}>
            <span className="ds-badge ds-badge-primary"><FaEye aria-hidden="true" /> Optimized for presentation</span>
          </p>
          <p className="ds-muted" style={{ fontSize: '0.85rem' }}>
            Minimal, Modern, Classic, Professional. Accent colors, chips and hierarchy for
            portfolio sites, networking, email and print. Exported as a pixel-faithful PDF.
          </p>
          {onChooseVisual && (
            <button type="button" className="ds-btn ds-btn-secondary ds-btn-sm" onClick={onChooseVisual}>
              Browse visual templates
            </button>
          )}
        </div>
        <div>
          <div className="tpl-mock tpl-mock-ats" role="img" aria-label="Plain ATS resume mock">
            <div className="tpl-mock-head">
              <div className="tpl-mock-line" style={{ width: '40%', height: 10 }} />
              <div className="tpl-mock-line" style={{ width: '85%' }} />
            </div>
            <div className="tpl-mock-body">
              <div className="tpl-mock-line" style={{ width: '35%', height: 9 }} />
              <div className="tpl-mock-line" style={{ width: '100%' }} />
              <div className="tpl-mock-line" style={{ width: '95%' }} />
              <div className="tpl-mock-line" style={{ width: '35%', height: 9 }} />
              <div className="tpl-mock-line" style={{ width: '100%' }} />
              <div className="tpl-mock-line" style={{ width: '80%' }} />
            </div>
          </div>
          <p style={{ marginTop: 8 }}>
            <span className="ds-badge ds-badge-success"><FaShieldAlt aria-hidden="true" /> Optimized for parsing & applications</span>
          </p>
          <p className="ds-muted" style={{ fontSize: '0.85rem' }}>
            Single column, standard fonts, semantic headings, selectable text. Always use
            this version when applying through job portals and ATS pipelines.
          </p>
          {onChooseAts && (
            <button type="button" className="ds-btn ds-btn-secondary ds-btn-sm" onClick={onChooseAts}>
              Open ATS preview
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TemplateCompareCard;
