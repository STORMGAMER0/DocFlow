import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add token to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth APIs
export const register = (username, password) => {
  return api.post('/register', { username, password });
};

export const login = (username, password) => {
  const formData = new URLSearchParams();
  formData.append('username', username);
  formData.append('password', password);
  
  return api.post('/token', formData, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });
};

// Document APIs
export const uploadDocument = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/upload', formData);
};

export const uploadDocumentBatch = (files, onProgress) => {
  const formData = new FormData();

  files.forEach(file => {
    formData.append('files', file);
  });

  return api.post('/upload-batch', formData, {
    onUploadProgress: (progressEvent) => {
      const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
      if (onProgress) {
        onProgress(percentCompleted);
      }
    }
  });
};
export const getDocuments = () => {
  return api.get('/documents');
};

export const getDocument = (docId) => {
  return api.get(`/documents/${docId}`);
};

export const searchDocuments = (query) => {
  return api.get(`/documents/search?q=${query}`);
};

export const deleteDocument = (docId) => {
  return api.delete(`/documents/${docId}`);
};

export default api;