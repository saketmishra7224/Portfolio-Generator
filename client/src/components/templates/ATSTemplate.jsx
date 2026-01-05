import React from 'react';

/**
 * ATS-Optimized Template
 * Follows strict ATS compliance rules:
 * - Single column layout
 * - No icons, images, or graphics
 * - Standard fonts only (Arial)
 * - Black text on white background
 * - Semantic HTML structure
 * - No tables or multi-column layouts
 */
const ATSTemplate = ({ formData }) => {
  const { personalInfo, education, skills, projects, socialLinks } = formData;

  // Helper to validate and format data
  const formatPhone = (phone) => phone || '';
  const formatEmail = (email) => email || '';
  const formatGithub = (github) => github ? github.replace('https://', '').replace('http://', '') : '';

  return (
    <div className="ats-template">
      {/* Header Section */}
      <header className="ats-header">
        <h1 className="ats-name">{personalInfo.name || 'Your Name'}</h1>
        <p className="ats-contact">
          {formatEmail(personalInfo.email)}
          {personalInfo.phone && ` | ${formatPhone(personalInfo.phone)}`}
          {socialLinks?.github && ` | ${formatGithub(socialLinks.github)}`}
        </p>
      </header>

      {/* Professional Summary */}
      {(personalInfo.bio || personalInfo.tagline || education.summary) && (
        <section className="ats-section">
          <h2 className="ats-section-title">PROFESSIONAL SUMMARY</h2>
          <p className="ats-text">
            {personalInfo.bio || personalInfo.tagline || education.summary || 
             'Passionate developer with expertise in building modern web applications.'}
          </p>
        </section>
      )}

      {/* Skills Section */}
      {skills && skills.length > 0 && (
        <section className="ats-section">
          <h2 className="ats-section-title">TECHNICAL SKILLS</h2>
          <p className="ats-text ats-skills">
            {skills.join(' • ')}
          </p>
        </section>
      )}

      {/* Projects Section */}
      {projects && projects.length > 0 && (
        <section className="ats-section">
          <h2 className="ats-section-title">PROJECTS</h2>
          {projects.map((project, index) => (
            <div key={index} className="ats-project">
              <h3 className="ats-project-title">{project.title || 'Project Title'}</h3>
              
              {project.technologies && (
                <p className="ats-text ats-tech">
                  <strong>Technologies:</strong> {project.technologies}
                </p>
              )}
              
              {project.description && (
                <p className="ats-text">{project.description}</p>
              )}
              
              {project.link && (
                <p className="ats-text">
                  <strong>Link:</strong> {project.link.replace('https://', '').replace('http://', '')}
                </p>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Education Section */}
      {education && (education.college || education.degree) && (
        <section className="ats-section">
          <h2 className="ats-section-title">EDUCATION</h2>
          <div className="ats-education">
            {education.degree && (
              <p className="ats-text">
                <strong>{education.degree}</strong>
                {education.specialization && ` in ${education.specialization}`}
              </p>
            )}
            {education.college && (
              <p className="ats-text">{education.college}</p>
            )}
            {education.cgpa && (
              <p className="ats-text">CGPA: {education.cgpa}</p>
            )}
          </div>
        </section>
      )}
    </div>
  );
};

export default ATSTemplate;
