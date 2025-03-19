import React, { useState } from 'react';
import { FaUser, FaGraduationCap, FaCode, FaGithub, FaEdit, FaSave, FaTimes, FaFileAlt } from 'react-icons/fa';
import { profileService } from '../services/api';

const Dashboard = ({ formData, onLogout, updateFormData, onViewPortfolio }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState(formData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleEdit = () => {
    setIsEditing(true);
    setEditedData(formData);
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Check if we're using local storage mode
      const token = localStorage.getItem('token');
      if (token && token.startsWith('mock-token-')) {
        // Using local storage mode, update user data
        const currentUserEmail = localStorage.getItem('currentUserEmail');
        if (currentUserEmail) {
          const users = JSON.parse(localStorage.getItem('users') || '[]');
          
          // Create a clean copy without circular references
          const cleanData = JSON.parse(JSON.stringify({
            personalInfo: editedData.personalInfo,
            education: editedData.education,
            skills: editedData.skills,
            projects: editedData.projects,
            socialLinks: editedData.socialLinks
          }));
          
          const updatedUsers = users.map(user => 
            user.email === currentUserEmail 
              ? { ...user, ...cleanData } 
              : user
          );
          localStorage.setItem('users', JSON.stringify(updatedUsers));
          
          // Update parent component state
          if (updateFormData) {
            updateFormData(editedData);
          }
        }
      } else {
        // Using API mode
        // Update profile on backend
        const response = await profileService.updateProfile(editedData);
        
        // Update parent component state
        if (updateFormData) {
          updateFormData(editedData);
        }
      }
      
      setIsEditing(false);
      setIsLoading(false);
    } catch (err) {
      setError('Failed to save changes. Please try again.');
      setIsLoading(false);
      console.error('Error saving profile:', err);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedData(formData);
    setError(null);
  };

  const handleInputChange = (section, field, value) => {
    setEditedData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleSkillChange = (index, value) => {
    setEditedData(prev => ({
      ...prev,
      skills: prev.skills.map((skill, i) => i === index ? value : skill)
    }));
  };

  const handleProjectChange = (index, field, value) => {
    setEditedData(prev => ({
      ...prev,
      projects: prev.projects.map((project, i) => 
        i === index ? { ...project, [field]: value } : project
      )
    }));
  };

  const { personalInfo, education, skills, projects, socialLinks } = editedData;
  
  // Calculate stats for the dashboard
  const totalProjects = projects.length;
  const totalSkills = skills.length;
  
  // Get first letter of name for profile image placeholder
  const nameInitial = personalInfo.name ? personalInfo.name.charAt(0).toUpperCase() : '?';

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Manage Your Portfolio</h1>
        <div className="dashboard-actions">
          <button onClick={handleEdit} className="edit-btn" disabled={isLoading || isEditing}>
            <FaEdit /> Edit Details
          </button>
          <button onClick={onViewPortfolio} className="view-portfolio-btn">
            <FaFileAlt /> View Portfolio
          </button>
          <button onClick={onLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        {error && <div className="error-message">{error}</div>}
        
        <div className="dashboard-grid">
          {/* Profile Summary Card */}
          <div className="dashboard-card">
            <h3>Profile Summary</h3>
            <div className="profile-summary">
              <div className="profile-image">
                {nameInitial}
              </div>
              <div className="profile-info">
                <h3>{personalInfo.name}</h3>
                <p className="profile-title">{education.degree}</p>
                <p className="profile-location">{education.college}</p>
              </div>
            </div>
          </div>

          {/* Stats Card */}
          <div className="dashboard-card">
            <h3>Portfolio Stats</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-value">{totalProjects}</span>
                <span className="stat-label">Projects</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{totalSkills}</span>
                <span className="stat-label">Skills</span>
              </div>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="dashboard-card">
            <h3>Quick Actions</h3>
            <div className="action-buttons">
              <button onClick={onViewPortfolio} className="action-btn view-btn">
                <FaFileAlt className="action-icon" />
                View Portfolio
              </button>
              {socialLinks.github && (
                <a 
                  href={socialLinks.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="action-btn"
                >
                  <FaGithub className="action-icon" />
                  Visit GitHub
                </a>
              )}
            </div>
          </div>

          {/* Recent Projects Card */}
          <div className="dashboard-card recent-projects">
            <h3>Recent Projects</h3>
            {projects.length > 0 ? (
              <div className="projects-list">
                {projects.map((project, index) => (
                  <div key={index} className="project-item">
                    <h4>{project.title}</h4>
                    <p className="project-tech">{project.technologies}</p>
                    <p className="project-desc">{project.description}</p>
                    {project.link && (
                      <a 
                        href={project.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="project-link"
                      >
                        View Project
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-projects">No projects added yet</p>
            )}
          </div>
        </div>

        {/* Personal Information Section */}
        <div className="dashboard-section">
          <div className="section-header">
            <FaUser className="section-icon" />
            <h2>Personal Information</h2>
          </div>
          {isEditing ? (
            <div className="edit-form">
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={personalInfo.name}
                  onChange={(e) => handleInputChange('personalInfo', 'name', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={personalInfo.email}
                  onChange={(e) => handleInputChange('personalInfo', 'email', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  value={personalInfo.phone}
                  onChange={(e) => handleInputChange('personalInfo', 'phone', e.target.value)}
                />
              </div>
            </div>
          ) : (
            <div className="info-content">
              <p><strong>Name:</strong> {personalInfo.name}</p>
              <p><strong>Email:</strong> {personalInfo.email}</p>
              <p><strong>Phone:</strong> {personalInfo.phone}</p>
            </div>
          )}
        </div>

        {/* Education Section */}
        <div className="dashboard-section">
          <div className="section-header">
            <FaGraduationCap className="section-icon" />
            <h2>Education</h2>
          </div>
          {isEditing ? (
            <div className="edit-form">
              <div className="form-group">
                <label>College</label>
                <input
                  type="text"
                  value={education.college}
                  onChange={(e) => handleInputChange('education', 'college', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Degree</label>
                <input
                  type="text"
                  value={education.degree}
                  onChange={(e) => handleInputChange('education', 'degree', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Specialization</label>
                <input
                  type="text"
                  value={education.specialization}
                  onChange={(e) => handleInputChange('education', 'specialization', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>CGPA</label>
                <input
                  type="text"
                  value={education.cgpa}
                  onChange={(e) => handleInputChange('education', 'cgpa', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Summary</label>
                <textarea
                  value={education.summary}
                  onChange={(e) => handleInputChange('education', 'summary', e.target.value)}
                />
              </div>
            </div>
          ) : (
            <div className="info-content">
              <p><strong>College:</strong> {education.college}</p>
              <p><strong>Degree:</strong> {education.degree}</p>
              <p><strong>Specialization:</strong> {education.specialization}</p>
              <p><strong>CGPA:</strong> {education.cgpa}</p>
              <p><strong>Summary:</strong> {education.summary}</p>
            </div>
          )}
        </div>

        {/* Skills Section */}
        <div className="dashboard-section">
          <div className="section-header">
            <FaCode className="section-icon" />
            <h2>Skills</h2>
          </div>
          {isEditing ? (
            <div className="edit-form">
              {skills.map((skill, index) => (
                <div key={index} className="form-group">
                  <input
                    type="text"
                    value={skill}
                    onChange={(e) => handleSkillChange(index, e.target.value)}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="skills-grid">
              {skills.map((skill, index) => (
                <span key={index} className="skill-tag">{skill}</span>
              ))}
            </div>
          )}
        </div>

        {/* Projects Section */}
        <div className="dashboard-section">
          <div className="section-header">
            <FaCode className="section-icon" />
            <h2>Projects</h2>
          </div>
          {isEditing ? (
            <div className="edit-form">
              {projects.map((project, index) => (
                <div key={index} className="project-edit">
                  <div className="form-group">
                    <label>Title</label>
                    <input
                      type="text"
                      value={project.title}
                      onChange={(e) => handleProjectChange(index, 'title', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Technologies</label>
                    <input
                      type="text"
                      value={project.technologies}
                      onChange={(e) => handleProjectChange(index, 'technologies', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      value={project.description}
                      onChange={(e) => handleProjectChange(index, 'description', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Link</label>
                    <input
                      type="url"
                      value={project.link}
                      onChange={(e) => handleProjectChange(index, 'link', e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="projects-grid">
              {projects.map((project, index) => (
                <div key={index} className="project-card">
                  <h3>{project.title}</h3>
                  <p className="technologies">{project.technologies}</p>
                  <p className="description">{project.description}</p>
                  {project.link && (
                    <a href={project.link} target="_blank" rel="noopener noreferrer" className="project-link">
                      View Project
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* GitHub Section */}
        <div className="dashboard-section">
          <div className="section-header">
            <FaGithub className="section-icon" />
            <h2>GitHub Profile</h2>
          </div>
          {isEditing ? (
            <div className="edit-form">
              <div className="form-group">
                <label>GitHub Link</label>
                <input
                  type="url"
                  value={socialLinks.github}
                  onChange={(e) => handleInputChange('socialLinks', 'github', e.target.value)}
                />
              </div>
            </div>
          ) : (
            <div className="info-content">
              {socialLinks.github ? (
                <a href={socialLinks.github} target="_blank" rel="noopener noreferrer" className="github-link">
                  View GitHub Profile
                </a>
              ) : (
                <p>No GitHub profile linked</p>
              )}
            </div>
          )}
        </div>

        {isEditing && (
          <div className="edit-actions">
            <button onClick={handleSave} className="save-btn" disabled={isLoading}>
              <FaSave /> {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
            <button onClick={handleCancel} className="cancel-btn" disabled={isLoading}>
              <FaTimes /> Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard; 