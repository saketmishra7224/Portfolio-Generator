import React, { useState } from 'react';
import { authService } from '../services/api';
import { FaUser, FaLock, FaUserPlus, FaSignInAlt, FaPhone } from 'react-icons/fa';

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
          email: formData.email,
          password: formData.password,
          personalInfo: {
            name: formData.personalInfo.name,
            email: formData.email, // Ensure emails match
            phone: formData.personalInfo.phone
          }
        };
        
        console.log('Sending registration data:', registrationData);
        
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
      
      // Show more detailed error if available from the server
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError(isLogin 
          ? 'Login failed. You may need to register first.' 
          : 'Registration failed. Please try again.');
      }
      
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
            <FaSignInAlt /> Sign In
          </button>
          <button 
            className={`tab-btn ${!isLogin ? 'active' : ''}`}
            onClick={() => handleTabChange('register')}
          >
            <FaUserPlus /> Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <h1>{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
          <p>{isLogin ? 'Sign in to manage your portfolio' : 'Register to create your professional portfolio'}</p>

          {error && <div className="error-message">{error}</div>}
          
          {useLocalStorage && (
            <div className="info-message">
              Using local storage mode (for development only)
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">
              <FaUser /> Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">
              <FaLock /> Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
              minLength={6}
            />
          </div>

          {!isLogin && (
            <>
              <h3>Personal Information</h3>
              
              <div className="form-group">
                <label htmlFor="name">
                  <FaUser /> Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="personalInfo.name"
                  value={formData.personalInfo.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">
                  <FaPhone /> Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="personalInfo.phone"
                  value={formData.personalInfo.phone}
                  onChange={handleChange}
                  placeholder="Enter your phone number"
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