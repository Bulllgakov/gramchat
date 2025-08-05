import axios, { AxiosError } from 'axios';
import { getFriendlyErrorMessage } from './errorMessages';

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: any;
}

// Обработчик ошибок API
export function handleApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<any>;
    
    // Обработка различных типов ошибок
    if (axiosError.response) {
      // Сервер вернул ошибку
      const status = axiosError.response.status;
      const data = axiosError.response.data;
      
      const rawMessage = data?.message || data?.error || '';
      const message = getFriendlyErrorMessage({ 
        message: rawMessage, 
        status, 
        code: data?.code 
      });
      
      return {
        message,
        status,
        code: data?.code,
        details: data?.details
      };
    } else if (axiosError.request) {
      // Запрос был отправлен, но ответ не получен
      return {
        message: 'Сервер не отвечает. Проверьте подключение к интернету',
        code: 'NETWORK_ERROR'
      };
    } else {
      // Ошибка при настройке запроса
      return {
        message: axiosError.message || 'Ошибка при отправке запроса',
        code: 'REQUEST_ERROR'
      };
    }
  }
  
  // Не axios ошибка
  if (error instanceof Error) {
    return {
      message: error.message,
      code: 'UNKNOWN_ERROR'
    };
  }
  
  return {
    message: 'Неизвестная ошибка',
    code: 'UNKNOWN_ERROR'
  };
}

// Глобальный обработчик для непойманных ошибок
export function setupGlobalErrorHandlers() {
  // Обработка непойманных ошибок промисов
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    
    // Можно показать уведомление пользователю
    showErrorNotification('Произошла непредвиденная ошибка');
    
    // Предотвращаем дефолтное поведение браузера
    event.preventDefault();
  });
  
  // Обработка обычных JS ошибок
  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    
    // Не показываем уведомления для ошибок загрузки ресурсов
    if (event.message.includes('ResizeObserver') || 
        event.message.includes('Non-Error promise rejection captured')) {
      return;
    }
    
    showErrorNotification('Произошла ошибка в приложении');
  });
}

// Функция для показа уведомлений об ошибках
let errorNotificationTimeout: NodeJS.Timeout | null = null;

export function showErrorNotification(message: string, duration: number = 5000) {
  // Удаляем предыдущее уведомление если есть
  const existingNotification = document.getElementById('error-notification');
  if (existingNotification) {
    existingNotification.remove();
  }
  
  // Очищаем таймаут предыдущего уведомления
  if (errorNotificationTimeout) {
    clearTimeout(errorNotificationTimeout);
  }
  
  // Создаем новое уведомление
  const notification = document.createElement('div');
  notification.id = 'error-notification';
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background-color: #f44336;
    color: white;
    padding: 16px 24px;
    border-radius: 4px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    z-index: 10000;
    max-width: 400px;
    animation: slideIn 0.3s ease-out;
  `;
  
  notification.innerHTML = `
    <div style="display: flex; align-items: center; gap: 12px;">
      <svg style="width: 24px; height: 24px; flex-shrink: 0;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <div style="flex: 1;">${message}</div>
      <button onclick="this.parentElement.parentElement.remove()" style="
        background: transparent;
        border: none;
        color: white;
        cursor: pointer;
        padding: 4px;
        margin-left: 8px;
      ">
        <svg style="width: 20px; height: 20px;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  `;
  
  // Добавляем стили анимации
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `;
  document.head.appendChild(style);
  
  document.body.appendChild(notification);
  
  // Автоматически удаляем через указанное время
  errorNotificationTimeout = setTimeout(() => {
    notification.remove();
  }, duration);
}

// Функция для показа успешных уведомлений
export function showSuccessNotification(message: string, duration: number = 3000) {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background-color: #4caf50;
    color: white;
    padding: 16px 24px;
    border-radius: 4px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    z-index: 10000;
    max-width: 400px;
    animation: slideIn 0.3s ease-out;
  `;
  
  notification.innerHTML = `
    <div style="display: flex; align-items: center; gap: 12px;">
      <svg style="width: 24px; height: 24px;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <div>${message}</div>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, duration);
}