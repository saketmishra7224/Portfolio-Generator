import React from 'react';
import { motion } from 'framer-motion';
import { FaCheckCircle } from 'react-icons/fa';
import TemplateCompareCard from './templates/TemplateCompareCard';

function MiniResume({ name, role, accent = '#0f172a', layout = 'stacked' }) {
  return (
    <div className="ds-mini-resume" aria-hidden="true">
      {layout === 'sidebar' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '88px 1fr', minHeight: 150 }}>
          <div style={{ background: accent, color: '#fff', padding: '0.6rem', display: 'grid', gap: 6, alignContent: 'start' }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,0.9)' }} />
            <div style={{ fontSize: '0.58rem', fontWeight: 800, letterSpacing: '0.06em' }}>CONTACT</div>
            <div style={{ height: 4, background: 'rgba(255,255,255,0.6)', borderRadius: 4 }} />
            <div style={{ height: 4, background: 'rgba(255,255,255,0.6)', borderRadius: 4, width: '80%' }} />
            <div style={{ fontSize: '0.58rem', fontWeight: 800, letterSpacing: '0.06em', marginTop: 4 }}>SKILLS</div>
            <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              {['R', 'N', 'M'].map((x) => <span key={x} style={{ fontSize: '0.55rem', background: 'rgba(255,255,255,0.2)', padding: '1px 5px', borderRadius: 99 }}>{x}</span>)}
            </div>
          </div>
          <div style={{ padding: '0.6rem 0.7rem', display: 'grid', gap: 5, alignContent: 'start' }}>
            <div className="ds-mini-name">{name}</div>
            <div className="ds-mini-role">{role}</div>
            <div className="ds-mini-sec">Projects</div>
            <div className="ds-mini-line" style={{ width: '95%' }} />
            <div className="ds-mini-line" style={{ width: '100%' }} />
            <div className="ds-mini-sec">Education</div>
            <div className="ds-mini-line" style={{ width: '60%' }} />
          </div>
        </div>
      ) : (
        <>
          <div className="ds-mini-head" style={{ borderBottomColor: accent }}>
            <div className="ds-mini-name">{name}</div>
            <div className="ds-mini-role">{role} • email • phone • github</div>
          </div>
          <div className="ds-mini-body">
            <div>
              <div className="ds-mini-sec">Summary</div>
              <div className="ds-mini-line" style={{ width: '100%' }} />
              <div className="ds-mini-line" style={{ width: '90%' }} />
            </div>
            <div>
              <div className="ds-mini-sec">Skills</div>
              <div className="ds-mini-chips">
                <span className="ds-mini-chip">React</span>
                <span className="ds-mini-chip">Node.js</span>
                <span className="ds-mini-chip">MongoDB</span>
              </div>
            </div>
            <div>
              <div className="ds-mini-sec">Projects • Education</div>
              <div className="ds-mini-line" style={{ width: '95%' }} />
              <div className="ds-mini-line" style={{ width: '80%' }} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const TemplateSelector = ({ selectedTemplate, onSelectTemplate, onOpenAts }) => {
  const templates = [
    { id: 'minimal', name: 'Minimal', desc: 'Whitespace, elegant serif/sans pairing, simple hierarchy.', accent: '#0f172a', layout: 'stacked' },
    { id: 'modern', name: 'Modern', desc: 'Contemporary accent band, strong section hierarchy.', accent: '#4a6cf7', layout: 'sidebar' },
    { id: 'classic', name: 'Classic', desc: 'Traditional serif resume, formal centered hierarchy.', accent: '#b45309', layout: 'stacked' },
    { id: 'professional', name: 'Professional', desc: 'Corporate density, polished headers for developers.', accent: '#0e7490', layout: 'sidebar' },
  ];

  return (
    <div>
      <TemplateCompareCard onChooseAts={onOpenAts} />
      <div style={{ marginBottom: 12 }}>
        <h3 className="ds-h1" style={{ fontSize: '1.25rem' }}>Choose your visual template</h3>
        <p className="ds-muted">Realistic previews using your data shape. Switching never deletes anything. For job portals, use the ATS template in Preview instead.</p>
      </div>

      <div role="radiogroup" aria-label="Portfolio templates" className="ds-grid-2">
        {templates.map((t, idx) => {
          const selected = selectedTemplate === t.id;
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, delay: idx * 0.04 }}
              className="ds-card"
              style={{
                overflow: 'hidden',
                outline: selected ? '2px solid var(--ds-primary)' : 'none',
                outlineOffset: 2,
              }}
            >
              <div style={{ position: 'relative' }}>
                <MiniResume name="Jane Cooper" role={`${t.name} • Full Stack Developer`} accent={t.accent} layout={t.layout} />
                {selected && (
                  <span className="ds-badge ds-badge-success" style={{ position: 'absolute', top: 8, right: 8 }}>
                    <FaCheckCircle aria-hidden="true" /> Selected
                  </span>
                )}
              </div>
              <div style={{ padding: '0.85rem 1rem' }}>
                <div className="ds-row" style={{ justifyContent: 'space-between' }}>
                  <strong>{t.name}</strong>
                  <span className="ds-helper">{t.id}</span>
                </div>
                <p className="ds-muted" style={{ margin: '4px 0 10px' }}>{t.desc}</p>
                <button
                  role="radio"
                  aria-checked={selected}
                  onClick={() => onSelectTemplate(t.id)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectTemplate(t.id); } }}
                  className={`ds-btn ds-btn-sm ${selected ? 'ds-btn-primary' : 'ds-btn-secondary'}`}
                  tabIndex={0}
                >
                  {selected ? 'Selected' : `Use ${t.name}`}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {selectedTemplate && (
        <div className="ds-alert ds-alert-info" role="status" style={{ marginTop: 12 }}>
          Currently using <strong style={{ margin: '0 4px' }}>{selectedTemplate}</strong> — preview to see your data in this style.
        </div>
      )}
    </div>
  );
};

export default TemplateSelector;
