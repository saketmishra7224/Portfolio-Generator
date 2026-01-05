import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import NavBar from './components/NavBar';
import Auth from './components/Auth';
import EnhancedProfileSetup from './components/EnhancedProfileSetup';
import ProfilePreview from './components/ProfilePreview';
import Success from './components/Success';
import Dashboard from './components/Dashboard';
import PortfolioPDF from './components/PortfolioPDF';
import PortfolioWizard from './components/PortfolioWizard';
import { authService, profileService } from './services/api';
import { ThemeProvider } from './context/ThemeContext';
import './index.css';
import './styles.css';

function App() {
  const [formData, setFormData] = useState({
    personalInfo: {
      name: '',
      email: '',
      phone: '',
      profileImage: null,
      bio: '',
      tagline: ''
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
  const [currentRoute, setCurrentRoute] = useState('landing');
  const [wizardStep, setWizardStep] = useState(1);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [apiStatus, setApiStatus] = useState('Checking connection...');
  const [darkMode, setDarkMode] = useState(false);

  // Initialize dark mode from localStorage
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    }
  }, []);

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode);
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  };

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
          // Get full profile data including profile image
          setFormData({
            personalInfo: {
              ...formData.personalInfo,
              ...response.data.user.personalInfo
            },
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
            setCurrentRoute('dashboard');
          } else {
            setCurrentRoute('create');
            setWizardStep(1);
          }
        }
      } catch (err) {
        console.error('Error checking authentication:', err);
        // Clear invalid token
        localStorage.removeItem('token');
        setCurrentRoute('landing');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuthStatus();
  }, []);

  const handleAuthSuccess = (userData) => {
    console.log("Auth success with user data:", userData);
    
    // If user data contains profile info, populate form including profile image
    if (userData) {
      setFormData({
        personalInfo: {
          ...formData.personalInfo,
          ...userData.personalInfo
        },
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
        setCurrentRoute('dashboard');
      } else {
        setCurrentRoute('create');
        setWizardStep(1);
      }
    }
    
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUserEmail');
    setIsAuthenticated(false);
    setCurrentRoute('landing');
    setWizardStep(1);
    setFormData({
      personalInfo: {
        name: '',
        email: '',
        phone: '',
        profileImage: null,
        bio: '',
        tagline: ''
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

  const handleNavigation = (route) => {
    if (route === 'home' || route === 'help') {
      setCurrentRoute(route === 'home' ? 'landing' : 'help');
    } else if (route === 'create') {
      setCurrentRoute('create');
      setWizardStep(1);
    } else {
      setCurrentRoute(route);
    }
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
    setWizardStep(wizardStep + 1);
  };

  const prevStep = () => {
    setWizardStep(Math.max(1, wizardStep - 1));
  };

  const handleSaveProgress = async () => {
    try {
      await profileService.updateProfile(formData);
      alert('Progress saved successfully!');
    } catch (err) {
      console.error('Error saving progress:', err);
      alert('Failed to save progress');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-xl text-gray-700 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (currentRoute) {
      case 'landing':
        return <LandingPage onGetStarted={() => setCurrentRoute('auth')} />;
      
      case 'auth':
        return <Auth onAuthSuccess={handleAuthSuccess} />;
      
      case 'dashboard':
        return (
          <Dashboard
            formData={formData}
            onLogout={handleLogout}
            updateFormData={updateFormData}
            onViewPortfolio={() => setCurrentRoute('preview')}
          />
        );
      
      case 'create':
        const stepTitles = ['Personal Info', 'Education', 'Skills & Projects', 'Review'];
        return (
          <PortfolioWizard
            currentStep={wizardStep}
            totalSteps={4}
            stepTitles={stepTitles}
            onNext={() => {
              if (wizardStep === 4) {
                setCurrentRoute('dashboard');
              } else {
                setWizardStep(wizardStep + 1);
              }
            }}
            onPrev={prevStep}
            onSave={handleSaveProgress}
          >
            {wizardStep === 1 && (
              <EnhancedProfileSetup
                formData={formData}
                onNext={nextStep}
                hideNavigation={true}
              />
            )}
            {wizardStep === 2 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Education Details</h2>
                <EnhancedProfileSetup
                  formData={formData}
                  onNext={nextStep}
                  hideNavigation={true}
                  showOnlyEducation={true}
                />
              </div>
            )}
            {wizardStep === 3 && (
              <EnhancedProfileSetup
                formData={formData}
                onNext={nextStep}
                hideNavigation={true}
                showOnlySkillsProjects={true}
              />
            )}
            {wizardStep === 4 && (
              <ProfilePreview
                formData={formData}
                onBack={prevStep}
                onConfirm={() => setCurrentRoute('dashboard')}
                hideNavigation={true}
              />
            )}
          </PortfolioWizard>
        );
      
      case 'preview':
        return (
          <PortfolioPDF
            formData={formData}
            onBack={() => setCurrentRoute('dashboard')}
          />
        );
      
      case 'help':
        return (
          <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12">
            <div className="container mx-auto px-4 max-w-4xl">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
                <h1 className="text-4xl font-bold font-heading mb-6 text-gray-900 dark:text-white">
                  Help & Documentation
                </h1>
                <div className="prose dark:prose-invert max-w-none">
                  <h2>Getting Started</h2>
                  <p>Welcome to Portfolio Builder! Follow these steps to create your professional portfolio:</p>
                  <ol>
                    <li>Sign up or log in to your account</li>
                    <li>Complete your personal information</li>
                    <li>Add your education details</li>
                    <li>List your skills and projects</li>
                    <li>Preview and download your portfolio</li>
                  </ol>
                  <h2>Features</h2>
                  <ul>
                    <li><strong>Multiple Templates:</strong> Choose from various professional templates</li>
                    <li><strong>Dark Mode:</strong> Switch between light and dark themes</li>
                    <li><strong>PDF Export:</strong> Download your portfolio as a PDF</li>
                    <li><strong>Live Preview:</strong> See changes in real-time</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );
      
      default:
        return <LandingPage onGetStarted={() => setCurrentRoute('auth')} />;
    }
  };

  return (
    <ThemeProvider>
      <div className="app min-h-screen">
        {currentRoute !== 'landing' && currentRoute !== 'auth' && (
          <NavBar
            isAuthenticated={isAuthenticated}
            onLogout={handleLogout}
            activeRoute={currentRoute}
            onNavigate={handleNavigation}
            darkMode={darkMode}
            toggleDarkMode={toggleDarkMode}
          />
        )}
        {error && (
          <div className="fixed top-20 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-down">
            {error}
          </div>
        )}
        {renderContent()}
      </div>
    </ThemeProvider>
  );
}

export default App; 