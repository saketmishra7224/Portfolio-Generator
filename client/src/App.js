import React, { useState, useEffect } from 'react';
import Auth from './components/Auth';
import ProfileSetup from './components/ProfileSetup';
import ProfilePreview from './components/ProfilePreview';
import Success from './components/Success';
import Dashboard from './components/Dashboard';
import PortfolioPDF from './components/PortfolioPDF';
import { authService, profileService } from './services/api';
import './index.css';
import './styles.css';

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
  const [apiStatus, setApiStatus] = useState('Checking connection...');

  // Check API connection
  useEffect(() => {
    const baseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
      ? 'http://localhost:5000/api' 
      : '/api';
    
    fetch(`${baseUrl}/test`)
      .then(response => {
        if (response.ok) {
          return response.json();
        }
        throw new Error('Network response was not ok');
      })
      .then(data => {
        setApiStatus(data.message || 'Connected to API');
      })
      .catch(error => {
        console.error('API Error:', error);
        setApiStatus('Failed to connect to API. Make sure the server is running.');
      });
  }, []);

  // Check for existing token and fetch user data on app load
  useEffect(() => {
    const token = localStorage.getItem('token');
    
    const checkAuthStatus = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }
      
      try {
        // Verify token and get user data from API
        const response = await authService.getCurrentUser();
        
        if (response.success && response.data.user) {
          // Get full profile data
          setFormData({
            personalInfo: response.data.user.personalInfo || formData.personalInfo,
            education: response.data.user.education || formData.education,
            skills: response.data.user.skills || formData.skills,
            projects: response.data.user.projects || formData.projects,
            socialLinks: response.data.user.socialLinks || formData.socialLinks
          });
          
          setIsAuthenticated(true);
          
          // If user has completed profile, go to dashboard
          const hasCompletedProfile = 
            response.data.user.education && 
            response.data.user.education.college && 
            response.data.user.education.degree;
            
          if (hasCompletedProfile) {
            setStep(3); // Dashboard step
          } else {
            setStep(1); // ProfileSetup step
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
        userData.education.degree;
      
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
  };

  const nextStep = (data) => {
    console.log("Moving to next step with data:", data);
    const updatedData = {
      ...formData,
      ...data
    };
    setFormData(updatedData);
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
        return <Dashboard formData={formData} onLogout={handleLogout} updateFormData={updateFormData} onViewPortfolio={() => setStep(4)} />;
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