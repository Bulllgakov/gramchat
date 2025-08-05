import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { withRetry } from '../utils/retryUtils';
import { handleApiError } from '../utils/errorHandler';

class ApiService {
  private client: AxiosInstance;
  
  constructor() {
    this.client = axios.create({
      baseURL: '/api',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('authToken');
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
    
    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('authToken');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }
  
  // GET запрос с retry
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await withRetry(() => this.client.get<T>(url, config));
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }
  
  // POST запрос с retry для безопасных операций
  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      // Не используем retry для POST по умолчанию (может создать дубликаты)
      const response = await this.client.post<T>(url, data, config);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }
  
  // POST запрос с retry для идемпотентных операций
  async postWithRetry<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await withRetry(() => this.client.post<T>(url, data, config));
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }
  
  // PUT запрос с retry (идемпотентный)
  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await withRetry(() => this.client.put<T>(url, data, config));
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }
  
  // DELETE запрос с retry (идемпотентный)
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await withRetry(() => this.client.delete<T>(url, config));
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }
  
  // PATCH запрос с retry (идемпотентный)
  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await withRetry(() => this.client.patch<T>(url, data, config));
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }
}

export const apiService = new ApiService();