import React from 'react';

// Shared resume-section renderers used by all portfolio templates, preview
// and PDF export. They read the new structured arrays and degrade gracefully
// to legacy shapes (single education object, flat skills, legacy projects).

export function dateRange(item = {}) {
  const end = item.current ? 'Present' : (item.endDate || item.expirationDate || '');
  return [item.startDate || item.issueDate || item.date || '', end].filter(Boolean).join(' – ');
}

export function SectionBlock({ wrapClass = 'resume-section', titleClass = 'section-title', title, children }) {
  return (
    <div className={wrapClass}>
      <h2 className={titleClass}>{title}</h2>
      {children}
    </div>
  );
}

export function ExperienceList({ items = [] }) {
  if (!items.length) return null;
  return (
    <div className="resume-experience-list">
      {items.map((x, i) => (
        <div key={x._id || i} className="pdf-project-item">
          <div className="pdf-project-title">{x.role || 'Role'} — {x.company || 'Company'}</div>
          <div className="pdf-project-tech">
            {[dateRange(x), x.location, x.employmentType].filter(Boolean).join(' • ')}
          </div>
          {x.description && <p className="pdf-project-desc">{x.description}</p>}
          {(x.bullets || []).length > 0 && (
            <ul className="pdf-project-desc" style={{ margin: '4px 0 4px 18px' }}>
              {x.bullets.map((b, bi) => <li key={bi}>{b}</li>)}
            </ul>
          )}
          {(x.technologies || []).length > 0 && (
            <p className="pdf-project-tech">Stack: {(Array.isArray(x.technologies) ? x.technologies : [x.technologies]).join(', ')}</p>
          )}
        </div>
      ))}
    </div>
  );
}

export function EducationList({ entries = [], legacy }) {
  const list = (entries && entries.length > 0)
    ? entries
    : (legacy && (legacy.college || legacy.degree)
      ? [{ institution: legacy.college, degree: legacy.degree, field: legacy.specialization, grade: legacy.cgpa, description: legacy.summary }]
      : []);
  if (!list.length) return null;
  return (
    <div className="resume-education-list">
      {list.map((e, i) => (
        <div key={e._id || i} className="pdf-project-item">
          <div className="pdf-project-title">
            {[e.degree, e.field].filter(Boolean).join(', ') || 'Degree'}
          </div>
          <div className="pdf-project-tech">
            {[e.institution, dateRange(e), e.location].filter(Boolean).join(' • ')}
            {e.grade ? ` • ${e.grade}` : ''}
          </div>
          {e.description && <p className="pdf-project-desc">{e.description}</p>}
          {(e.coursework || []).length > 0 && (
            <p className="pdf-project-tech">Coursework: {e.coursework.join(', ')}</p>
          )}
        </div>
      ))}
    </div>
  );
}

export function EnhancedProjectsList({ projects = [] }) {
  if (!projects.length) return null;
  const techOf = (p) => Array.isArray(p.technologies) ? p.technologies.join(', ') : (p.technologies || '');
  return (
    <div className="resume-projects-list">
      {projects.map((p, i) => (
        <div key={p._id || i} className="pdf-project-item">
          <div className="pdf-project-title">{p.title || `Project ${i + 1}`}</div>
          {(techOf(p) || p.role || dateRange(p)) && (
            <div className="pdf-project-tech">
              {[techOf(p), p.role, dateRange(p)].filter(Boolean).join(' • ')}
            </div>
          )}
          {p.description && <p className="pdf-project-desc">{p.description}</p>}
          {(p.bullets || []).length > 0 && (
            <ul className="pdf-project-desc" style={{ margin: '4px 0 4px 18px' }}>
              {p.bullets.map((b, bi) => <li key={bi}>{b}</li>)}
            </ul>
          )}
          {(p.outcomes || []).length > 0 && (
            <p className="pdf-project-desc"><strong>Outcomes:</strong> {p.outcomes.join('; ')}</p>
          )}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {p.liveUrl && <a href={p.liveUrl} target="_blank" rel="noopener noreferrer" className="pdf-project-link">Live Demo</a>}
            {p.githubUrl && <a href={p.githubUrl} target="_blank" rel="noopener noreferrer" className="pdf-project-link">GitHub</a>}
            {p.link && <a href={p.link} target="_blank" rel="noopener noreferrer" className="pdf-project-link">Link</a>}
          </div>
        </div>
      ))}
    </div>
  );
}

export function CategorizedSkills({ categories = {}, fallback = [] }) {
  const groups = Object.entries(categories || {}).filter(([, v]) => Array.isArray(v) && v.filter(Boolean).length > 0);
  if (groups.length === 0) {
    if (!fallback.length) return null;
    return (
      <div className="pdf-skills-list">
        {fallback.map((s, i) => <span key={i} className="pdf-skill-item">{s}</span>)}
      </div>
    );
  }
  const labelOf = (k) => k.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {groups.map(([k, list]) => (
        <div key={k}>
          <div className="pdf-project-tech" style={{ fontStyle: 'normal', fontWeight: 700 }}>{labelOf(k)}</div>
          <div className="pdf-skills-list">
            {list.filter(Boolean).map((s, i) => <span key={i} className="pdf-skill-item">{s}</span>)}
          </div>
        </div>
      ))}
    </div>
  );
}

export function CertificationList({ items = [] }) {
  if (!items.length) return null;
  return (
    <div>
      {items.map((c, i) => (
        <div key={c._id || i} className="pdf-project-item">
          <div className="pdf-project-title">{c.name}</div>
          <div className="pdf-project-tech">
            {[c.organization, c.issueDate].filter(Boolean).join(' • ')}
            {c.expirationDate ? ` (expires ${c.expirationDate})` : ''}
            {c.credentialId ? ` • ID: ${c.credentialId}` : ''}
          </div>
          {c.credentialUrl && <a href={c.credentialUrl} target="_blank" rel="noopener noreferrer" className="pdf-project-link">Verify credential</a>}
        </div>
      ))}
    </div>
  );
}

export function AchievementList({ items = [] }) {
  if (!items.length) return null;
  return (
    <div>
      {items.map((a, i) => (
        <div key={a._id || i} className="pdf-project-item">
          <div className="pdf-project-title">{a.title}</div>
          <div className="pdf-project-tech">{[a.organization, a.date].filter(Boolean).join(' • ')}</div>
          {a.description && <p className="pdf-project-desc">{a.description}</p>}
        </div>
      ))}
    </div>
  );
}

export function LeadershipList({ items = [] }) {
  if (!items.length) return null;
  return (
    <div>
      {items.map((l, i) => (
        <div key={l._id || i} className="pdf-project-item">
          <div className="pdf-project-title">{l.role}{l.organization ? ` — ${l.organization}` : ''}</div>
          {l.date && <div className="pdf-project-tech">{l.date}</div>}
          {l.description && <p className="pdf-project-desc">{l.description}</p>}
        </div>
      ))}
    </div>
  );
}

export function LanguageList({ items = [] }) {
  if (!items.length) return null;
  return (
    <div className="pdf-skills-list">
      {items.map((l, i) => (
        <span key={l._id || i} className="pdf-skill-item">
          {l.name}{l.proficiency ? ` — ${l.proficiency}` : ''}
        </span>
      ))}
    </div>
  );
}

export function PublicationList({ items = [] }) {
  if (!items.length) return null;
  return (
    <div>
      {items.map((p, i) => (
        <div key={p._id || i} className="pdf-project-item">
          <div className="pdf-project-title">{p.title}</div>
          <div className="pdf-project-tech">{[p.publisher, p.date].filter(Boolean).join(' • ')}</div>
          {p.description && <p className="pdf-project-desc">{p.description}</p>}
          {p.url && <a href={p.url} target="_blank" rel="noopener noreferrer" className="pdf-project-link">Read publication</a>}
        </div>
      ))}
    </div>
  );
}

export function VolunteeringList({ items = [] }) {
  if (!items.length) return null;
  return (
    <div>
      {items.map((v, i) => (
        <div key={v._id || i} className="pdf-project-item">
          <div className="pdf-project-title">{v.role || 'Volunteer'} — {v.organization}</div>
          {dateRange(v) && <div className="pdf-project-tech">{dateRange(v)}</div>}
          {v.description && <p className="pdf-project-desc">{v.description}</p>}
        </div>
      ))}
    </div>
  );
}
