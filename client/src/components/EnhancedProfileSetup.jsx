import React, { useState, useEffect } from 'react';
import { FaUser, FaEnvelope, FaPhone, FaGraduationCap, FaCode, FaProjectDiagram, FaPlus, FaTrash, FaGithub, FaQuoteLeft } from 'react-icons/fa';
import FormField from './FormField';
import { profileService } from '../services/api';

const EnhancedProfileSetup = ({ formData, onNext, hideNavigation, showOnlyEducation, showOnlySkillsProjects }) => {
  const [localFormData, setLocalFormData] = useState(formData);
  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    setLocalFormData(formData);
  }, [formData]);

  // Validation rules
  const validate = (name, value) => {
    const validations = {
      'personalInfo.name': {
        required: 'Name is required',
        minLength: { value: 2, message: 'Name must be at least 2 characters' },
        pattern: { value: /^[a-zA-Z\s]+$/, message: 'Name can only contain letters and spaces' }
      },
      'personalInfo.email': {
        required: 'Email is required',
        pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Please enter a valid email address' }
      },
      'personalInfo.phone': {
        required: 'Phone number is required',
        pattern: { value: /^[0-9+\-\s()]{10,}$/, message: 'Please enter a valid phone number (min 10 digits)' }
      },
      'personalInfo.bio': {
        maxLength: { value: 500, message: 'Bio must be less than 500 characters' }
      },
      'personalInfo.tagline': {
        maxLength: { value: 100, message: 'Tagline must be less than 100 characters' }
      },
      'education.college': {
        required: 'College/University is required',
        minLength: { value: 3, message: 'College name must be at least 3 characters' }
      },
      'education.degree': {
        required: 'Degree is required'
      },
      'education.cgpa': {
        pattern: { value: /^([0-9]|10)(\.[0-9]{1,2})?$/, message: 'CGPA must be between 0 and 10' }
      },
      'socialLinks.github': {
        pattern: { value: /^(https?:\/\/)?(www\.)?github\.com\/[a-zA-Z0-9_-]+\/?$/, message: 'Please enter a valid GitHub profile URL' }
      }
    };

    const rules = validations[name];
    if (!rules) return null;

    // Required validation
    if (rules.required && (!value || value.trim() === '')) {
      return rules.required;
    }

    // Min length validation
    if (rules.minLength && value && value.length < rules.minLength.value) {
      return rules.minLength.message;
    }

    // Max length validation
    if (rules.maxLength && value && value.length > rules.maxLength.value) {
      return rules.maxLength.message;
    }

    // Pattern validation
    if (rules.pattern && value && !rules.pattern.value.test(value)) {
      return rules.pattern.message;
    }

    return null;
  };

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

    // Validate on change if already touched
    if (touched[name]) {
      const error = validate(name, value);
      setErrors({ ...errors, [name]: error });
    }
  };

  const handleBlur = (name, value) => {
    setTouched({ ...touched, [name]: true });
    const error = validate(name, value);
    setErrors({ ...errors, [name]: error });
  };

  const addSkill = () => {
    if (localFormData.skills.length >= 20) {
      alert('Maximum 20 skills allowed');
      return;
    }
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
    if (localFormData.projects.length >= 10) {
      alert('Maximum 10 projects allowed');
      return;
    }
    setLocalFormData({
      ...localFormData,
      projects: [
        ...localFormData.projects,
        { title: '', technologies: '', description: '', link: '' }
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

  const validateForm = () => {
    const newErrors = {};
    const requiredFields = [
      'personalInfo.name',
      'personalInfo.email',
      'personalInfo.phone',
      'education.college',
      'education.degree'
    ];

    requiredFields.forEach(field => {
      const [section, key] = field.split('.');
      const value = localFormData[section][key];
      const error = validate(field, value);
      if (error) {
        newErrors[field] = error;
      }
    });

    setErrors(newErrors);
    setTouched(requiredFields.reduce((acc, field) => ({ ...acc, [field]: true }), {}));

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!validateForm()) {
      alert('Please fix the errors before continuing');
      return;
    }

    setIsLoading(true);
    
    try {
      await profileService.updateProfile(localFormData);
      
      setShowSuccess(true);
      setTimeout(() => {
        onNext(localFormData);
      }, 800);
    } catch (err) {
      console.error('Error saving profile:', err);
      alert('Failed to save profile data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (showOnlyEducation) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="College/University"
            name="education.college"
            value={localFormData.education.college}
            onChange={handleInputChange}
            onBlur={(e) => handleBlur('education.college', e.target.value)}
            error={errors['education.college']}
            touched={touched['education.college']}
            required
            placeholder="e.g., MIT, Stanford University"
            helperText="Full name of your institution"
            icon={<FaGraduationCap />}
          />
          <FormField
            label="Degree"
            name="education.degree"
            value={localFormData.education.degree}
            onChange={handleInputChange}
            onBlur={(e) => handleBlur('education.degree', e.target.value)}
            error={errors['education.degree']}
            touched={touched['education.degree']}
            required
            placeholder="e.g., Bachelor of Science"
            icon={<FaGraduationCap />}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Specialization"
            name="education.specialization"
            value={localFormData.education.specialization}
            onChange={handleInputChange}
            placeholder="e.g., Computer Science"
          />
          <FormField
            label="CGPA/Percentage"
            name="education.cgpa"
            value={localFormData.education.cgpa}
            onChange={handleInputChange}
            onBlur={(e) => handleBlur('education.cgpa', e.target.value)}
            error={errors['education.cgpa']}
            touched={touched['education.cgpa']}
            placeholder="e.g., 8.5 or 85%"
            helperText="Out of 10 or percentage"
          />
        </div>
        <FormField
          label="Summary"
          name="education.summary"
          type="textarea"
          rows={4}
          value={localFormData.education.summary}
          onChange={handleInputChange}
          placeholder="Brief description of your academic achievements..."
          maxLength={300}
        />
      </div>
    );
  }

  if (showOnlySkillsProjects) {
    return (
      <div className="space-y-8">
        {/* Skills Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FaCode className="text-blue-600" />
              Skills
            </h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {localFormData.skills.length}/20
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            {localFormData.skills.map((skill, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={skill}
                  onChange={(e) => handleSkillChange(index, e.target.value)}
                  placeholder="e.g., React, Python, AWS"
                  maxLength={50}
                  className="flex-1 px-4 py-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 text-gray-900 dark:text-gray-100"
                />
                <button
                  type="button"
                  onClick={() => removeSkill(index)}
                  className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors duration-200"
                >
                  <FaTrash />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addSkill}
            disabled={localFormData.skills.length >= 20}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg flex items-center gap-2 transition-colors duration-200"
          >
            <FaPlus /> Add Skill
          </button>
        </div>

        {/* Projects Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FaProjectDiagram className="text-purple-600" />
              Projects
            </h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {localFormData.projects.length}/10
            </span>
          </div>
          <div className="space-y-4 mb-4">
            {localFormData.projects.map((project, index) => (
              <div key={index} className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold text-gray-900 dark:text-white">Project {index + 1}</h4>
                  <button
                    type="button"
                    onClick={() => removeProject(index)}
                    className="text-red-500 hover:text-red-700 transition-colors duration-200"
                  >
                    <FaTrash />
                  </button>
                </div>
                <input
                  type="text"
                  value={project.title}
                  onChange={(e) => handleProjectChange(index, 'title', e.target.value)}
                  placeholder="Project Title"
                  maxLength={100}
                  className="w-full px-4 py-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-blue-500 focus:outline-none text-gray-900 dark:text-gray-100"
                />
                <input
                  type="text"
                  value={project.technologies}
                  onChange={(e) => handleProjectChange(index, 'technologies', e.target.value)}
                  placeholder="Technologies Used (e.g., React, Node.js, MongoDB)"
                  maxLength={200}
                  className="w-full px-4 py-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-blue-500 focus:outline-none text-gray-900 dark:text-gray-100"
                />
                <textarea
                  value={project.description}
                  onChange={(e) => handleProjectChange(index, 'description', e.target.value)}
                  placeholder="Project Description"
                  rows={3}
                  maxLength={500}
                  className="w-full px-4 py-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-blue-500 focus:outline-none text-gray-900 dark:text-gray-100"
                />
                <input
                  type="url"
                  value={project.link}
                  onChange={(e) => handleProjectChange(index, 'link', e.target.value)}
                  placeholder="Project Link (optional)"
                  className="w-full px-4 py-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-blue-500 focus:outline-none text-gray-900 dark:text-gray-100"
                />
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addProject}
            disabled={localFormData.projects.length >= 10}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg flex items-center gap-2 transition-colors duration-200"
          >
            <FaPlus /> Add Project
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Personal Information Section */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 p-6 rounded-xl">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <FaUser className="text-blue-600" />
          Personal Information
        </h3>
        
        <div className="space-y-4">
          <FormField
            label="Full Name"
            name="personalInfo.name"
            value={localFormData.personalInfo.name}
            onChange={handleInputChange}
            onBlur={(e) => handleBlur('personalInfo.name', e.target.value)}
            error={errors['personalInfo.name']}
            touched={touched['personalInfo.name']}
            required
            placeholder="John Doe"
            icon={<FaUser />}
            autoComplete="name"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Email"
              name="personalInfo.email"
              type="email"
              value={localFormData.personalInfo.email}
              onChange={handleInputChange}
              onBlur={(e) => handleBlur('personalInfo.email', e.target.value)}
              error={errors['personalInfo.email']}
              touched={touched['personalInfo.email']}
              required
              placeholder="john@example.com"
              icon={<FaEnvelope />}
              autoComplete="email"
            />

            <FormField
              label="Phone"
              name="personalInfo.phone"
              type="tel"
              value={localFormData.personalInfo.phone}
              onChange={handleInputChange}
              onBlur={(e) => handleBlur('personalInfo.phone', e.target.value)}
              error={errors['personalInfo.phone']}
              touched={touched['personalInfo.phone']}
              required
              placeholder="+1 234 567 8900"
              icon={<FaPhone />}
              autoComplete="tel"
            />
          </div>

          <FormField
            label="Professional Tagline"
            name="personalInfo.tagline"
            value={localFormData.personalInfo.tagline}
            onChange={handleInputChange}
            onBlur={(e) => handleBlur('personalInfo.tagline', e.target.value)}
            error={errors['personalInfo.tagline']}
            touched={touched['personalInfo.tagline']}
            placeholder="Full Stack Developer | React Enthusiast"
            helperText="A short professional headline"
            maxLength={100}
            icon={<FaQuoteLeft />}
          />

          <FormField
            label="Professional Bio"
            name="personalInfo.bio"
            type="textarea"
            rows={4}
            value={localFormData.personalInfo.bio}
            onChange={handleInputChange}
            onBlur={(e) => handleBlur('personalInfo.bio', e.target.value)}
            error={errors['personalInfo.bio']}
            touched={touched['personalInfo.bio']}
            placeholder="Tell us about yourself, your experience, and what you're passionate about..."
            helperText="Brief introduction about yourself"
            maxLength={500}
          />

          <FormField
            label="GitHub Profile"
            name="socialLinks.github"
            type="url"
            value={localFormData.socialLinks.github}
            onChange={handleInputChange}
            onBlur={(e) => handleBlur('socialLinks.github', e.target.value)}
            error={errors['socialLinks.github']}
            touched={touched['socialLinks.github']}
            placeholder="https://github.com/yourusername"
            icon={<FaGithub />}
          />
        </div>
      </div>

      {/* Submit Button */}
      {!hideNavigation && (
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className={`px-8 py-3 rounded-lg font-semibold text-white transition-all duration-200 ${
              isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
            }`}
          >
            {isLoading ? 'Saving...' : showSuccess ? '✓ Saved!' : 'Continue'}
          </button>
        </div>
      )}
    </form>
  );
};

export default EnhancedProfileSetup;
