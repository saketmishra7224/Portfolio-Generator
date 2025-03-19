import axios from 'axios';

// Create an axios instance with defaults
const api = axios.create({
  baseURL: 'http://localhost:5001/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

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
    const response = await api.post('/auth/register', userData);
    return response.data;
  },
  
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },
  
  getCurrentUser: async () => {
    const response = await api.get('/auth/user');
    return response.data;
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