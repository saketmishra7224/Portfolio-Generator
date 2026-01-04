import React from 'react';
import ContactInfo from './shared/ContactInfo';
import EducationSection from './shared/EducationSection';
import SkillsList from './shared/SkillsList';
import ProjectsList from './shared/ProjectsList';
import { FaBriefcase, FaGraduationCap, FaCode, FaLaptopCode } from 'react-icons/fa';

const ProfessionalTemplate = ({ formData, themeStyles }) => {
  const { personalInfo, education, skills, projects, socialLinks } = formData;

  return (
    <div className="template-professional" style={themeStyles}>
      {/* Header with accent bar */}
      <div className="professional-header">
        <div className="accent-bar"></div>
        <div className="header-content">
          <h1 className="professional-name">{personalInfo.name}</h1>
          <p className="professional-role">{education.degree}</p>
          <ContactInfo personalInfo={personalInfo} socialLinks={socialLinks} variant="header" />
        </div>
      </div>

      {/* Summary Section */}
      {education.summary && (
        <div className="professional-section">
          <div className="section-header">
            <FaBriefcase className="section-icon" />
            <h2>Professional Summary</h2>
          </div>
          <p className="professional-summary">{education.summary}</p>
        </div>
      )}

      {/* Education Section */}
      <div className="professional-section">
        <div className="section-header">
          <FaGraduationCap className="section-icon" />
          <h2>Education</h2>
        </div>
        <EducationSection education={education} variant="compact" />
      </div>

      {/* Skills Section */}
      {skills && skills.length > 0 && (
        <div className="professional-section">
          <div className="section-header">
            <FaCode className="section-icon" />
            <h2>Core Competencies</h2>
          </div>
          <SkillsList skills={skills} variant="grid" />
        </div>
      )}

      {/* Projects Section */}
      {projects && projects.length > 0 && (
        <div className="professional-section">
          <div className="section-header">
            <FaLaptopCode className="section-icon" />
            <h2>Key Projects</h2>
          </div>
          <ProjectsList projects={projects} variant="detailed" />
        </div>
      )}
    </div>
  );
};

export default ProfessionalTemplate;
