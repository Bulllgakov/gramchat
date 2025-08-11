import { useState } from 'react';
import axios from 'axios';

import { getApiUrl } from '../../config/api.config';

const API_URL = getApiUrl();

interface CreateShopFormProps {
  onSuccess?: () => void;
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

export function CreateShopForm({ onSuccess }: CreateShopFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    botToken: '',
    botUsername: '',
    category: ''
  });
  const [error, setError] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [tokenError, setTokenError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUsernameChange = (value: string) => {
    // Разрешаем вводить только допустимые символы
    const filtered = value.replace(/[^a-zA-Z0-9_@]/g, '');
    setFormData({ ...formData, botUsername: filtered });
    
    // Валидация
    if (filtered) {
      const error = validateBotUsername(filtered);
      setUsernameError(error || '');
    } else {
      setUsernameError('');
    }
  };

  const handleTokenChange = (value: string) => {
    setFormData({ ...formData, botToken: value });
    
    if (value && !validateBotToken(value)) {
      setTokenError('Неверный формат токена');
    } else {
      setTokenError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Финальная валидация
    const usernameValidation = validateBotUsername(formData.botUsername);
    if (usernameValidation) {
      setUsernameError(usernameValidation);
      return;
    }
    
    if (!validateBotToken(formData.botToken)) {
      setTokenError('Неверный формат токена');
      return;
    }
    
    setLoading(true);

    try {
      const token = localStorage.getItem('authToken');
      
      // Нормализуем username перед отправкой
      const normalizedData = {
        ...formData,
        botUsername: normalizeBotUsername(formData.botUsername)
      };
      
      await axios.post(`${API_URL}/shops`, normalizedData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка при создании магазина');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Информационный блок о системе владения */}
      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">
          ⚠️ Важная информация о владении ботом
        </h3>
        <div className="space-y-2 text-sm text-blue-800">
          <p>
            <strong>Первый, кто подключит бота, становится его владельцем!</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Владелец может приглашать менеджеров для управления чатами</li>
            <li>Только владелец может управлять настройками магазина</li>
            <li>Один бот может быть подключен только к одному магазину</li>
          </ul>
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-yellow-800">
              <strong>Если бот уже используется в системе:</strong>
            </p>
            <ul className="list-disc list-inside mt-1 ml-2 text-yellow-700">
              <li>Обратитесь к текущему владельцу бота за доступом</li>
              <li>Или создайте нового бота через @BotFather</li>
              <li>Если вы владелец - смените токен бота и попробуйте снова</li>
            </ul>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
        <label className="block text-sm font-medium text-gray-700">
          Название магазина
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Токен бота
        </label>
        <input
          type="text"
          value={formData.botToken}
          onChange={(e) => handleTokenChange(e.target.value)}
          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-1 ${
            tokenError 
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
          }`}
          placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
          required
        />
        {tokenError && (
          <p className="mt-1 text-sm text-red-600">{tokenError}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">Получите токен у @BotFather в Telegram</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Username бота
        </label>
        <input
          type="text"
          value={formData.botUsername}
          onChange={(e) => handleUsernameChange(e.target.value)}
          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-1 ${
            usernameError 
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
          }`}
          placeholder="example_bot"
          required
        />
        {usernameError && (
          <p className="mt-1 text-sm text-red-600">{usernameError}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          Только латинские буквы, цифры и подчеркивания. Должен заканчиваться на "bot"
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Категория
        </label>
        <select
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          required
        >
          <option value="">Выберите категорию</option>
          <option value="RETAIL">Розничная торговля</option>
          <option value="SERVICES">Услуги</option>
          <option value="FOOD">Еда и напитки</option>
          <option value="ELECTRONICS">Электроника</option>
          <option value="FASHION">Мода и одежда</option>
          <option value="HEALTH">Здоровье и красота</option>
          <option value="OTHER">Другое</option>
        </select>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !!usernameError || !!tokenError}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Создание...' : 'Создать магазин'}
      </button>
    </form>
    </div>
  );
}