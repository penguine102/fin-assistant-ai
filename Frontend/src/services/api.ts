import axios from 'axios';

// @ts-ignore
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to all requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle 401 errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Types
export interface User {
  id: string;
  email: string;
  full_name?: string;
}

export interface UserCreate {
  email: string;
  full_name?: string;
  password: string;
}

export interface Session {
  id: string;
  user_id: string;
  session_name: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatRequest {
  user_id: string;
  session_id: string;
  query: string;
  suggestion?: boolean;
}

export interface ChatResponse {
  answer: string;
  suggestion?: string;
  session_id?: string;
}

export interface SuggestionResponse {
  suggestion: string | null;
  session_id: string | null;
}

// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user_id: string;
  email: string;
  full_name?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
}

// Transaction Types
export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  type: 'income' | 'expense';
  category?: string;
  note?: string;
  occurred_at: string;
  created_at: string;
}

export interface TransactionCreate {
  user_id: string;
  amount: number;
  type: 'income' | 'expense';
  category?: string;
  note?: string;
  occurred_at: string;
}

export interface TransactionSummary {
  income: number;
  expense: number;
  net: number;
}

// API Functions
export const api = {
  // Auth
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/api/v1/auth/login', credentials);
    // Store token
    localStorage.setItem('access_token', response.data.access_token);
    return response.data;
  },

  async register(user: UserCreate): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/api/v1/auth/register', user);
    // Store token
    localStorage.setItem('access_token', response.data.access_token);
    return response.data;
  },

  async logout(): Promise<void> {
    localStorage.removeItem('access_token');
    return Promise.resolve();
  },

  async getCurrentUser(): Promise<UserProfile> {
    const response = await apiClient.get<UserProfile>('/api/v1/auth/me');
    return response.data;
  },

  async refreshToken(): Promise<{ access_token: string; token_type: string }> {
    const response = await apiClient.post('/api/v1/auth/refresh');
    if (response.data.access_token) {
      localStorage.setItem('access_token', response.data.access_token);
    }
    return response.data;
  },
  // Users
  async createUser(user: UserCreate): Promise<User> {
    const response = await apiClient.post<User>('/api/v1/users/', user);
    return response.data;
  },

  async getUsers(): Promise<User[]> {
    const response = await apiClient.get<User[]>('/api/v1/users/');
    return response.data;
  },

  // Chat Sessions
  async createSession(userId: string): Promise<Session> {
    const response = await apiClient.post<Session>(`/api/v1/chat/sessions?user_id=${userId}`);
    return response.data;
  },

  async getSessions(userId: string): Promise<Session[]> {
    const response = await apiClient.get<Session[]>(`/api/v1/chat/sessions?user_id=${userId}`);
    return response.data;
  },

  // Chat
  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    const response = await apiClient.post<ChatResponse>('/api/v1/chat/', request);
    return response.data;
  },

  async getHistory(sessionId: string, limit: number = 20): Promise<ChatMessage[]> {
    const response = await apiClient.get<ChatMessage[]>(`/api/v1/chat/history?session_id=${sessionId}&limit=${limit}`);
    return response.data;
  },

  async getSuggestion(request: { user_id: string; session_id?: string; context?: string; query: string }): Promise<SuggestionResponse> {
    const response = await apiClient.post<SuggestionResponse>('/api/v1/chat/suggestion', request);
    return response.data;
  },

  async getMockResponse(): Promise<ChatResponse> {
    const response = await apiClient.post<ChatResponse>('/api/v1/chat/mock');
    return response.data;
  },

  async clearSessionCache(sessionId: string): Promise<any> {
    const response = await apiClient.delete(`/api/v1/chat/cache/${sessionId}`);
    return response.data;
  },

  async getCacheStats(sessionId: string): Promise<any> {
    const response = await apiClient.get(`/api/v1/chat/cache/${sessionId}/stats`);
    return response.data;
  },

  async testAIFormat(): Promise<any> {
    const response = await apiClient.get('/api/v1/chat/test/ai-format');
    return response.data;
  },

  // OCR
  async uploadReceipt(formData: FormData): Promise<any> {
    console.log('Sending OCR request to:', '/api/v1/ocr/expense:extract')
    console.log('FormData:', formData)
    
    try {
      const response = await apiClient.post('/api/v1/ocr/expense:extract', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log('OCR response:', response.data)
      return response.data;
    } catch (error) {
      console.error('OCR request failed:', error)
      throw error
    }
  },

  async getOCRHealth(): Promise<any> {
    const response = await apiClient.get('/api/v1/ocr/health');
    return response.data;
  },

  async getOCRHistory(userId: string): Promise<any[]> {
    const response = await apiClient.get(`/api/v1/ocr/history?user_id=${userId}`);
    return response.data;
  },

  async markOCRSaved(jobId: string): Promise<any> {
    const response = await apiClient.post(`/api/v1/ocr/mark-saved/${jobId}`);
    return response.data;
  },

  // Transactions
  async createTransaction(transaction: TransactionCreate): Promise<Transaction> {
    const response = await apiClient.post<Transaction>('/api/v1/transactions/', transaction);
    return response.data;
  },

  async getSummary(userId: string, start: string, end: string): Promise<TransactionSummary> {
    const response = await apiClient.get<TransactionSummary>(`/api/v1/transactions/summary?user_id=${userId}&start=${start}&end=${end}`);
    return response.data;
  },

  // Health
  async healthCheck(): Promise<any> {
    const response = await apiClient.get('/health');
    return response.data;
  },

  async ping(): Promise<any> {
    const response = await apiClient.get('/api/v1/health/ping');
    return response.data;
  },
};

export default api;

