import React from 'react';

const ProfilePreview = ({ formData, onConfirm, onBack }) => {
  const { personalInfo, education, skills, projects, socialLinks } = formData;

  return (
    <div className="profile-preview-container">
      <div className="profile-preview-header">
        <h1>Preview Your Portfolio</h1>
        <p>Review your information before finalizing</p>
      </div>
      
      {/* Personal Info Section */}
      <div className="preview-section">
        <h2>Personal Information</h2>
        <div className="preview-item">
          <h3>Name:</h3>
          <p>{personalInfo.name}</p>
        </div>
        <div className="preview-item">
          <h3>Email:</h3>
          <p>{personalInfo.email}</p>
        </div>
        <div className="preview-item">
          <h3>Phone:</h3>
          <p>{personalInfo.phone}</p>
        </div>
      </div>
      
      {/* Education Section */}
      <div className="preview-section">
        <h2>Education</h2>
        <div className="preview-item">
          <h3>College:</h3>
          <p>{education.college}</p>
        </div>
        <div className="preview-item">
          <h3>Degree:</h3>
          <p>{education.degree}</p>
        </div>
        <div className="preview-item">
          <h3>Specialization:</h3>
          <p>{education.specialization}</p>
        </div>
        <div className="preview-item">
          <h3>CGPA:</h3>
          <p>{education.cgpa}</p>
        </div>
        <div className="preview-item">
          <h3>Professional Summary:</h3>
          <p>{education.summary}</p>
        </div>
      </div>
      
      {/* Skills Section */}
      <div className="preview-section">
        <h2>Skills</h2>
        <div className="skills-preview">
          {skills.map((skill, index) => (
            <span key={index} className="skill-badge">{skill}</span>
          ))}
        </div>
      </div>
      
      {/* Projects Section */}
      <div className="preview-section">
        <h2>Projects</h2>
        {projects.map((project, index) => (
          <div key={index} className="preview-item">
            <h3>{project.title}</h3>
            <p>{project.technologies}</p>
            <p>{project.description}</p>
            {project.link && (
              <a href={project.link} target="_blank" rel="noopener noreferrer">
                View Project
              </a>
            )}
          </div>
        ))}
      </div>
      
      {/* Social Links Section */}
      <div className="preview-section">
        <h2>Social Links</h2>
        <div className="preview-item">
          {socialLinks.github && (
            <a 
              href={socialLinks.github}
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub Profile
            </a>
          )}
        </div>
      </div>
      
      <div className="preview-nav">
        <button onClick={onBack} className="nav-btn back-btn">
          Edit Information
        </button>
        <button onClick={onConfirm} className="nav-btn next-btn">
          Confirm & Submit
        </button>
      </div>
    </div>
  );
};

export default ProfilePreview; 