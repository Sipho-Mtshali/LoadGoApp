import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API methods
export const authAPI = {
  register: (name, email, password, phone, role) => 
    api.post('/auth/register', { name, email, password, phone, role })
      .then(response => response.data),
  
  login: (email, password) => 
    api.post('/auth/login', { email, password })
      .then(response => response.data),
  
  verifyToken: (token) => 
    api.get('/auth/verify', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(response => response.data.user),
  
  logout: () => 
    api.post('/auth/logout').then(response => response.data),
};

export default api;