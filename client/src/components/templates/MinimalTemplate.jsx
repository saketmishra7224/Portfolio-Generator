import React from 'react';
import { ResumeHeader, renderDocSections } from './shared/ResumeBlocks';
import { THEME_MINIMAL } from './themes';
import { buildAtsDocument } from '../../utils/atsDocument';
import './templates.css';

// MINIMAL — whitespace, elegant serif/sans pairing, simple hierarchy.
// Same resume data as every other template; only the skin differs.
const MinimalTemplate = ({ formData, themeStyles }) => {
  const doc = buildAtsDocument(formData, { dateStyle: 'short' });
  return (
    <div className={THEME_MINIMAL.root} style={themeStyles}>
      <ResumeHeader doc={doc} T={THEME_MINIMAL} />
      {renderDocSections(doc, THEME_MINIMAL)}
    </div>
  );
};

export default MinimalTemplate;
