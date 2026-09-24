import React from 'react';
import { ResumeHeader, renderDocSections } from './shared/ResumeBlocks';
import { THEME_PROFESSIONAL } from './themes';
import { buildAtsDocument } from '../../utils/atsDocument';
import './templates.css';

// PROFESSIONAL — corporate/developer-oriented: polished section headers,
// strong information density. Same resume data as all templates.
const ProfessionalTemplate = ({ formData, themeStyles }) => {
  const doc = buildAtsDocument(formData, { dateStyle: 'short' });
  return (
    <div className={THEME_PROFESSIONAL.root} style={themeStyles}>
      <ResumeHeader doc={doc} T={THEME_PROFESSIONAL} />
      {renderDocSections(doc, THEME_PROFESSIONAL)}
    </div>
  );
};

export default ProfessionalTemplate;
