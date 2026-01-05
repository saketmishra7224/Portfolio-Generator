import React, { useState, useEffect } from 'react';
import { FaUser, FaGraduationCap, FaCode, FaGithub, FaEdit, FaSave, FaTimes, FaFileAlt, FaPlus, FaTrash, FaPalette, FaCamera, FaExclamationTriangle } from 'react-icons/fa';
import { profileService } from '../services/api';
import ThemeCustomizer from './ThemeCustomizer';

const Dashboard = ({ formData, onLogout, updateFormData, onViewPortfolio }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState(formData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' or 'theme'
  const [profileImage, setProfileImage] = useState(formData.personalInfo?.profileImage || null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Update profile image and editedData when formData changes (e.g., after login)
  useEffect(() => {
    setEditedData(formData);
    setProfileImage(formData.personalInfo?.profileImage || null);
  }, [formData]);

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
      // Extract error message from response if available
      let errorMessage = 'Failed to save changes. Please try again.';
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.status === 413) {
        errorMessage = 'Image file is too large. Please upload a smaller image (recommended: under 2MB).';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setIsLoading(false);
      console.error('Error saving profile:', err);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedData(formData);
    setError(null);
  };

  const handleDeleteProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Check if we're using local storage mode
      const token = localStorage.getItem('token');
      if (token && token.startsWith('mock-token-')) {
        // Using local storage mode, remove user data
        const currentUserEmail = localStorage.getItem('currentUserEmail');
        if (currentUserEmail) {
          const users = JSON.parse(localStorage.getItem('users') || '[]');
          const updatedUsers = users.filter(user => user.email !== currentUserEmail);
          localStorage.setItem('users', JSON.stringify(updatedUsers));
        }
      } else {
        // Using API mode
        await profileService.deleteProfile();
      }
      
      // Clear all local storage and logout
      localStorage.removeItem('token');
      localStorage.removeItem('currentUserEmail');
      
      setIsLoading(false);
      setShowDeleteConfirm(false);
      
      // Call logout to redirect to auth page
      if (onLogout) {
        onLogout();
      }
    } catch (err) {
      let errorMessage = 'Failed to delete profile. Please try again.';
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setIsLoading(false);
      console.error('Error deleting profile:', err);
    }
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

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }

      // Validate file size (max 2MB recommended for better performance)
      const maxSize = 2 * 1024 * 1024; // 2MB
      if (file.size > maxSize) {
        setError(`Image size should be less than 2MB. Current size: ${(file.size / (1024 * 1024)).toFixed(2)}MB`);
        return;
      }

      // Clear any previous errors
      setError(null);

      const reader = new FileReader();
      reader.onloadend = () => {
        const imageDataUrl = reader.result;
        setProfileImage(imageDataUrl);
        setEditedData(prev => ({
          ...prev,
          personalInfo: {
            ...prev.personalInfo,
            profileImage: imageDataUrl
          }
        }));
      };
      reader.onerror = () => {
        setError('Failed to read image file. Please try again.');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setProfileImage(null);
    setEditedData(prev => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        profileImage: null
      }
    }));
  };

  const handleSkillChange = (index, value) => {
    setEditedData(prev => ({
      ...prev,
      skills: prev.skills.map((skill, i) => i === index ? value : skill)
    }));
  };

  const handleAddSkill = () => {
    setEditedData(prev => ({
      ...prev,
      skills: [...prev.skills, ""]
    }));
  };

  const handleRemoveSkill = (index) => {
    setEditedData(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
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

  const handleAddProject = () => {
    setEditedData(prev => ({
      ...prev,
      projects: [...prev.projects, {
        title: "",
        technologies: "",
        description: "",
        link: ""
      }]
    }));
  };

  const handleRemoveProject = (index) => {
    setEditedData(prev => ({
      ...prev,
      projects: prev.projects.filter((_, i) => i !== index)
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
        <div className="dashboard-title">
          <h1>Manage Your Portfolio</h1>
          <p>Edit and manage your portfolio details</p>
        </div>
        <div className="dashboard-actions">
          <button onClick={handleEdit} className="action-btn edit" disabled={isLoading || isEditing}>
            <FaEdit /> Edit Details
          </button>
          <button onClick={onViewPortfolio} className="action-btn view">
            <FaFileAlt /> View Portfolio
          </button>
          <button onClick={onLogout} className="action-btn logout">
            Logout
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="dashboard-tabs">
        <button
          className={`dashboard-tab ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <FaUser /> Profile Details
        </button>
        <button
          className={`dashboard-tab ${activeTab === 'theme' ? 'active' : ''}`}
          onClick={() => setActiveTab('theme')}
        >
          <FaPalette /> Theme Customization
        </button>
      </div>

      {activeTab === 'profile' && (
        <>
          <div className="dashboard-content">
            {error && <div className="error-message">{error}</div>}
        
        <div className="main-content">
          {/* Profile Summary Card */}
          <div className="dashboard-card">
            <h2>Profile Summary</h2>
            <div className="profile-summary">
              <div className="profile-image-container">
                <div className="profile-image">
                  {profileImage ? (
                    <img src={profileImage} alt="Profile" />
                  ) : (
                    <span className="profile-initial">{nameInitial}</span>
                  )}
                </div>
                {isEditing && (
                  <div className="profile-image-actions">
                    <label htmlFor="profile-image-upload" className="upload-btn">
                      <FaCamera /> Upload Photo
                    </label>
                    <input
                      id="profile-image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      style={{ display: 'none' }}
                    />
                    {profileImage && (
                      <button 
                        type="button" 
                        className="remove-image-btn"
                        onClick={handleRemoveImage}
                      >
                        <FaTimes /> Remove
                      </button>
                    )}
                  </div>
                )}
              </div>
              <div className="profile-info">
                <h3>{personalInfo.name}</h3>
                <p>{education.degree}</p>
                <p>{education.college}</p>
              </div>
            </div>
          </div>

          {/* Personal Information Section */}
          <div className="dashboard-card">
            <h2><FaUser /> Personal Information</h2>
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
              <div className="profile-section">
                <div className="info-grid">
                  <div className="info-label">Name:</div>
                  <div className="info-value">{personalInfo.name}</div>
                  <div className="info-label">Email:</div>
                  <div className="info-value">{personalInfo.email}</div>
                  <div className="info-label">Phone:</div>
                  <div className="info-value">{personalInfo.phone}</div>
                </div>
              </div>
            )}
          </div>

          {/* Education Section */}
          <div className="dashboard-card">
            <h2><FaGraduationCap /> Education</h2>
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
              <div className="profile-section">
                <div className="info-grid">
                  <div className="info-label">College:</div>
                  <div className="info-value">{education.college}</div>
                  <div className="info-label">Degree:</div>
                  <div className="info-value">{education.degree}</div>
                  <div className="info-label">Specialization:</div>
                  <div className="info-value">{education.specialization}</div>
                  <div className="info-label">CGPA:</div>
                  <div className="info-value">{education.cgpa}</div>
                  <div className="info-label">Summary:</div>
                  <div className="info-value">{education.summary}</div>
                </div>
              </div>
            )}
          </div>

          {/* Projects Section */}
          <div className="dashboard-card">
            <h2><FaCode /> Projects</h2>
            {isEditing ? (
              <div className="edit-form">
                {projects.map((project, index) => (
                  <div key={index} className="project-item">
                    <div className="project-header">
                      <h3>Project #{index + 1}</h3>
                      <button 
                        type="button" 
                        className="action-btn edit"
                        onClick={() => handleRemoveProject(index)}
                      >
                        <FaTrash /> Remove
                      </button>
                    </div>
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
                <button 
                  type="button" 
                  className="add-project-btn"
                  onClick={handleAddProject}
                >
                  <FaPlus /> Add New Project
                </button>
              </div>
            ) : (
              <div className="projects-container">
                {projects.map((project, index) => (
                  <div key={index} className="project-item">
                    <div className="project-header">
                      <h3>{project.title}</h3>
                    </div>
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
            )}
          </div>
        </div>

        <div className="sidebar">
          {/* Stats Card */}
          <div className="dashboard-card">
            <h2>Portfolio Stats</h2>
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-number">{totalProjects}</div>
                <div className="stat-label">Projects</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">{totalSkills}</div>
                <div className="stat-label">Skills</div>
              </div>
            </div>
          </div>

          {/* Skills Section */}
          <div className="dashboard-card">
            <h2><FaCode /> Skills</h2>
            {isEditing ? (
              <div className="edit-form">
                {skills.map((skill, index) => (
                  <div key={index} className="form-group skill-edit-row">
                    <input
                      type="text"
                      value={skill}
                      onChange={(e) => handleSkillChange(index, e.target.value)}
                    />
                    <button 
                      type="button" 
                      className="remove-skill-btn"
                      onClick={() => handleRemoveSkill(index)}
                    >
                      <FaTrash />
                    </button>
                  </div>
                ))}
                <button 
                  type="button" 
                  className="add-skill-btn"
                  onClick={handleAddSkill}
                >
                  <FaPlus /> Add New Skill
                </button>
              </div>
            ) : (
              <div className="skills-container">
                {skills.map((skill, index) => (
                  <div key={index} className="skill-item">{skill}</div>
                ))}
              </div>
            )}
          </div>

          {/* GitHub Section */}
          <div className="dashboard-card">
            <h2><FaGithub /> GitHub Profile</h2>
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
              <div className="profile-section">
                {socialLinks.github ? (
                  <a href={socialLinks.github} target="_blank" rel="noopener noreferrer">
                    View GitHub Profile
                  </a>
                ) : (
                  <p>No GitHub profile linked</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {isEditing && (
        <div className="dashboard-actions">
          <button onClick={handleSave} className="primary-btn" disabled={isLoading}>
            <FaSave /> {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
          <button onClick={handleCancel} className="secondary-btn" disabled={isLoading}>
            <FaTimes /> Cancel
          </button>
        </div>
      )}
        </>
      )}

      {/* Theme Customization Tab */}
      {activeTab === 'theme' && (
        <ThemeCustomizer />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-content delete-modal">
            <div className="modal-header">
              <FaExclamationTriangle className="warning-icon" />
              <h2>Delete Profile</h2>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete your profile?</p>
              <p className="warning-text">
                This action cannot be undone. All your data including personal information, 
                projects, skills, and education will be permanently deleted.
              </p>
            </div>
            <div className="modal-actions">
              <button 
                onClick={handleDeleteProfile} 
                className="danger-btn" 
                disabled={isLoading}
              >
                <FaTrash /> {isLoading ? 'Deleting...' : 'Yes, Delete Profile'}
              </button>
              <button 
                onClick={() => setShowDeleteConfirm(false)} 
                className="secondary-btn"
                disabled={isLoading}
              >
                <FaTimes /> Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Profile Button (Fixed Position) */}
      {!isEditing && (
        <div className="danger-zone">
          <button 
            onClick={() => setShowDeleteConfirm(true)} 
            className="delete-profile-btn"
            title="Delete Profile"
          >
            <FaTrash /> Delete Profile
          </button>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 