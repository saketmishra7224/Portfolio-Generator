import React, { useState } from 'react';
import {
  FaPlus, FaTrash, FaEdit, FaCheck, FaTimes, FaChevronUp, FaChevronDown,
  FaGripVertical, FaExclamationCircle, FaCopy, FaMagic
} from 'react-icons/fa';
import {
  SECTION_DEFS, REQUIRED_FIELDS, validateEntry, hasDuplicateNames, moveItem, newEntry
} from '../../utils/resumeModel';
import ImproveDialog from '../assistant/ImproveDialog';

// Which draft fields get an "Improve" action, and which assistant target
// each maps to (bullet / project description / achievement text).
const IMPROVABLE_FIELDS = {
  bullets: 'bullet',
  outcomes: 'bullet',
  description: 'project',
};

// Long-form description fields per section (improve target).
const DESCRIPTION_TARGET = {
  experiences: 'bullet',
  projects: 'project',
  achievements: 'achievement',
  volunteering: 'bullet',
  educations: 'bullet',
  publications: 'bullet',
  leadership: 'achievement',
};

// Field layouts per section. Types: text | textarea | date | url | checkbox | list
const FIELD_CONFIG = {
  educations: [
    { name: 'institution', label: 'Institution', required: true, placeholder: 'e.g., Stanford University' },
    { name: 'degree', label: 'Degree', placeholder: 'e.g., Bachelor of Science' },
    { name: 'field', label: 'Field / Specialization', placeholder: 'e.g., Computer Science' },
    { name: 'startDate', label: 'Start date', type: 'date', placeholder: 'YYYY or YYYY-MM' },
    { name: 'endDate', label: 'End date', type: 'date', placeholder: 'YYYY, YYYY-MM or Present' },
    { name: 'current', label: 'Currently studying here', type: 'checkbox' },
    { name: 'grade', label: 'CGPA / Percentage', placeholder: 'e.g., 8.5 or 85%' },
    { name: 'location', label: 'Location', placeholder: 'e.g., Bengaluru, India' },
    { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Academic highlights, thesis, honors…' },
    { name: 'coursework', label: 'Relevant coursework', type: 'list', placeholder: 'e.g., Data Structures' },
  ],
  experiences: [
    { name: 'company', label: 'Company', required: true, placeholder: 'e.g., Acme Corp' },
    { name: 'role', label: 'Role', required: true, placeholder: 'e.g., Frontend Developer' },
    { name: 'location', label: 'Location', placeholder: 'e.g., Remote' },
    { name: 'employmentType', label: 'Employment type', placeholder: 'Full-time, Internship, Contract…' },
    { name: 'startDate', label: 'Start date', type: 'date', placeholder: 'YYYY-MM' },
    { name: 'endDate', label: 'End date', type: 'date', placeholder: 'YYYY-MM or Present' },
    { name: 'current', label: 'Currently working here', type: 'checkbox' },
    { name: 'description', label: 'Description', type: 'textarea', placeholder: 'What did you work on?' },
    { name: 'bullets', label: 'Achievement bullets', type: 'list', placeholder: 'e.g., Cut page load by 40%…' },
    { name: 'technologies', label: 'Technologies', type: 'list', placeholder: 'e.g., React' },
  ],
  projects: [
    { name: 'title', label: 'Title', required: true, placeholder: 'e.g., Portfolio Generator' },
    { name: 'role', label: 'Your role', placeholder: 'e.g., Solo developer' },
    { name: 'technologies', label: 'Technologies', placeholder: 'e.g., React, Node.js, MongoDB' },
    { name: 'description', label: 'Description', type: 'textarea', placeholder: 'What does it do and why?' },
    { name: 'bullets', label: 'Bullet points', type: 'list', placeholder: 'e.g., 2k monthly users…' },
    { name: 'outcomes', label: 'Measurable outcomes', type: 'list', placeholder: 'e.g., 99.9% uptime' },
    { name: 'liveUrl', label: 'Live URL', type: 'url', placeholder: 'https://…' },
    { name: 'githubUrl', label: 'GitHub URL', type: 'url', placeholder: 'https://github.com/…' },
    { name: 'link', label: 'Other link (legacy)', type: 'url', placeholder: 'https://…' },
    { name: 'startDate', label: 'Start date', type: 'date', placeholder: 'YYYY-MM' },
    { name: 'endDate', label: 'End date', type: 'date', placeholder: 'YYYY-MM or Present' },
  ],
  certifications: [
    { name: 'name', label: 'Name', required: true, placeholder: 'e.g., AWS Certified Developer' },
    { name: 'organization', label: 'Issuing organization', placeholder: 'e.g., Amazon Web Services' },
    { name: 'issueDate', label: 'Issue date', type: 'date', placeholder: 'YYYY-MM' },
    { name: 'expirationDate', label: 'Expiration date', type: 'date', placeholder: 'YYYY-MM (optional)' },
    { name: 'credentialId', label: 'Credential ID', placeholder: 'Optional' },
    { name: 'credentialUrl', label: 'Credential URL', type: 'url', placeholder: 'https://…' },
  ],
  achievements: [
    { name: 'title', label: 'Title', required: true, placeholder: 'e.g., Hackathon winner' },
    { name: 'organization', label: 'Organization', placeholder: 'e.g., Smart India Hackathon' },
    { name: 'date', label: 'Date', type: 'date', placeholder: 'YYYY-MM' },
    { name: 'description', label: 'Description', type: 'textarea', placeholder: 'What did you achieve?' },
  ],
  languages: [
    { name: 'name', label: 'Language', required: true, placeholder: 'e.g., English' },
    { name: 'proficiency', label: 'Proficiency', placeholder: 'Native, Fluent, Intermediate, Basic' },
  ],
  publications: [
    { name: 'title', label: 'Title', required: true, placeholder: 'Paper or article title' },
    { name: 'publisher', label: 'Publisher / Journal', placeholder: 'e.g., IEEE' },
    { name: 'date', label: 'Date', type: 'date', placeholder: 'YYYY-MM' },
    { name: 'url', label: 'URL', type: 'url', placeholder: 'https://…' },
    { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Short abstract' },
  ],
  volunteering: [
    { name: 'organization', label: 'Organization', required: true, placeholder: 'e.g., Code for Good' },
    { name: 'role', label: 'Role', placeholder: 'e.g., Mentor' },
    { name: 'startDate', label: 'Start date', type: 'date', placeholder: 'YYYY-MM' },
    { name: 'endDate', label: 'End date', type: 'date', placeholder: 'YYYY-MM or Present' },
    { name: 'current', label: 'Currently volunteering', type: 'checkbox' },
    { name: 'description', label: 'Description', type: 'textarea', placeholder: 'What did you do?' },
  ],
  leadership: [
    { name: 'role', label: 'Role', required: true, placeholder: 'e.g., Team Lead, Club President' },
    { name: 'organization', label: 'Organization', placeholder: 'e.g., Coding Club' },
    { name: 'date', label: 'Date', type: 'date', placeholder: 'YYYY-MM' },
    { name: 'description', label: 'Description', type: 'textarea', placeholder: 'What did you lead and what changed?' },
  ],
};

function summaryOf(section, item) {
  const pick = (...keys) => keys.map((k) => item[k]).find((v) => v && String(v).trim()) || '';
  switch (section) {
    case 'educations': return `${pick('institution')}${item.degree ? ` — ${item.degree}` : ''}`;
    case 'experiences': return `${pick('role')} @ ${pick('company')}`;
    case 'projects': return pick('title');
    case 'certifications': return `${pick('name')}${item.organization ? ` (${item.organization})` : ''}`;
    case 'achievements': return pick('title');
    case 'languages': return `${pick('name')}${item.proficiency ? ` — ${item.proficiency}` : ''}`;
    case 'publications': return pick('title');
    case 'volunteering': return `${pick('role') || 'Volunteer'} @ ${pick('organization')}`;
    case 'leadership': return `${pick('role')}${item.organization ? ` @ ${item.organization}` : ''}`;
    default: return 'Entry';
  }
}

function ListInput({ value = [], onChange, placeholder, label, onImproveItem }) {
  const add = () => onChange([...(value || []), '']);
  return (
    <div>
      <span className="ds-label">{label}</span>
      <div style={{ display: 'grid', gap: 6, marginTop: 4 }}>
        {(value || []).map((v, i) => (
          <div key={i} className="ds-row">
            <input
              className="ds-input"
              value={v}
              maxLength={300}
              onChange={(e) => onChange((value || []).map((x, xi) => (xi === i ? e.target.value : x)))}
              placeholder={placeholder}
              aria-label={`${label} ${i + 1}`}
            />
            {onImproveItem && String(v || '').trim() && (
              <button
                type="button" className="ds-btn ds-btn-ghost ds-btn-sm"
                onClick={() => onImproveItem(i, v)}
                aria-label={`Improve ${label} ${i + 1} with assistant`}
                title="Improve with assistant"
              >
                <FaMagic aria-hidden="true" />
              </button>
            )}
            <button type="button" className="ds-btn ds-btn-ghost ds-btn-sm" onClick={() => onChange((value || []).filter((_, xi) => xi !== i))} aria-label={`Remove ${label} ${i + 1}`}>
              <FaTrash aria-hidden="true" />
            </button>
          </div>
        ))}
        <button type="button" className="ds-btn ds-btn-secondary ds-btn-sm" onClick={add} style={{ justifySelf: 'start' }}>
          <FaPlus aria-hidden="true" /> Add
        </button>
      </div>
    </div>
  );
}

// Generic add / edit / delete / reorder editor for one resume section.
// techContext: the user's own skills/stacks — the only external wording the
// assistant may reference. onImproveField, when provided, opens the Improve
// dialog owned by the parent instead of the built-in one.
const SectionEditor = ({ section, items = [], onChange, disabled = false, techContext = [] }) => {
  const def = SECTION_DEFS.find((d) => d.key === section) || { label: section, maxItems: 20 };
  const fields = FIELD_CONFIG[section] || [];
  const [editing, setEditing] = useState(null); // index | 'new'
  const [draft, setDraft] = useState(null);
  const [errors, setErrors] = useState({});
  const [dragFrom, setDragFrom] = useState(null);
  // Improve dialog state: { label, value, target, apply } — apply writes the
  // approved suggestion back into the draft. Nothing applies automatically.
  const [improve, setImprove] = useState(null);
  const openImprove = (label, value, target, apply) => setImprove({ label, value, target, apply });

  const startAdd = () => { setEditing('new'); setDraft(newEntry(section)); setErrors({}); };
  const startEdit = (i) => { setEditing(i); setDraft({ ...(items[i] || {}) }); setErrors({}); };
  const cancel = () => { setEditing(null); setDraft(null); setErrors({}); };

  const commit = () => {
    const errs = validateEntry(section, draft || {});
    // Prevent duplicates where appropriate (languages + skills-like names).
    if ((section === 'languages') && !errs.name) {
      const others = items.filter((_, i) => i !== editing).concat([]);
      if (hasDuplicateNames([...others, draft], 'name')) errs.name = 'Duplicate entry';
    }
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    const clean = { ...draft };
    // Drop empty optional strings/arrays to keep documents tidy.
    for (const k of Object.keys(clean)) {
      if (clean[k] === '' || (Array.isArray(clean[k]) && clean[k].every((x) => !String(x || '').trim()))) {
        if (!(REQUIRED_FIELDS[section] || []).includes(k)) delete clean[k];
      }
    }
    if (Array.isArray(clean.bullets)) clean.bullets = clean.bullets.map((b) => String(b).trim()).filter(Boolean);
    if (Array.isArray(clean.outcomes)) clean.outcomes = clean.outcomes.map((b) => String(b).trim()).filter(Boolean);
    if (Array.isArray(clean.technologies)) clean.technologies = clean.technologies.map((b) => String(b).trim()).filter(Boolean);
    if (Array.isArray(clean.coursework)) clean.coursework = clean.coursework.map((b) => String(b).trim()).filter(Boolean);
    if (editing === 'new') onChange([...(items || []), clean]);
    else onChange((items || []).map((it, i) => (i === editing ? { ...it, ...clean } : it)));
    cancel();
  };

  const remove = (i) => onChange((items || []).filter((_, xi) => xi !== i));
  const move = (i, dir) => onChange(moveItem(items || [], i, i + dir));
  const duplicate = (i) => {
    const src = items[i];
    if (!src) return;
    const copy = JSON.parse(JSON.stringify(src));
    delete copy._id;
    const next = [...(items || [])];
    next.splice(i + 1, 0, copy);
    onChange(next);
  };
  const canDuplicate = ['experiences', 'projects', 'educations'].includes(section);

  const setField = (name, value) => {
    setDraft((d) => ({ ...d, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: null }));
  };

  const renderField = (f) => {
    const id = `se-${section}-${f.name}`;
    if (f.type === 'checkbox') {
      return (
        <label key={f.name} htmlFor={id} className="ds-row" style={{ gap: 8, cursor: 'pointer' }}>
          <input id={id} type="checkbox" checked={!!draft[f.name]} onChange={(e) => setField(f.name, e.target.checked)} style={{ width: 18, height: 18, accentColor: 'var(--ds-primary)' }} />
          <span className="ds-label">{f.label}</span>
        </label>
      );
    }
    if (f.type === 'list') {
      const val = draft[f.name];
      const arr = Array.isArray(val) ? val : (typeof val === 'string' && val ? [val] : []);
      const improvable = IMPROVABLE_FIELDS[f.name];
      return (
        <ListInput
          key={f.name}
          label={`${f.label}${f.required ? ' *' : ''}`}
          value={arr}
          placeholder={f.placeholder}
          onChange={(v) => setField(f.name, v)}
          onImproveItem={improvable ? (idx, v) => openImprove(`${f.label} ${idx + 1}`, v, improvable, (nv) => {
            setField(f.name, (draft[f.name] || []).map((x, xi) => (xi === idx ? nv : x)));
          }) : undefined}
        />
      );
    }
    if (f.type === 'textarea') {
      const target = DESCRIPTION_TARGET[section] || 'bullet';
      const hasText = String(draft[f.name] || '').trim().length > 0;
      return (
        <div key={f.name}>
          <div className="ds-row" style={{ justifyContent: 'space-between' }}>
            <label className="ds-label" htmlFor={id}>{f.label}{f.required && ' *'}</label>
            {hasText && (
              <button
                type="button" className="ds-btn ds-btn-ghost ds-btn-sm"
                onClick={() => openImprove(f.label, draft[f.name], target, (nv) => setField(f.name, nv))}
                title="Improve with assistant (asks before applying)"
              >
                <FaMagic aria-hidden="true" /> Improve
              </button>
            )}
          </div>
          <textarea id={id} className="ds-textarea" value={draft[f.name] || ''} maxLength={2000} rows={3}
            onChange={(e) => setField(f.name, e.target.value)} placeholder={f.placeholder} aria-invalid={errors[f.name] ? 'true' : 'false'} style={{ marginTop: 4 }} />
          {errors[f.name] && <p role="alert" className="ds-field-error"><FaExclamationCircle aria-hidden="true" /> {errors[f.name]}</p>}
        </div>
      );
    }
    return (
      <div key={f.name}>
        <label className="ds-label" htmlFor={id}>{f.label}{f.required && ' *'}</label>
        <input id={id} className="ds-input" type={f.type === 'url' ? 'url' : 'text'} value={draft[f.name] || ''}
          onChange={(e) => setField(f.name, e.target.value)} placeholder={f.placeholder}
          aria-invalid={errors[f.name] ? 'true' : 'false'} style={{ marginTop: 4 }} />
        {f.type === 'date' && !errors[f.name] && <p className="ds-helper" style={{ marginTop: 2 }}>YYYY, YYYY-MM or Present</p>}
        {errors[f.name] && <p role="alert" className="ds-field-error"><FaExclamationCircle aria-hidden="true" /> {errors[f.name]}</p>}
      </div>
    );
  };

  const atCap = (items || []).length >= (def.maxItems || 20);

  return (
    <div>
      {(items || []).length === 0 && editing !== 'new' ? (
        <p className="ds-muted">No entries yet. Add your first {def.singular || 'entry'} below — this section stays optional.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 10px', display: 'grid', gap: 8 }}>
          {(items || []).map((item, i) => (
            <li
              key={item._id || `idx-${i}`}
              draggable={editing === null && !disabled}
              onDragStart={() => setDragFrom(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => { if (dragFrom !== null && dragFrom !== i) onChange(moveItem(items, dragFrom, i)); setDragFrom(null); }}
              className="ds-card"
              style={{ padding: '0.6rem 0.7rem', background: 'var(--ds-surface-2)', opacity: dragFrom === i ? 0.6 : 1 }}
            >
              <div className="ds-row" style={{ justifyContent: 'space-between' }}>
                <span className="ds-row" style={{ gap: 8, minWidth: 0 }}>
                  <FaGripVertical aria-hidden="true" color="var(--ds-faint)" title="Drag to reorder" />
                  <strong style={{ fontSize: '0.88rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {summaryOf(section, item) || `Entry ${i + 1}`}
                  </strong>
                </span>
                <span className="ds-row" style={{ gap: 2 }}>
                  <button type="button" className="ds-btn ds-btn-ghost ds-btn-sm" onClick={() => move(i, -1)} disabled={disabled || i === 0} aria-label={`Move entry ${i + 1} up`} title="Move up"><FaChevronUp aria-hidden="true" /></button>
                  <button type="button" className="ds-btn ds-btn-ghost ds-btn-sm" onClick={() => move(i, 1)} disabled={disabled || i === (items || []).length - 1} aria-label={`Move entry ${i + 1} down`} title="Move down"><FaChevronDown aria-hidden="true" /></button>
                  <button type="button" className="ds-btn ds-btn-ghost ds-btn-sm" onClick={() => startEdit(i)} disabled={disabled} aria-label={`Edit entry ${i + 1}`}><FaEdit aria-hidden="true" /></button>
                  {canDuplicate && (
                    <button type="button" className="ds-btn ds-btn-ghost ds-btn-sm" onClick={() => duplicate(i)} disabled={disabled || (items || []).length >= (def.maxItems || 20)} aria-label={`Duplicate entry ${i + 1}`} title="Duplicate entry"><FaCopy aria-hidden="true" /></button>
                  )}
                  <button type="button" className="ds-btn ds-btn-ghost ds-btn-sm" onClick={() => remove(i)} disabled={disabled} aria-label={`Delete entry ${i + 1}`}><FaTrash aria-hidden="true" /></button>
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing !== null && draft && (
        <div className="ds-card" style={{ padding: '0.9rem', borderColor: 'var(--ds-primary)', marginBottom: 10 }} role="form" aria-label={editing === 'new' ? `Add ${def.singular}` : `Edit ${def.singular}`}>
          <strong>{editing === 'new' ? `Add ${def.singular}` : `Edit ${def.singular}`}</strong>
          <div className="ds-stack" style={{ marginTop: 10 }}>
            {fields.map(renderField)}
          </div>
          <div className="ds-row" style={{ marginTop: 12 }}>
            <button type="button" className="ds-btn ds-btn-primary ds-btn-sm" onClick={commit}><FaCheck aria-hidden="true" /> {editing === 'new' ? 'Add' : 'Save'}</button>
            <button type="button" className="ds-btn ds-btn-ghost ds-btn-sm" onClick={cancel}><FaTimes aria-hidden="true" /> Cancel</button>
          </div>
        </div>
      )}

      {editing === null && (
        <button type="button" className="ds-btn ds-btn-secondary ds-btn-sm" onClick={startAdd} disabled={disabled || atCap}>
          <FaPlus aria-hidden="true" /> Add {def.singular || 'entry'}
        </button>
      )}
      {atCap && <p className="ds-helper" style={{ marginTop: 6 }}>Maximum {def.maxItems} entries reached.</p>}

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

export default SectionEditor;
