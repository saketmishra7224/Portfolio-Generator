import React, { useState } from 'react';
import Auth from './components/Auth';
import ProfileSetup from './components/ProfileSetup';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // This would normally be handled by your authentication system
  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  return (
    <div className="app">
      {isAuthenticated ? (
        <ProfileSetup />
      ) : (
        <Auth onLogin={handleLogin} />
      )}
    </div>
  );
};

export default App; 