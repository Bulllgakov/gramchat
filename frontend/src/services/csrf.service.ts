import axios from 'axios';
import { getApiUrl } from '../config/api.config';

const API_URL = getApiUrl();

class CsrfService {
  private csrfToken: string = '';

  async getToken(): Promise<string> {
    if (this.csrfToken) {
      return this.csrfToken;
    }

    try {
      const response = await axios.get(`${API_URL}/csrf-token`);
      this.csrfToken = response.data.csrfToken;
      
      // Обновляем токен в axios по умолчанию
      axios.defaults.headers.common['X-CSRF-Token'] = this.csrfToken;
      
      return this.csrfToken;
    } catch (error) {
      console.error('Failed to fetch CSRF token:', error);
      throw error;
    }
  }

  clearToken() {
    this.csrfToken = '';
    delete axios.defaults.headers.common['X-CSRF-Token'];
  }

  // Обновить токен после ошибки
  async refreshToken(): Promise<string> {
    this.clearToken();
    return this.getToken();
  }
}

export const csrfService = new CsrfService();

// Интерцептор для автоматической обработки CSRF ошибок
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Если ошибка CSRF и это не повторный запрос
    if (error.response?.status === 403 && 
        error.response?.data?.error?.includes('CSRF') && 
        !originalRequest._retry) {
      
      originalRequest._retry = true;
      
      try {
        // Обновляем CSRF токен
        const newToken = await csrfService.refreshToken();
        originalRequest.headers['X-CSRF-Token'] = newToken;
        
        // Повторяем запрос
        return axios(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);