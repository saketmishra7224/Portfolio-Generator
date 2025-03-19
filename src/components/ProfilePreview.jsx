import React from 'react';

const ProfilePreview = ({ formData, onConfirm, onEdit }) => {
  const { personalInfo, education, skills, projects, socialLinks } = formData;

  return (
    <div className="profile-preview-container">
      <div className="profile-preview-content">
        <h2>Preview Your Portfolio</h2>
        <p className="subtitle">Review your information before finalizing</p>
        
        <div className="preview-content">
          {/* Personal Info Section */}
          <div className="preview-section">
            <h3>Personal Information</h3>
            <div className="preview-grid">
              <div className="preview-item">
                <span className="preview-label">Name:</span>
                <span className="preview-value">{personalInfo.name}</span>
              </div>
              <div className="preview-item">
                <span className="preview-label">Email:</span>
                <span className="preview-value">{personalInfo.email}</span>
              </div>
              <div className="preview-item">
                <span className="preview-label">Phone:</span>
                <span className="preview-value">{personalInfo.phone}</span>
              </div>
            </div>
          </div>
          
          {/* Education Section */}
          <div className="preview-section">
            <h3>Education</h3>
            <div className="preview-card">
              <div className="preview-item">
                <span className="preview-label">College:</span>
                <span className="preview-value">{education.college}</span>
              </div>
              <div className="preview-item">
                <span className="preview-label">Degree:</span>
                <span className="preview-value">{education.degree}</span>
              </div>
              <div className="preview-item">
                <span className="preview-label">Specialization:</span>
                <span className="preview-value">{education.specialization}</span>
              </div>
              <div className="preview-item">
                <span className="preview-label">CGPA:</span>
                <span className="preview-value">{education.cgpa}</span>
              </div>
              <div className="preview-item full-width">
                <span className="preview-label">Professional Summary:</span>
                <span className="preview-value bio">{education.summary}</span>
              </div>
            </div>
          </div>
          
          {/* Skills Section */}
          <div className="preview-section">
            <h3>Skills</h3>
            <div className="skills-preview">
              {skills.map((skill, index) => (
                <span key={index} className="skill-tag">{skill}</span>
              ))}
            </div>
          </div>
          
          {/* Projects Section */}
          <div className="preview-section">
            <h3>Projects</h3>
            <div className="preview-grid">
              {projects.map((project, index) => (
                <div key={index} className="preview-card">
                  <h4>{project.title}</h4>
                  <p className="preview-tech">{project.technologies}</p>
                  <p className="preview-description">{project.description}</p>
                  {project.link && (
                    <a href={project.link} target="_blank" rel="noopener noreferrer" className="preview-link">
                      View Project
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* Social Links Section */}
          <div className="preview-section">
            <h3>Social Links</h3>
            <div className="preview-card">
              {socialLinks.github && (
                <a 
                  href={socialLinks.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="preview-link"
                >
                  GitHub Profile
                </a>
              )}
            </div>
          </div>
        </div>
        
        <div className="preview-actions">
          <button onClick={onEdit} className="preview-btn edit-btn">
            Edit Information
          </button>
          <button onClick={onConfirm} className="preview-btn confirm-btn">
            Confirm & Submit
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePreview; 