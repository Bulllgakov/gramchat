import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

import { getApiUrl } from '../../config/api.config';

const API_URL = getApiUrl();

interface CreateBotFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

// Функция нормализации username бота
function normalizeBotUsername(username: string): string {
  let normalized = username.trim();
  // Удаляем @ в начале если есть
  if (normalized.startsWith('@')) {
    normalized = normalized.substring(1);
  }
  // Удаляем все недопустимые символы
  normalized = normalized.replace(/[^a-zA-Z0-9_]/g, '');
  return normalized;
}

// Функция валидации username бота
function validateBotUsername(username: string): string | null {
  const normalized = normalizeBotUsername(username);
  
  if (normalized.length < 5 || normalized.length > 32) {
    return 'Username должен быть от 5 до 32 символов';
  }
  
  if (!normalized.toLowerCase().endsWith('bot')) {
    return 'Username должен заканчиваться на "bot"';
  }
  
  if (!/^[a-zA-Z0-9_]+$/.test(normalized)) {
    return 'Username может содержать только латинские буквы, цифры и подчеркивания';
  }
  
  return null;
}

// Функция валидации токена бота
function validateBotToken(token: string): boolean {
  const tokenRegex = /^\d+:[a-zA-Z0-9_-]+$/;
  return tokenRegex.test(token);
}

export function CreateBotForm({ onSuccess, onCancel }: CreateBotFormProps) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    botToken: '',
    botUsername: '',
    category: 'OTHER'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const categories = [
    { value: 'RETAIL', label: 'Розничная торговля' },
    { value: 'SERVICES', label: 'Услуги' },
    { value: 'FOOD', label: 'Еда и напитки' },
    { value: 'ELECTRONICS', label: 'Электроника' },
    { value: 'FASHION', label: 'Мода и одежда' },
    { value: 'HEALTH', label: 'Здоровье и красота' },
    { value: 'OTHER', label: 'Другое' }
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Очищаем ошибку для поля при изменении
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Название бота обязательно';
    }

    if (!formData.botToken.trim()) {
      newErrors.botToken = 'Токен бота обязателен';
    } else if (!validateBotToken(formData.botToken)) {
      newErrors.botToken = 'Неверный формат токена бота';
    }

    if (!formData.botUsername.trim()) {
      newErrors.botUsername = 'Username бота обязателен';
    } else {
      const usernameError = validateBotUsername(formData.botUsername);
      if (usernameError) {
        newErrors.botUsername = usernameError;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      
      // Нормализуем username перед отправкой
      const normalizedData = {
        ...formData,
        botUsername: normalizeBotUsername(formData.botUsername)
      };
      
      await axios.post(`${API_URL}/bots`, normalizedData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Error creating bot:', error);
      if (error.response?.data?.message) {
        setErrors({ submit: error.response.data.message });
      } else {
        setErrors({ submit: 'Произошла ошибка при подключении бота' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Подключение Telegram бота</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Название бота
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Мой бот поддержки"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
        </div>

        <div>
          <label htmlFor="botToken" className="block text-sm font-medium text-gray-700 mb-1">
            Токен бота
          </label>
          <input
            type="text"
            id="botToken"
            name="botToken"
            value={formData.botToken}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.botToken ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="123456789:ABCdefGHIjklMNOpqrSTUvwxYZ"
          />
          {errors.botToken && (
            <p className="mt-1 text-sm text-red-600">{errors.botToken}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Получите токен у @BotFather в Telegram
          </p>
        </div>

        <div>
          <label htmlFor="botUsername" className="block text-sm font-medium text-gray-700 mb-1">
            Username бота
          </label>
          <input
            type="text"
            id="botUsername"
            name="botUsername"
            value={formData.botUsername}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.botUsername ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="@mysupport_bot"
          />
          {errors.botUsername && (
            <p className="mt-1 text-sm text-red-600">{errors.botUsername}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Username вашего бота в Telegram (с @ или без)
          </p>
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
            Категория
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        {errors.submit && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600 mb-2">{errors.submit}</p>
            {errors.submit.includes('уже подключили') && (
              <button
                type="button"
                onClick={() => navigate('/')}
                className="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
              >
                Перейти на главную
              </button>
            )}
          </div>
        )}

        <div className="flex gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 py-2 px-4 rounded-md border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Отмена
            </button>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className={`flex-1 py-2 px-4 rounded-md text-white font-medium transition-colors ${
              isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
            }`}
          >
            {isLoading ? 'Подключение...' : 'Подключить бота'}
          </button>
        </div>
      </form>
    </div>
  );
}