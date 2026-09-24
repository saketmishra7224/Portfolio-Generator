import React from 'react';

// ---------------------------------------------------------------------------
// Shared resume building blocks — the single place where resume business
// logic lives for rendering. Every template (Minimal, Modern, Classic,
// Professional, ATS, live preview) renders the SAME underlying document
// model (see utils/atsDocument.js buildAtsDocument) through these components,
// passing only a theme object `T` of class names for its design language.
// No template duplicates section/entry/skill/contact logic.
// ---------------------------------------------------------------------------

export function ResumeHeader({ doc, T }) {
  if (!doc) return null;
  return (
    <header className={T.header}>
      {T.avatar && doc.name ? (
        <div className={T.avatar} aria-hidden="true">
          {doc.name.charAt(0).toUpperCase()}
        </div>
      ) : null}
      <h1 className={T.name}>{doc.name || 'Your Name'}</h1>
      {doc.headline ? <p className={T.headline}>{doc.headline}</p> : null}
      <ResumeContact doc={doc} T={T} />
    </header>
  );
}

export function ResumeContact({ doc, T }) {
  if (!doc) return null;
  const hasContact = (doc.contact || []).length > 0;
  const hasLinks = (doc.links || []).length > 0;
  if (!hasContact && !hasLinks) return null;
  return (
    <div className={T.contactWrap}>
      {hasContact ? <p className={T.contact}>{doc.contact.join(' | ')}</p> : null}
      {hasLinks ? (
        <p className={T.contact}>
          {doc.links.map((l, i) => (
            <React.Fragment key={i}>
              {i > 0 ? ' | ' : null}
              <a className={T.link} href={l.url} target="_blank" rel="noopener noreferrer">{l.text}</a>
            </React.Fragment>
          ))}
        </p>
      ) : null}
    </div>
  );
}

export function ResumeSection({ title, T, children }) {
  return (
    <section className={T.section}>
      <h2 className={T.sectionTitle}>{title}</h2>
      <div className={T.sectionBody}>{children}</div>
    </section>
  );
}

export function BulletList({ items = [], T }) {
  const list = (items || []).map((b) => String(b || '').trim()).filter(Boolean);
  if (list.length === 0) return null;
  return (
    <ul className={T.bullets}>
      {list.map((b, i) => (
        <li key={i} className={T.bullet}>{b}</li>
      ))}
    </ul>
  );
}

function ParaBlock({ block, T }) {
  if (!block.text) return null;
  return <p className={T.para}>{block.text}</p>;
}

function SkillsBlock({ block, T }) {
  if (!block.items || block.items.length === 0) return null;
  return (
    <div className={T.skillGroup}>
      {block.label ? <p className={T.skillGroupLabel}>{block.label}</p> : null}
      <p className={T.skillsInline}>{block.items.join(', ')}</p>
      {T.skillChip ? (
        <div className={T.skillsChips}>
          {block.items.map((s, i) => (
            <span key={i} className={T.skillChip}>{s}</span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function EntryBlock({ block, T }) {
  if (!block) return null;
  return (
    <div className={T.entry}>
      {block.title ? <h3 className={T.entryTitle}>{block.title}</h3> : null}
      {block.meta ? <p className={T.entryMeta}>{block.meta}</p> : null}
      {block.desc ? block.desc.split('\n').map((p, i) => (
        p ? <p key={i} className={T.entryDesc}>{p}</p> : null
      )) : null}
      <BulletList items={block.bullets} T={T} />
      {block.extra ? <p className={T.entryExtra}>{block.extra}</p> : null}
      {block.links ? <p className={T.entryLinks}>{block.links}</p> : null}
    </div>
  );
}

function LineBlock({ block, T }) {
  if (!block.text) return null;
  return (
    <p className={T.line}>
      <span className={T.lineBullet} aria-hidden="true">• </span>
      {block.text}
      {block.url ? (
        <React.Fragment>
          {' ('}<a className={T.link} href={block.url} target="_blank" rel="noopener noreferrer">link</a>{')'}
        </React.Fragment>
      ) : null}
    </p>
  );
}

export function BlockRenderer({ block, T }) {
  if (!block) return null;
  switch (block.type) {
    case 'para': return <ParaBlock block={block} T={T} />;
    case 'skills': return <SkillsBlock block={block} T={T} />;
    case 'entry': return <EntryBlock block={block} T={T} />;
    case 'line': return <LineBlock block={block} T={T} />;
    default: return null;
  }
}

// Named per-section components (all thin wrappers over BlockRenderer).
function makeSectionComponent() {
  return function SectionComponent({ section, T }) {
    if (!section || !(section.blocks || []).length) return null;
    return (
      <ResumeSection title={section.title} T={T}>
        {section.blocks.map((b, i) => (
          <BlockRenderer key={i} block={b} T={T} />
        ))}
      </ResumeSection>
    );
  };
}

export const ResumeSummary = makeSectionComponent();
export const ResumeExperience = makeSectionComponent();
export const ResumeEducation = makeSectionComponent();
export const ResumeProjects = makeSectionComponent();
export const ResumeSkills = makeSectionComponent();
export const ResumeCertifications = makeSectionComponent();
export const ResumeAchievements = makeSectionComponent();
export const ResumeLeadership = makeSectionComponent();
export const ResumeLanguages = makeSectionComponent();
export const ResumePublications = makeSectionComponent();
export const ResumeVolunteering = makeSectionComponent();

export const SECTION_COMPONENTS = {
  summary: ResumeSummary,
  experience: ResumeExperience,
  education: ResumeEducation,
  projects: ResumeProjects,
  skills: ResumeSkills,
  certifications: ResumeCertifications,
  achievements: ResumeAchievements,
  leadership: ResumeLeadership,
  languages: ResumeLanguages,
  publications: ResumePublications,
  volunteering: ResumeVolunteering,
};

// Render every section of a doc with the matching component, in doc order.
export function renderDocSections(doc, T) {
  if (!doc || !(doc.sections || []).length) return null;
  return doc.sections.map((section) => {
    const Component = SECTION_COMPONENTS[section.key];
    if (!Component) return null;
    return <Component key={section.key} section={section} T={T} />;
  });
}
