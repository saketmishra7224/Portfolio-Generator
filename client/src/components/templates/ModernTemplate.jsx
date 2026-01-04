import React from 'react';
import ContactInfo from './shared/ContactInfo';
import EducationSection from './shared/EducationSection';
import SkillsList from './shared/SkillsList';
import ProjectsList from './shared/ProjectsList';

const ModernTemplate = ({ formData, themeStyles }) => {
  const { personalInfo, education, skills, projects, socialLinks } = formData;

  return (
    <div className="template-modern" style={themeStyles}>
      {/* Sidebar */}
      <div className="modern-sidebar">
        <div className="modern-profile">
          <div className="profile-avatar">
            {personalInfo.name.charAt(0).toUpperCase()}
          </div>
          <h1 className="modern-name">{personalInfo.name}</h1>
          <p className="modern-title">{education.degree}</p>
        </div>
        
        <div className="modern-contact">
          <h3>Contact</h3>
          <ContactInfo personalInfo={personalInfo} socialLinks={socialLinks} />
        </div>

        {/* Skills in sidebar */}
        {skills && skills.length > 0 && (
          <div className="modern-skills">
            <h3>Skills</h3>
            <SkillsList skills={skills} variant="list" />
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="modern-main">
        {/* Education */}
        <div className="modern-section">
          <h2 className="modern-section-title">Education</h2>
          <EducationSection education={education} variant="compact" />
        </div>

        {/* Projects */}
        {projects && projects.length > 0 && (
          <div className="modern-section">
            <h2 className="modern-section-title">Projects</h2>
            <ProjectsList projects={projects} variant="detailed" />
          </div>
        )}
      </div>
    </div>
  );
};

export default ModernTemplate;
