import React from 'react';
import ContactInfo from './shared/ContactInfo';
import EducationSection from './shared/EducationSection';
import SkillsList from './shared/SkillsList';
import ProjectsList from './shared/ProjectsList';

const MinimalTemplate = ({ formData, themeStyles }) => {
  const { personalInfo, education, skills, projects, socialLinks } = formData;

  return (
    <div className="template-minimal" style={themeStyles}>
      {/* Header */}
      <div className="minimal-header">
        <h1 className="minimal-name">{personalInfo.name}</h1>
        <p className="minimal-title">{education.degree}</p>
        <ContactInfo personalInfo={personalInfo} socialLinks={socialLinks} variant="header" />
      </div>

      {/* Education */}
      <div className="minimal-section">
        <h2 className="section-title">Education</h2>
        <EducationSection education={education} variant="compact" />
      </div>

      {/* Skills */}
      {skills && skills.length > 0 && (
        <div className="minimal-section">
          <h2 className="section-title">Skills</h2>
          <SkillsList skills={skills} variant="badges" />
        </div>
      )}

      {/* Projects */}
      {projects && projects.length > 0 && (
        <div className="minimal-section">
          <h2 className="section-title">Projects</h2>
          <ProjectsList projects={projects} variant="compact" />
        </div>
      )}
    </div>
  );
};

export default MinimalTemplate;
