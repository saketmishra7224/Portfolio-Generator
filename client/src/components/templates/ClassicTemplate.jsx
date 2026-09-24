import React from 'react';
import { ResumeHeader, renderDocSections } from './shared/ResumeBlocks';
import { THEME_CLASSIC } from './themes';
import { buildAtsDocument } from '../../utils/atsDocument';
import './templates.css';

// CLASSIC — traditional resume: conservative serif typography, formal
// centered hierarchy with double rules. Same resume data as all templates.
const ClassicTemplate = ({ formData, themeStyles }) => {
  const doc = buildAtsDocument(formData, { dateStyle: 'long' });
  return (
    <div className={THEME_CLASSIC.root} style={themeStyles}>
      <ResumeHeader doc={doc} T={THEME_CLASSIC} />
      {renderDocSections(doc, THEME_CLASSIC)}
    </div>
  );
};

export default ClassicTemplate;
