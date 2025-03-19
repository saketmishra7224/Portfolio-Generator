import React, { useState, useEffect } from 'react';
import { FaArrowLeft, FaArrowRight, FaPlus, FaTrash } from 'react-icons/fa';
import { profileService } from '../services/api';

const ProfileSetup = ({ formData, onNext }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [localFormData, setLocalFormData] = useState(formData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Update local form data when props change
  useEffect(() => {
    setLocalFormData(formData);
  }, [formData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [section, field] = name.split('.');
      setLocalFormData({
        ...localFormData,
        [section]: {
          ...localFormData[section],
          [field]: value
        }
      });
    } else {
      setLocalFormData({
        ...localFormData,
        [name]: value
      });
    }
  };

  const addSkill = () => {
    setLocalFormData({
      ...localFormData,
      skills: [...localFormData.skills, '']
    });
  };

  const removeSkill = (index) => {
    setLocalFormData({
      ...localFormData,
      skills: localFormData.skills.filter((_, i) => i !== index)
    });
  };

  const handleSkillChange = (index, value) => {
    setLocalFormData({
      ...localFormData,
      skills: localFormData.skills.map((skill, i) => (i === index ? value : skill))
    });
  };

  const addProject = () => {
    setLocalFormData({
      ...localFormData,
      projects: [
        ...localFormData.projects,
        {
          title: '',
          technologies: '',
          description: '',
          link: ''
        }
      ]
    });
  };

  const removeProject = (index) => {
    setLocalFormData({
      ...localFormData,
      projects: localFormData.projects.filter((_, i) => i !== index)
    });
  };

  const handleProjectChange = (index, field, value) => {
    setLocalFormData({
      ...localFormData,
      projects: localFormData.projects.map((project, i) =>
        i === index ? { ...project, [field]: value } : project
      )
    });
  };

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Check if we're using local storage mode
      const token = localStorage.getItem('token');
      if (token && token.startsWith('mock-token-')) {
        // Using local storage mode, update user data
        const currentUserEmail = localStorage.getItem('currentUserEmail');
        if (currentUserEmail) {
          const users = JSON.parse(localStorage.getItem('users') || '[]');
          
          // Create a clean copy without circular references
          const cleanData = JSON.parse(JSON.stringify({
            personalInfo: localFormData.personalInfo,
            education: localFormData.education,
            skills: localFormData.skills,
            projects: localFormData.projects,
            socialLinks: localFormData.socialLinks
          }));
          
          const updatedUsers = users.map(user => 
            user.email === currentUserEmail 
              ? { ...user, ...cleanData } 
              : user
          );
          localStorage.setItem('users', JSON.stringify(updatedUsers));
          
          // Move to the next step in the parent component
          onNext(localFormData);
        }
      } else {
        // Using API mode
        // Save the profile data to the backend
        await profileService.updateProfile(localFormData);
        
        // Move to the next step in the parent component
        onNext(localFormData);
      }
    } catch (err) {
      console.error('Error saving profile:', err);
      setError('Failed to save profile data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderFormStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <>
            <h2>Personal Information</h2>
            <div className="form-row">
              <div className="form-col">
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    name="personalInfo.name"
                    value={localFormData.personalInfo.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              <div className="form-col">
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="personalInfo.email"
                    value={localFormData.personalInfo.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
            </div>
            <div className="form-row">
              <div className="form-col">
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    name="personalInfo.phone"
                    value={localFormData.personalInfo.phone}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
            </div>
          </>
        );
      case 2:
        return (
          <>
            <h2>Education & Skills</h2>
            <div className="form-row">
              <div className="form-col">
                <div className="form-group">
                  <label>College/University</label>
                  <input
                    type="text"
                    name="education.college"
                    value={localFormData.education.college}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              <div className="form-col">
                <div className="form-group">
                  <label>Degree</label>
                  <input
                    type="text"
                    name="education.degree"
                    value={localFormData.education.degree}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
            </div>
            <div className="form-row">
              <div className="form-col">
                <div className="form-group">
                  <label>Specialization</label>
                  <input
                    type="text"
                    name="education.specialization"
                    value={localFormData.education.specialization}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              <div className="form-col">
                <div className="form-group">
                  <label>CGPA</label>
                  <input
                    type="text"
                    name="education.cgpa"
                    value={localFormData.education.cgpa}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
            </div>
            <div className="form-row">
              <div className="form-col">
                <div className="form-group">
                  <label>Summary</label>
                  <textarea
                    name="education.summary"
                    value={localFormData.education.summary}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
            </div>
            <div className="form-group">
              <label>Skills</label>
              <div className="skills-container">
                {localFormData.skills.map((skill, index) => (
                  <div key={index} className="skill-item">
                    <input
                      type="text"
                      value={skill}
                      onChange={(e) => handleSkillChange(index, e.target.value)}
                      placeholder="Enter skill"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => removeSkill(index)}
                    >
                      <FaTrash />
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="add-skill-btn"
                onClick={addSkill}
              >
                <FaPlus /> Add Skill
              </button>
            </div>
          </>
        );
      case 3:
        return (
          <>
            <h2>Projects & GitHub</h2>
            <div className="projects-container">
              {localFormData.projects.map((project, index) => (
                <div key={index} className="project-item">
                  <div className="project-header">
                    <h3>{project.title || `Project ${index + 1}`}</h3>
                    <button
                      type="button"
                      className="remove-btn"
                      onClick={() => removeProject(index)}
                    >
                      <FaTrash />
                    </button>
                  </div>
                  <div className="form-row">
                    <div className="form-col">
                      <div className="form-group">
                        <label>Project Title</label>
                        <input
                          type="text"
                          value={project.title}
                          onChange={(e) =>
                            handleProjectChange(index, 'title', e.target.value)
                          }
                          required
                        />
                      </div>
                    </div>
                    <div className="form-col">
                      <div className="form-group">
                        <label>Technologies Used</label>
                        <input
                          type="text"
                          value={project.technologies}
                          onChange={(e) =>
                            handleProjectChange(index, 'technologies', e.target.value)
                          }
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      value={project.description}
                      onChange={(e) =>
                        handleProjectChange(index, 'description', e.target.value)
                      }
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Project Link (optional)</label>
                    <input
                      type="url"
                      value={project.link}
                      onChange={(e) =>
                        handleProjectChange(index, 'link', e.target.value)
                      }
                    />
                  </div>
                </div>
              ))}
              <button
                type="button"
                className="add-project-btn"
                onClick={addProject}
              >
                <FaPlus /> Add Project
              </button>
            </div>
            <div className="form-group">
              <label>GitHub Profile URL (optional)</label>
              <input
                type="url"
                name="socialLinks.github"
                value={localFormData.socialLinks.github}
                onChange={handleInputChange}
              />
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="profile-setup-container">
      <div className="profile-setup-header">
        <h1>Set Up Your Portfolio</h1>
        <p>Complete these steps to create your professional portfolio</p>
        <div className="progress-container">
          <div 
            className="progress-bar" 
            style={{ width: `${(currentStep / 3) * 100}%` }}
          ></div>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={(e) => e.preventDefault()}>
        <div className="form-section">
          {renderFormStep()}
        </div>

        <div className="profile-setup-nav">
          {currentStep > 1 && (
            <button
              type="button"
              className="nav-btn back-btn"
              onClick={prevStep}
            >
              <FaArrowLeft /> Back
            </button>
          )}
          {currentStep < 3 ? (
            <button
              type="button"
              className="nav-btn next-btn"
              onClick={nextStep}
            >
              Next <FaArrowRight />
            </button>
          ) : (
            <button
              type="button"
              className="nav-btn next-btn"
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Review Portfolio'} <FaArrowRight />
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default ProfileSetup; 