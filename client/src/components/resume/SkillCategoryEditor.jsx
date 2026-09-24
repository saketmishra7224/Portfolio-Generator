import React from 'react';
import { FaTrash, FaPlus } from 'react-icons/fa';
import { SKILL_CATEGORIES, flattenCategories } from '../../utils/resumeModel';

// Categorized skills editor. Writes skillCategories; parents must run
// withSyncedSkills()/prepareForSave() before persisting so the legacy flat
// skills[] stays in sync for old templates and ATS output.
const SkillCategoryEditor = ({ value = {}, onChange, disabled = false }) => {
  const setCat = (key, list) => onChange({ ...value, [key]: list });
  const total = flattenCategories(value).length;

  return (
    <div>
      <div className="ds-row" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
        <span className="ds-helper">Organize skills by category — {total} total. Duplicates across categories are merged on save.</span>
      </div>
      <div style={{ display: 'grid', gap: 12 }}>
        {SKILL_CATEGORIES.map((cat) => {
          const list = Array.isArray(value[cat.key]) ? value[cat.key] : [];
          return (
            <div key={cat.key} className="ds-card" style={{ padding: '0.7rem 0.8rem', background: 'var(--ds-surface-2)' }}>
              <span className="ds-label">{cat.label} <span className="ds-helper">({list.length})</span></span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                {list.map((s, i) => (
                  <span key={i} className="ds-badge" style={{ gap: 6 }}>
                    <input
                      value={s}
                      maxLength={80}
                      disabled={disabled}
                      onChange={(e) => setCat(cat.key, list.map((x, xi) => (xi === i ? e.target.value : x)))}
                      aria-label={`${cat.label} skill ${i + 1}`}
                      style={{ background: 'transparent', border: 0, outline: 'none', width: `${Math.max(4, String(s || '').length + 1)}ch`, fontSize: 'inherit', color: 'inherit' }}
                    />
                    <button
                      type="button" onClick={() => setCat(cat.key, list.filter((_, xi) => xi !== i))}
                      disabled={disabled} aria-label={`Remove ${s || 'skill'} from ${cat.label}`}
                      style={{ background: 'transparent', border: 0, cursor: 'pointer', color: 'inherit', display: 'flex' }}
                    >
                      <FaTrash aria-hidden="true" size={11} />
                    </button>
                  </span>
                ))}
                <button
                  type="button" className="ds-btn ds-btn-ghost ds-btn-sm"
                  disabled={disabled || list.length >= 30}
                  onClick={() => setCat(cat.key, [...list, ''])}
                >
                  <FaPlus aria-hidden="true" /> Add
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SkillCategoryEditor;
