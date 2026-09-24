import React, { useState, useEffect, Suspense, lazy } from 'react';
import LandingPage from './components/LandingPage';
import NavBar from './components/NavBar';
import Auth from './components/Auth';
// Heavy routes are code-split so the landing/auth first paint stays lean.
// (The legacy wizard components are no longer part of any route.)
const Dashboard = lazy(() => import('./components/Dashboard'));
const PortfolioPDF = lazy(() => import('./components/PortfolioPDF'));
const ResumeBuilder = lazy(() => import('./components/ResumeBuilder'));
const JobMatch = lazy(() => import('./components/JobMatch'));

function RouteLoader() {
  return (
    <div className="ds-page" role="status" aria-label="Loading" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto mb-4" aria-hidden="true" />
        <p className="ds-muted">Loading…</p>
      </div>
    </div>
  );
}
import { authService, profileService, resumesService } from './services/api';
import { ThemeProvider } from './context/ThemeContext';
import { normalizeProfile, EMPTY_NEW_SECTIONS, EMPTY_PERSONAL_EXT } from './utils/resumeModel';
import './index.css';
import './styles.css';

const INITIAL_FORM_DATA = {
  personalInfo: {
    name: '',
    email: '',
    phone: '',
    profileImage: null,
    bio: '',
    tagline: '',
    ...EMPTY_PERSONAL_EXT
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
  },
  ...EMPTY_NEW_SECTIONS
};

function App() {
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [currentRoute, setCurrentRoute] = useState('landing');
  const [wizardStep, setWizardStep] = useState(1);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [apiStatus, setApiStatus] = useState('Checking connection...');
  const [darkMode, setDarkMode] = useState(false);
  // Active resume version ({ id, name }) or null for the main resume.
  // Legacy users never set this and keep working on the User document.
  const [activeVersion, setActiveVersion] = useState(null);

  // Version-aware save: routes writes to the active version snapshot when
  // one is selected, otherwise to the main profile. Same payload shape.
  const saveProfile = async (payload) => {
    if (activeVersion && activeVersion.id) {
      return resumesService.update(activeVersion.id, payload);
    }
    return profileService.updateProfile(payload);
  };

  const handleActivateVersion = (version) => {
    if (!version) return;
    setFormData(normalizeProfile(version.data || {}));
    setActiveVersion({ id: String(version.id), name: version.name });
  };

  const handleDeactivateVersion = async () => {
    try {
      const response = await profileService.getProfile();
      if (response.success && response.data.profile) {
        setFormData(normalizeProfile(response.data.profile));
      }
    } catch (err) {
      console.error('Error reloading main profile:', err);
    } finally {
      setActiveVersion(null);
    }
  };

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
    
    fetch(`${baseUrl}/db-status`)
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
          // Normalize through the resume model so old-schema users gain the
          // new sections with safe defaults (no data loss, no forced fields).
          setFormData((prev) => ({
            ...normalizeProfile(response.data.user),
            personalInfo: { ...prev.personalInfo, ...(response.data.user.personalInfo || {}) },
          }));

          // Restore an active resume version, if the user had one selected.
          // Failure heals locally (and server-side): a deleted version simply
          // drops back to the main resume.
          const activeId = response.data.user.activeResumeVersion;
          if (activeId) {
            try {
              const vRes = await resumesService.get(activeId);
              if (vRes.success && vRes.data.version) {
                setFormData(normalizeProfile(vRes.data.version.data || {}));
                setActiveVersion({ id: String(vRes.data.version.id), name: vRes.data.version.name });
              }
            } catch (versionErr) {
              console.warn('Active version unavailable, using main resume:', versionErr.message);
              try { await resumesService.setActive(null); } catch { /* ignore */ }
              setActiveVersion(null);
            }
          }

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

    // If user data contains profile info, populate form including profile image
    if (userData) {
      setFormData((prev) => ({
        ...normalizeProfile(userData),
        personalInfo: { ...prev.personalInfo, ...(userData.personalInfo || {}) },
      }));
      
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
    setActiveVersion(null);
    setIsAuthenticated(false);
    setCurrentRoute('landing');
    setWizardStep(1);
    setFormData({ ...INITIAL_FORM_DATA });
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
    setFormData(newData);
  };

  const nextStep = (data) => {
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
            onNavigate={handleNavigation}
            saveProfile={saveProfile}
            activeVersion={activeVersion}
            onActivateVersion={handleActivateVersion}
            onDeactivateVersion={handleDeactivateVersion}
            darkMode={darkMode}
            toggleDarkMode={toggleDarkMode}
          />
        );
      
      case 'create':
        // Professional Resume Builder: sidebar sections + editor + live
        // preview. Same profile data and APIs as the portfolio flow, so
        // existing portfolios keep working unchanged.
        return (
          <ResumeBuilder
            formData={formData}
            onChange={(d) => setFormData((prev) => ({ ...prev, ...d }))}
            onSave={async (payload) => {
              await saveProfile(payload);
              setFormData((prev) => ({ ...prev, ...payload }));
            }}
            onExit={() => setCurrentRoute('dashboard')}
            onPreview={() => setCurrentRoute('preview')}
          />
        );
      
      case 'preview':
        return (
          <PortfolioPDF
            formData={formData}
            onBack={() => setCurrentRoute('dashboard')}
          />
        );

      case 'jobmatch':
        // Job Description Matcher: same profile data and APIs as the rest of
        // the app. Auth-gated like the other private routes.
        if (!isAuthenticated) {
          return <Auth onAuthSuccess={handleAuthSuccess} />;
        }
        return (
          <JobMatch
            formData={formData}
            saveProfile={saveProfile}
            onProfileUpdate={(payload) => setFormData((prev) => ({ ...prev, ...payload }))}
            onBack={() => setCurrentRoute('dashboard')}
            onOpenAts={() => setCurrentRoute('dashboard')}
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
        <Suspense fallback={<RouteLoader />}>
          {renderContent()}
        </Suspense>
      </div>
    </ThemeProvider>
  );
}

export default App; 