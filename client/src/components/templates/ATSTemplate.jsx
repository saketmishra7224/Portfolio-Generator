import React from 'react';
import { ResumeHeader, renderDocSections } from './shared/ResumeBlocks';
import { THEME_ATS } from './themes';
import { buildAtsDocument } from '../../utils/atsDocument';
import './templates.css';

/**
 * ATS-Optimized Template (on-screen preview).
 * Same shared blocks and same document model as the visual templates, but
 * with the parser-focused skin: single column, semantic headings, standard
 * fonts, no icons/images/chips, plain hyperlinks. The downloadable ATS PDF
 * is generated from the identical model with real selectable text.
 */
const ATSTemplate = ({ formData, dateStyle = 'short', fontFamily = 'arial' }) => {
  const doc = buildAtsDocument(formData, { dateStyle });
  const fontStack = fontFamily === 'times'
    ? 'Times New Roman, Times, serif'
    : 'Arial, Helvetica, sans-serif';

  return (
    <div className={THEME_ATS.root} style={{ fontFamily: fontStack }}>
      <ResumeHeader doc={doc} T={THEME_ATS} />
      {doc.sections.length === 0 ? (
        <p className="ats-text">Add summary, skills, experience, projects or education to build the ATS resume.</p>
      ) : (
        renderDocSections(doc, THEME_ATS)
      )}
    </div>
  );
};

export default ATSTemplate;
