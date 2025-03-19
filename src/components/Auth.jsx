import React, { useState } from 'react';
import { authService } from '../services/api';

const Auth = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    personalInfo: {
      name: '',
      email: '',
      phone: ''
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [useLocalStorage, setUseLocalStorage] = useState(false); // Default to using real API

  const handleTabChange = (tab) => {
    setIsLogin(tab === 'login');
    setError(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      // Handle nested fields (personalInfo.name, personalInfo.email, etc.)
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Normal API flow
      let response;
      
      if (isLogin) {
        // Handle login
        response = await authService.login({
          email: formData.email,
          password: formData.password
        });
      } else {
        // For registration, ensure personal info email matches account email
        const registrationData = {
          ...formData,
          personalInfo: {
            ...formData.personalInfo,
            email: formData.email // Ensure emails match
          }
        };
        
        // Handle registration
        response = await authService.register(registrationData);
      }

      // Store token in localStorage
      if (response.success && response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('currentUserEmail', formData.email);
        
        // Call the onAuthSuccess callback with user data
        onAuthSuccess(response.data.user);
      } else {
        setError('Authentication failed. Please try again.');
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError(isLogin 
        ? 'Login failed. You may need to register first.' 
        : 'Registration failed. Please try again.');
      
      // Offer to use localStorage if API fails
      if (!useLocalStorage) {
        setTimeout(() => {
          const useLocal = window.confirm(
            "Server connection failed. Would you like to use local storage mode for development? " +
            "(Your data will only be saved in this browser)"
          );
          if (useLocal) {
            setUseLocalStorage(true);
            setError(null);
          }
        }, 100);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-content">
        <div className="auth-tabs">
          <button 
            className={`tab-btn ${isLogin ? 'active' : ''}`}
            onClick={() => handleTabChange('login')}
          >
            Sign In
          </button>
          <button 
            className={`tab-btn ${!isLogin ? 'active' : ''}`}
            onClick={() => handleTabChange('register')}
          >
            Sign Up
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}
        
        {useLocalStorage && (
          <div className="info-message">
            Using local storage mode (for development only)
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
            />
          </div>

          {!isLogin && (
            <>
              <h3>Personal Information</h3>
              
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="personalInfo.name"
                  value={formData.personalInfo.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  name="personalInfo.phone"
                  value={formData.personalInfo.phone}
                  onChange={handleChange}
                  required
                />
              </div>
            </>
          )}

          <button 
            type="submit" 
            className="auth-btn"
            disabled={isLoading}
          >
            {isLoading 
              ? 'Please wait...' 
              : isLogin 
                ? 'Sign In' 
                : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Auth; 