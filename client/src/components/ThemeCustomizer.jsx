import React, { useState, useEffect } from 'react';
import { FaPalette, FaFont, FaFileAlt, FaSave, FaMoon, FaSun, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import { useTheme } from '../context/ThemeContext';

const ThemeCustomizer = () => {
  const { theme, updateThemeWithSync } = useTheme();
  const [localTheme, setLocalTheme] = useState(theme);
  const [density, setDensity] = useState(() => localStorage.getItem('ds-density') || 'comfortable');
  const [appearance, setAppearance] = useState(() => (localStorage.getItem('darkMode') === 'true' ? 'dark' : 'light'));
  const [isSaving, setIsSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => { setLocalTheme(theme); }, [theme]);
  useEffect(() => {
    document.documentElement.dataset.density = density;
    localStorage.setItem('ds-density', density);
  }, [density]);

  const templates = [
    { id: 'minimal', name: 'Minimal', desc: 'Clean and simple' },
    { id: 'modern', name: 'Modern', desc: 'Contemporary sidebar' },
    { id: 'classic', name: 'Classic', desc: 'Traditional balance' },
    { id: 'professional', name: 'Professional', desc: 'Corporate formal' },
  ];
  const fonts = ['Inter', 'Poppins', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Arial', 'Georgia'];
  const presetColors = ['#4a6cf7', '#2563eb', '#7c3aed', '#0891b2', '#16a34a', '#ea580c', '#dc2626', '#db2777', '#0f172a'];

  const applyAppearance = (mode) => {
    setAppearance(mode);
    const dark = mode === 'dark';
    localStorage.setItem('darkMode', String(dark));
    document.documentElement.classList.toggle('dark', dark);
    document.body.classList.toggle('dark', dark);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMsg(null);
    try {
      // Only backend-known keys are synced; density/appearance stay local (no API change).
      await updateThemeWithSync({
        template: localTheme.template,
        accentColor: localTheme.accentColor,
        font: localTheme.font,
      });
      setMsg({ tone: 'success', text: 'Theme saved and applied to previews + PDFs.' });
    } catch (e) {
      setMsg({ tone: 'error', text: 'Could not save theme. Check connection and retry.' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setMsg(null), 3500);
    }
  };

  return (
    <div className="ds-card ds-card-pad">
      <div style={{ marginBottom: 12 }}>
        <h2 className="ds-h1" style={{ fontSize: '1.25rem' }}>Theme customization</h2>
        <p className="ds-muted">Template, accent, typography, density, and app appearance. Previews update instantly after save.</p>
      </div>

      {msg && (
        <div className={`ds-alert ${msg.tone === 'success' ? 'ds-alert-success' : 'ds-alert-error'}`} role={msg.tone === 'success' ? 'status' : 'alert'} style={{ marginBottom: 12 }}>
          {msg.tone === 'success' ? <FaCheckCircle aria-hidden="true" /> : <FaExclamationCircle aria-hidden="true" />}
          <span>{msg.text}</span>
        </div>
      )}

      <section aria-labelledby="tc-template" style={{ marginBottom: 16 }}>
        <h3 id="tc-template" className="ds-h3" style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
          <FaFileAlt aria-hidden="true" /> Template
        </h3>
        <div className="ds-grid-2" role="radiogroup" aria-label="Template style">
          {templates.map((t) => {
            const sel = localTheme.template === t.id;
            return (
              <button
                key={t.id}
                role="radio"
                aria-checked={sel}
                onClick={() => setLocalTheme((p) => ({ ...p, template: t.id }))}
                className="ds-card"
                style={{ padding: '0.8rem', textAlign: 'left', cursor: 'pointer', outline: sel ? '2px solid var(--ds-primary)' : 'none', outlineOffset: 2 }}
              >
                <strong>{t.name}</strong>
                <div className="ds-helper">{t.desc}</div>
              </button>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="tc-color" style={{ marginBottom: 16 }}>
        <h3 id="tc-color" className="ds-h3" style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
          <FaPalette aria-hidden="true" /> Accent color
        </h3>
        <div className="ds-row" style={{ flexWrap: 'wrap' }} role="radiogroup" aria-label="Accent color presets">
          {presetColors.map((c) => {
            const sel = localTheme.accentColor === c;
            return (
              <button
                key={c}
                role="radio"
                aria-checked={sel}
                aria-label={`Accent ${c}`}
                title={c}
                onClick={() => setLocalTheme((p) => ({ ...p, accentColor: c }))}
                style={{
                  width: 34, height: 34, borderRadius: '50%', background: c, cursor: 'pointer',
                  border: sel ? '3px solid var(--ds-text)' : '2px solid var(--ds-border-strong)',
                }}
              />
            );
          })}
          <label className="ds-helper" htmlFor="tc-custom" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            Custom
            <input
              id="tc-custom"
              type="color"
              value={localTheme.accentColor || '#4a6cf7'}
              onChange={(e) => setLocalTheme((p) => ({ ...p, accentColor: e.target.value }))}
              aria-label="Custom accent color"
              style={{ width: 34, height: 34, padding: 0, border: '1px solid var(--ds-border-strong)', borderRadius: 8, background: 'transparent' }}
            />
          </label>
        </div>
        <p className="ds-helper" style={{ marginTop: 6 }}>Used for headings, links, and highlights in templates + PDF.</p>
      </section>

      <section aria-labelledby="tc-font" style={{ marginBottom: 16 }}>
        <h3 id="tc-font" className="ds-h3" style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
          <FaFont aria-hidden="true" /> Typography
        </h3>
        <label className="ds-label" htmlFor="tc-font-select">Font family</label>
        <select
          id="tc-font-select"
          className="ds-select"
          value={localTheme.font || 'Inter'}
          onChange={(e) => setLocalTheme((p) => ({ ...p, font: e.target.value }))}
          style={{ fontFamily: localTheme.font, marginTop: 4 }}
        >
          {fonts.map((f) => <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>)}
        </select>
        <p className="ds-muted" style={{ fontFamily: localTheme.font, marginTop: 8 }}>The quick brown fox jumps over the lazy dog — 1234567890</p>
      </section>

      <section aria-labelledby="tc-density" style={{ marginBottom: 16 }}>
        <h3 id="tc-density" className="ds-h3" style={{ marginBottom: 8 }}>Spacing / density <span className="ds-badge" style={{ marginLeft: 6 }}>App only</span></h3>
        <div className="ds-row" role="radiogroup" aria-label="Density">
          {[
            { id: 'compact', label: 'Compact' },
            { id: 'comfortable', label: 'Comfortable' },
            { id: 'spacious', label: 'Spacious' },
          ].map((d) => (
            <button
              key={d.id}
              role="radio"
              aria-checked={density === d.id}
              onClick={() => setDensity(d.id)}
              className={`ds-btn ds-btn-sm ${density === d.id ? 'ds-btn-primary' : 'ds-btn-secondary'}`}
            >
              {d.label}
            </button>
          ))}
        </div>
        <p className="ds-helper" style={{ marginTop: 6 }}>Stored on this device only — does not change saved resumes or backend data.</p>
      </section>

      <section aria-labelledby="tc-appear" style={{ marginBottom: 16 }}>
        <h3 id="tc-appear" className="ds-h3" style={{ marginBottom: 8 }}>Application theme</h3>
        <div className="ds-row" role="radiogroup" aria-label="Light or dark">
          <button role="radio" aria-checked={appearance === 'light'} onClick={() => applyAppearance('light')} className={`ds-btn ds-btn-sm ${appearance === 'light' ? 'ds-btn-primary' : 'ds-btn-secondary'}`}>
            <FaSun aria-hidden="true" /> Light
          </button>
          <button role="radio" aria-checked={appearance === 'dark'} onClick={() => applyAppearance('dark')} className={`ds-btn ds-btn-sm ${appearance === 'dark' ? 'ds-btn-primary' : 'ds-btn-secondary'}`}>
            <FaMoon aria-hidden="true" /> Dark
          </button>
        </div>
        <p className="ds-helper" style={{ marginTop: 6 }}>PDFs always export in light mode for print + ATS safety.</p>
      </section>

      <button onClick={handleSave} disabled={isSaving} className="ds-btn ds-btn-primary" aria-busy={isSaving}>
        <FaSave aria-hidden="true" /> {isSaving ? 'Saving…' : 'Save theme'}
      </button>
    </div>
  );
};

export default ThemeCustomizer;
