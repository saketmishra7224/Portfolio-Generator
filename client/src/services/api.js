import axios from 'axios';

// Get server IP from window location or use default for local development
const getBaseUrl = () => {
  const hostname = window.location.hostname;
  
  // If it's localhost, use localhost explicitly
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:5000/api';
  }
  
  // Otherwise use the current hostname (for network access)
  return `http://${hostname}:5000/api`;
};

// Create an axios instance with defaults
const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add error handling for network errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Log detailed error information to help with debugging
    console.error('API Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    
    // If it's a network error, provide more helpful information
    if (error.message.includes('Network Error')) {
      console.error('Network error detected. Server might be down or unreachable.');
      // Try alternative port if needed
      const originalRequest = error.config;
      
      if (!originalRequest._retry) {
        originalRequest._retry = true;
        if (originalRequest.url.includes(':5000/')) {
          console.log('Retrying with port 5001');
          originalRequest.url = originalRequest.url.replace(':5000/', ':5001/');
          return axios(originalRequest);
        }
      }
    }
    
    return Promise.reject(error);
  }
);

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth services
export const authService = {
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  },
  
  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },
  
  getCurrentUser: async () => {
    try {
      const response = await api.get('/auth/user');
      return response.data;
    } catch (error) {
      console.error('Get user error:', error);
      throw error;
    }
  }
};

// Profile services
export const profileService = {
  getProfile: async () => {
    const response = await api.get('/profile');
    return response.data;
  },
  
  updateProfile: async (profileData) => {
    const response = await api.put('/profile', profileData);
    return response.data;
  },
  
  updateEducation: async (educationData) => {
    const response = await api.put('/profile/education', { education: educationData });
    return response.data;
  },
  
  updateSkills: async (skills) => {
    const response = await api.put('/profile/skills', { skills });
    return response.data;
  },
  
  addProject: async (project) => {
    const response = await api.post('/profile/projects', project);
    return response.data;
  },
  
  updateProject: async (projectId, projectData) => {
    const response = await api.put(`/profile/projects/${projectId}`, projectData);
    return response.data;
  },
  
  deleteProject: async (projectId) => {
    const response = await api.delete(`/profile/projects/${projectId}`);
    return response.data;
  }
};

export default api; 