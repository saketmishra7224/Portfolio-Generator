import React, { createContext, useState, useContext, useEffect } from 'react';
import { profileService } from '../services/api';

// Create ThemeContext
const ThemeContext = createContext();

// Default theme values
const defaultTheme = {
  template: 'minimal',
  accentColor: '#2563eb',
  font: 'Inter'
};

// ThemeProvider component
export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(defaultTheme);
  const [isLoading, setIsLoading] = useState(true);

  // Load initial theme from backend profile API
  useEffect(() => {
    const loadThemeFromProfile = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await profileService.getProfile();
        
        if (response.success && response.data.profile.theme) {
          // Merge backend theme with defaults to ensure all fields exist
          setTheme({
            ...defaultTheme,
            ...response.data.profile.theme
          });
        }
      } catch (error) {
        console.error('Error loading theme from profile:', error);
        // Keep default theme on error
      } finally {
        setIsLoading(false);
      }
    };

    loadThemeFromProfile();
  }, []);

  // Update theme function - persists changes in state
  const updateTheme = (newThemeData) => {
    setTheme(prevTheme => ({
      ...prevTheme,
      ...newThemeData
    }));
  };

  // Update theme and sync with backend
  const updateThemeWithSync = async (newThemeData) => {
    try {
      // Update local state immediately for responsive UI
      updateTheme(newThemeData);

      // Sync with backend
      const token = localStorage.getItem('token');
      if (token) {
        await profileService.updateTheme(newThemeData);
      }
    } catch (error) {
      console.error('Error syncing theme with backend:', error);
      // Theme is still updated locally even if backend sync fails
    }
  };

  const value = {
    theme,
    updateTheme,
    updateThemeWithSync,
    isLoading
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
};

export default ThemeContext;
