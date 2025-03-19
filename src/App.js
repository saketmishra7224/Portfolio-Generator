import React, { useState, useEffect } from 'react';
import Auth from './components/Auth';
import ProfileSetup from './components/ProfileSetup';
import ProfilePreview from './components/ProfilePreview';
import Success from './components/Success';
import Dashboard from './components/Dashboard';
import PortfolioPDF from './components/PortfolioPDF';
import { authService, profileService } from './services/api';
import './index.css';

function App() {
  const [formData, setFormData] = useState({
    personalInfo: {
      name: '',
      email: '',
      phone: ''
    },
    education: {
      college: '',
      degree: '',
      specialization: '',
      cgpa: '',
      summary: ''
    },
    skills: [],
    projects: [],
    socialLinks: {
      github: ''
    }
  });
  const [step, setStep] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check for existing token and fetch user data on app load
  useEffect(() => {
    const token = localStorage.getItem('token');
    
    const checkAuthStatus = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }
      
      try {
        // Check if it's a mock token for local storage mode
        if (token.startsWith('mock-token-')) {
          // Get user data from localStorage
          const users = JSON.parse(localStorage.getItem('users') || '[]');
          const currentUserEmail = localStorage.getItem('currentUserEmail');
          
          if (currentUserEmail) {
            const user = users.find(u => u.email === currentUserEmail);
            if (user) {
              console.log("Found user in localStorage:", user);
              
              // Set form data with all user information
              setFormData({
                personalInfo: user.personalInfo || formData.personalInfo,
                education: user.education || formData.education,
                skills: user.skills || formData.skills,
                projects: user.projects || formData.projects,
                socialLinks: user.socialLinks || formData.socialLinks
              });
              
              setIsAuthenticated(true);
              
              // If user has completed profile, go to dashboard
              // We check for all required fields to determine if profile is complete
              const hasCompletedProfile = 
                user.education && 
                user.education.college && 
                user.education.degree && 
                user.education.specialization;
                
              if (hasCompletedProfile) {
                setStep(3); // Dashboard step
              } else {
                setStep(1); // ProfileSetup step
              }
            }
          }
        } else {
          // Verify token and get user data from API
          const response = await authService.getCurrentUser();
          
          if (response.success && response.data.user) {
            // Get full profile data
            const profileResponse = await profileService.getProfile();
            
            if (profileResponse.success && profileResponse.data.profile) {
              // Populate form data with user profile data
              setFormData({
                personalInfo: profileResponse.data.profile.personalInfo,
                education: profileResponse.data.profile.education,
                skills: profileResponse.data.profile.skills,
                projects: profileResponse.data.profile.projects,
                socialLinks: profileResponse.data.profile.socialLinks
              });
              
              // Set authenticated and go directly to dashboard
              setIsAuthenticated(true);
              setStep(3); // Dashboard step
            }
          }
        }
      } catch (err) {
        console.error('Error checking authentication:', err);
        // Clear invalid token
        localStorage.removeItem('token');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuthStatus();
  }, []);

  const handleAuthSuccess = (userData) => {
    console.log("Auth success with user data:", userData);
    
    // Store current user email for local storage mode
    if (userData && userData.email) {
      localStorage.setItem('currentUserEmail', userData.email);
    }
    
    // If user data contains profile info, populate form
    if (userData) {
      setFormData({
        personalInfo: userData.personalInfo || formData.personalInfo,
        education: userData.education || formData.education,
        skills: userData.skills || formData.skills,
        projects: userData.projects || formData.projects,
        socialLinks: userData.socialLinks || formData.socialLinks
      });
      
      // If user already has a complete profile, go to dashboard
      const hasCompletedProfile = 
        userData.education && 
        userData.education.college && 
        userData.education.degree && 
        userData.education.specialization;
      
      if (hasCompletedProfile) {
        setStep(3); // Dashboard step
      } else {
        setStep(1); // ProfileSetup step
      }
    }
    
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUserEmail');
    setIsAuthenticated(false);
    setStep(0);
    setFormData({
      personalInfo: {
        name: '',
        email: '',
        phone: ''
      },
      education: {
        college: '',
        degree: '',
        specialization: '',
        cgpa: '',
        summary: ''
      },
      skills: [],
      projects: [],
      socialLinks: {
        github: ''
      }
    });
  };

  const updateFormData = (newData) => {
    console.log("Updating form data:", newData);
    setFormData(newData);
    
    // If using local storage mode, update user data
    const token = localStorage.getItem('token');
    if (token && token.startsWith('mock-token-')) {
      const currentUserEmail = localStorage.getItem('currentUserEmail');
      if (currentUserEmail) {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        
        // Create a clean copy without circular references
        const cleanData = JSON.parse(JSON.stringify({
          personalInfo: newData.personalInfo,
          education: newData.education,
          skills: newData.skills,
          projects: newData.projects,
          socialLinks: newData.socialLinks
        }));
        
        const updatedUsers = users.map(user => 
          user.email === currentUserEmail 
            ? { ...user, ...cleanData } 
            : user
        );
        localStorage.setItem('users', JSON.stringify(updatedUsers));
      }
    }
  };

  const nextStep = (data) => {
    console.log("Moving to next step with data:", data);
    const updatedData = {
      ...formData,
      ...data
    };
    setFormData(updatedData);
    
    // If using local storage mode, update user data
    const token = localStorage.getItem('token');
    if (token && token.startsWith('mock-token-')) {
      const currentUserEmail = localStorage.getItem('currentUserEmail');
      if (currentUserEmail) {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        
        // Create a clean copy without circular references
        const cleanData = JSON.parse(JSON.stringify({
          personalInfo: updatedData.personalInfo,
          education: updatedData.education,
          skills: updatedData.skills,
          projects: updatedData.projects,
          socialLinks: updatedData.socialLinks
        }));
        
        const updatedUsers = users.map(user => 
          user.email === currentUserEmail 
            ? { ...user, ...cleanData } 
            : user
        );
        localStorage.setItem('users', JSON.stringify(updatedUsers));
      }
    }
    
    setStep(step + 1);
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  if (isLoading) {
    return <div className="loading-container">Loading...</div>;
  }

  const renderStep = () => {
    switch (step) {
      case 0:
        return <Auth onAuthSuccess={handleAuthSuccess} />;
      case 1:
        return <ProfileSetup formData={formData} onNext={nextStep} />;
      case 2:
        return <ProfilePreview formData={formData} onBack={prevStep} onConfirm={nextStep} />;
      case 3:
        return <Dashboard formData={formData} onLogout={handleLogout} updateFormData={updateFormData} />;
      case 4:
        return <PortfolioPDF formData={formData} onBack={() => setStep(3)} />;
      case 5:
        return <Success formData={formData} onViewPortfolio={() => setStep(4)} onDashboard={() => setStep(3)} />;
      default:
        return <Auth onAuthSuccess={handleAuthSuccess} />;
    }
  };

  return (
    <div className="app">
      {error && <div className="global-error">{error}</div>}
      {renderStep()}
    </div>
  );
}

export default App; 