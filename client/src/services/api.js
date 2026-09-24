import axios from 'axios';

// Get server IP from window location or use default for local development
const getBaseUrl = () => {
  const hostname = window.location.hostname;
  
  // If it's localhost, use localhost explicitly
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:5000/api';
  }
  
  // In production (like Render), use relative path since React and API are served from same domain
  return '/api';
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
  },

  // Google Sign-In: exchanges a Google-issued ID token (obtained via the
  // official Google Identity Services flow) for the app's own JWT session.
  // The ID token is verified server-side; the frontend never invents identity.
  googleLogin: async (idToken) => {
    try {
      const response = await api.post('/auth/google', { idToken });
      return response.data;
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    }
  },

  // Fetch Google OAuth client ID from server config
  getGoogleClientId: async () => {
    try {
      const response = await api.get('/auth/google/client-id');
      return response.data?.clientId || '';
    } catch (error) {
      console.warn('Could not fetch Google client ID from server:', error.message);
      return '';
    }
  },

  changePassword: async (currentPassword, newPassword) => {
    try {
      const response = await api.post('/auth/change-password', { currentPassword, newPassword });
      return response.data;
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  },

  // Invalidates every session for this account on the server, including the
  // current one. The caller must discard its token (sign out) afterwards.
  logoutAll: async () => {
    try {
      const response = await api.post('/auth/logout-all');
      return response.data;
    } catch (error) {
      console.error('Logout-all error:', error);
      throw error;
    }
  }
};

// Resume version services. Versions are named snapshots owned by the user;
// the account itself is never duplicated. Users without versions keep using
// the profile endpoints above, unchanged.
export const resumesService = {
  list: async () => {
    const response = await api.get('/resumes');
    return response.data;
  },

  create: async ({ name, targetRole, template, theme, targetJobDescription, data, fromCurrent }) => {
    const response = await api.post('/resumes', { name, targetRole, template, theme, targetJobDescription, data, fromCurrent });
    return response.data;
  },

  get: async (id) => {
    const response = await api.get(`/resumes/${id}`);
    return response.data;
  },

  update: async (id, payload) => {
    const response = await api.put(`/resumes/${id}`, payload);
    return response.data;
  },

  duplicate: async (id) => {
    const response = await api.post(`/resumes/${id}/duplicate`);
    return response.data;
  },

  remove: async (id) => {
    const response = await api.delete(`/resumes/${id}`);
    return response.data;
  },

  setActive: async (versionId) => {
    const response = await api.put('/resumes/active', { versionId });
    return response.data;
  },
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
  },
  
  updateTheme: async (themeData) => {
    const response = await api.put('/profile/theme', { theme: themeData });
    return response.data;
  },

  // Generic resume-section item CRUD (educations, experiences, projects,
  // certifications, achievements, languages, publications, volunteering).
  // Bulk/reorder flows use updateProfile with the full array instead.
  addSectionItem: async (section, item) => {
    const response = await api.post(`/profile/sections/${section}`, item);
    return response.data;
  },

  updateSectionItem: async (section, id, item) => {
    const response = await api.put(`/profile/sections/${section}/${id}`, item);
    return response.data;
  },

  deleteSectionItem: async (section, id) => {
    const response = await api.delete(`/profile/sections/${section}/${id}`);
    return response.data;
  },

  replaceSection: async (section, items) => {
    const response = await api.put('/profile', { [section]: items });
    return response.data;
  },
  
  deleteProfile: async () => {
    const response = await api.delete('/profile');
    return response.data;
  }
};

export default api; 