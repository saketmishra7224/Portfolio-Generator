import React from 'react';
import ContactInfo from './shared/ContactInfo';
import EducationSection from './shared/EducationSection';
import SkillsList from './shared/SkillsList';
import ProjectsList from './shared/ProjectsList';

const ClassicTemplate = ({ formData, themeStyles }) => {
  const { personalInfo, education, skills, projects, socialLinks } = formData;

  return (
    <div className="template-classic" style={themeStyles}>
      {/* Header */}
      <div className="classic-header">
        <h1 className="classic-name">{personalInfo.name}</h1>
        <div className="classic-divider"></div>
        <p className="classic-subtitle">{education.degree} | {education.specialization}</p>
        <ContactInfo personalInfo={personalInfo} socialLinks={socialLinks} variant="header" />
      </div>

      {/* Summary */}
      {education.summary && (
        <div className="classic-section">
          <h2 className="classic-section-title">Professional Summary</h2>
          <p className="classic-summary">{education.summary}</p>
        </div>
      )}

      {/* Education */}
      <div className="classic-section">
        <h2 className="classic-section-title">Education</h2>
        <EducationSection education={education} variant="detailed" />
      </div>

      {/* Skills */}
      {skills && skills.length > 0 && (
        <div className="classic-section">
          <h2 className="classic-section-title">Technical Skills</h2>
          <SkillsList skills={skills} variant="grid" />
        </div>
      )}

      {/* Projects */}
      {projects && projects.length > 0 && (
        <div className="classic-section">
          <h2 className="classic-section-title">Projects</h2>
          <ProjectsList projects={projects} variant="detailed" />
        </div>
      )}
    </div>
  );
};

export default ClassicTemplate;
