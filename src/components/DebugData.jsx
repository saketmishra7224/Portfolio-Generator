import React, { useState, useEffect } from 'react';

const DebugData = () => {
  const [localStorageData, setLocalStorageData] = useState({});
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const token = localStorage.getItem('token');
    const currentUserEmail = localStorage.getItem('currentUserEmail');
    
    setLocalStorageData({
      users,
      token,
      currentUserEmail
    });
  }, [showDebug]);

  const toggleDebug = () => {
    setShowDebug(!showDebug);
  };

  const cleanupDuplicateUsers = () => {
    // Get all users from localStorage
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    // Create a Map to track unique emails
    const uniqueUsers = new Map();
    
    // Add users to the map, with the most recent one taking precedence
    users.forEach(user => {
      uniqueUsers.set(user.email, user);
    });
    
    // Convert map values back to array
    const cleanedUsers = Array.from(uniqueUsers.values());
    
    // Save back to localStorage
    localStorage.setItem('users', JSON.stringify(cleanedUsers));
    
    // Refresh the display
    setLocalStorageData({
      ...localStorageData,
      users: cleanedUsers
    });
    
    return cleanedUsers.length;
  };

  const resetAllData = () => {
    if (window.confirm('Are you sure you want to clear ALL localStorage data? This will log you out and reset everything.')) {
      localStorage.removeItem('users');
      localStorage.removeItem('token');
      localStorage.removeItem('currentUserEmail');
      
      setLocalStorageData({
        users: [],
        token: null,
        currentUserEmail: null
      });
      
      alert('All data cleared. Page will reload.');
      window.location.reload();
    }
  };

  return (
    <div className="debug-container">
      <button 
        onClick={toggleDebug} 
        style={{ 
          position: 'fixed', 
          bottom: '10px', 
          right: '10px',
          background: '#333',
          color: 'white',
          border: 'none',
          padding: '5px 10px',
          borderRadius: '4px',
          cursor: 'pointer',
          zIndex: 1000
        }}
      >
        {showDebug ? 'Hide Debug' : 'Show Debug'}
      </button>
      
      {showDebug && (
        <div 
          style={{ 
            position: 'fixed', 
            bottom: '50px', 
            right: '10px',
            background: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: '20px',
            borderRadius: '8px',
            maxWidth: '600px',
            maxHeight: '80vh',
            overflow: 'auto',
            zIndex: 1000
          }}
        >
          <h3>Current User Email: {localStorageData.currentUserEmail || 'None'}</h3>
          <h3>Token: {localStorageData.token || 'None'}</h3>
          <h3>Users in Storage ({localStorageData.users?.length || 0}):</h3>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <button 
              onClick={cleanupDuplicateUsers}
              style={{
                background: '#f44336',
                color: 'white',
                border: 'none',
                padding: '5px 10px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Clean Duplicate Users
            </button>
            <button 
              onClick={resetAllData}
              style={{
                background: '#000',
                color: 'white',
                border: 'none',
                padding: '5px 10px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Reset All Data
            </button>
          </div>
          <pre>
            {JSON.stringify(localStorageData.users, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default DebugData; 