import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface SignUpData {
  email: string;
  password: string;
  fullName: string;
  role: 'parent' | 'therapist' | 'school_admin' | 'system_admin';
}

export interface SignInData {
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  phone: string | null;
  avatar_url: string | null;
}

export const authAPI = {
  signUp: async (data: SignUpData) => {
    const response = await api.post('/api/auth/signup', data);
    if (response.data.token) {
      localStorage.setItem('auth_token', response.data.token);
    }
    return response.data;
  },

  signIn: async (data: SignInData) => {
    const response = await api.post('/api/auth/signin', data);
    if (response.data.token) {
      localStorage.setItem('auth_token', response.data.token);
    }
    return response.data;
  },

  getProfile: async (): Promise<Profile> => {
    const response = await api.get('/api/auth/me');
    return response.data;
  },

  signOut: () => {
    localStorage.removeItem('auth_token');
  },
};

export const studentsAPI = {
  getAll: async () => {
    const response = await api.get('/api/students');
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/api/students/${id}`);
    return response.data;
  },

  getStats: async (id: string) => {
    const response = await api.get(`/api/students/${id}/stats`);
    return response.data;
  },

  getParents: async () => {
    const response = await api.get('/api/students/parents');
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/api/students', data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await api.put(`/api/students/${id}`, data);
    return response.data;
  },
};

export const sessionsAPI = {
  getAll: async () => {
    const response = await api.get('/api/sessions');
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/api/sessions', data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await api.put(`/api/sessions/${id}`, data);
    return response.data;
  },
};

export const aiAPI = {
  analyzeSpeech: async (studentId: string, audioData: string, sessionId?: string) => {
    const response = await api.post('/api/ai/analyze-speech', {
      studentId,
      audioData,
      sessionId,
    });
    return response.data;
  },

  analyzeBehavior: async (studentId: string, videoData: string, sessionId?: string) => {
    const response = await api.post('/api/ai/analyze-behavior', {
      studentId,
      videoData,
      sessionId,
    });
    return response.data;
  },

  detectEmotion: async (studentId: string, imageData: string, sessionId?: string) => {
    const response = await api.post('/api/ai/detect-emotion', {
      studentId,
      imageData,
      sessionId,
    });
    return response.data;
  },

  predictProgress: async (studentId: string) => {
    const response = await api.post('/api/ai/predict-progress', {
      studentId,
    });
    return response.data;
  },

  generateIEP: async (studentId: string) => {
    const response = await api.post('/api/ai/generate-iep', {
      studentId,
    });
    return response.data;
  },

  getResults: async (studentId: string) => {
    const response = await api.get(`/api/ai/results/${studentId}`);
    return response.data;
  },
};

export default api;
