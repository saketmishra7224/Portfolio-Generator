import React, { useState } from 'react';
import { authService } from '../services/api';
import { FaUser, FaLock, FaUserPlus, FaSignInAlt, FaPhone, FaEnvelope, FaExclamationCircle, FaCheckCircle } from 'react-icons/fa';

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
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePassword = (password) => {
    return password.length >= 6;
  };

  const validateName = (name) => {
    return name.length >= 2 && /^[a-zA-Z\s]+$/.test(name);
  };

  const validatePhone = (phone) => {
    return /^[0-9+\-\s()]{10,}$/.test(phone);
  };

  const handleTabChange = (tab) => {
    setIsLogin(tab === 'login');
    setError(null);
    setFieldErrors({});
    setTouched({});
  };

  const handleBlur = (field) => {
    setTouched({ ...touched, [field]: true });
    
    const errors = {};
    if (field === 'email' && !validateEmail(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    if (field === 'password' && !validatePassword(formData.password)) {
      errors.password = 'Password must be at least 6 characters';
    }
    if (field === 'personalInfo.name' && !isLogin && !validateName(formData.personalInfo.name)) {
      errors['personalInfo.name'] = 'Name must be at least 2 characters and contain only letters';
    }
    if (field === 'personalInfo.phone' && !isLogin && !validatePhone(formData.personalInfo.phone)) {
      errors['personalInfo.phone'] = 'Please enter a valid phone number';
    }
    
    setFieldErrors({ ...fieldErrors, ...errors });
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
      let response;
      
      if (isLogin) {
          // Handle login
          try {
            response = await authService.login({
              email: formData.email,
              password: formData.password
            });
            
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
            throw err;
          }
        } else {
          // For registration, ensure personal info email matches account email
          const registrationData = {
            email: formData.email,
            password: formData.password,
            personalInfo: {
              name: formData.personalInfo.name,
              email: formData.email, // Ensure emails match
              phone: formData.personalInfo.phone,
              profileImage: null
            }
          };
          
          console.log('Sending registration data:', registrationData);
          
          // Handle registration
          response = await authService.register(registrationData);
          
          // Store token in localStorage
          if (response.success && response.data.token) {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('currentUserEmail', formData.email);
            
            // Call the onAuthSuccess callback with user data
            onAuthSuccess(response.data.user);
          } else {
            setError('Registration failed. Please try again.');
        }
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

          <div className="form-group">
            <label htmlFor="email">
              <FaUser /> Email
            </label>
            <div className="input-wrapper">
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Enter your email"
                required
                className={touched.email ? (fieldErrors.email ? 'error' : 'valid') : ''}
              />
              {touched.email && !fieldErrors.email && (
                <FaCheckCircle className="validation-icon valid" />
              )}
              {touched.email && fieldErrors.email && (
                <FaExclamationCircle className="validation-icon error" />
              )}
            </div>
            {touched.email && fieldErrors.email && (
              <p className="error-message">{fieldErrors.email}</p>
            )}
            <p className="helper-text">We'll never share your email with anyone</p>
          </div>

          <div className="form-group">
            <label htmlFor="password">
              <FaLock /> Password
            </label>
            <div className="input-wrapper">
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Enter your password"
                required
                minLength={6}
                className={touched.password ? (fieldErrors.password ? 'error' : 'valid') : ''}
              />
              {touched.password && !fieldErrors.password && (
                <FaCheckCircle className="validation-icon valid" />
              )}
              {touched.password && fieldErrors.password && (
                <FaExclamationCircle className="validation-icon error" />
              )}
            </div>
            {touched.password && fieldErrors.password && (
              <p className="error-message">{fieldErrors.password}</p>
            )}
            <p className="helper-text">Minimum 6 characters required</p>
          </div>

          {!isLogin && (
            <>
              <h3>Personal Information</h3>
              
              <div className="form-group">
                <label htmlFor="name">
                  <FaUser /> Full Name
                </label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    id="name"
                    name="personalInfo.name"
                    value={formData.personalInfo.name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Enter your full name"
                    required
                    className={touched.name ? (fieldErrors.name ? 'error' : 'valid') : ''}
                  />
                  {touched.name && !fieldErrors.name && (
                    <FaCheckCircle className="validation-icon valid" />
                  )}
                  {touched.name && fieldErrors.name && (
                    <FaExclamationCircle className="validation-icon error" />
                  )}
                </div>
                {touched.name && fieldErrors.name && (
                  <p className="error-message">{fieldErrors.name}</p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="phone">
                  <FaPhone /> Phone Number
                </label>
                <div className="input-wrapper">
                  <input
                    type="tel"
                    id="phone"
                    name="personalInfo.phone"
                    value={formData.personalInfo.phone}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Enter your phone number"
                    required
                    className={touched.phone ? (fieldErrors.phone ? 'error' : 'valid') : ''}
                  />
                  {touched.phone && !fieldErrors.phone && (
                    <FaCheckCircle className="validation-icon valid" />
                  )}
                  {touched.phone && fieldErrors.phone && (
                    <FaExclamationCircle className="validation-icon error" />
                  )}
                </div>
                {touched.phone && fieldErrors.phone && (
                  <p className="error-message">{fieldErrors.phone}</p>
                )}
                <p className="helper-text">Format: +1234567890 or 1234567890</p>
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