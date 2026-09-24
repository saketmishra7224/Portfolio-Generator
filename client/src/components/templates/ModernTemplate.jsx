import React from 'react';
import { ResumeHeader, renderDocSections } from './shared/ResumeBlocks';
import { THEME_MODERN } from './themes';
import { buildAtsDocument } from '../../utils/atsDocument';
import './templates.css';

// MODERN — contemporary layout, subtle accent band + avatar, strong section
// hierarchy. Optimized for presentation. Same resume data as all templates.
const ModernTemplate = ({ formData, themeStyles }) => {
  const doc = buildAtsDocument(formData, { dateStyle: 'short' });
  return (
    <div className={THEME_MODERN.root} style={themeStyles}>
      <ResumeHeader doc={doc} T={THEME_MODERN} />
      {renderDocSections(doc, THEME_MODERN)}
    </div>
  );
};

export default ModernTemplate;
