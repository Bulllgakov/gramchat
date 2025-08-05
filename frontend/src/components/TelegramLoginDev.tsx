import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface TelegramLoginDevProps {
  inviteCode?: string;
}

export function TelegramLoginDev({ inviteCode }: TelegramLoginDevProps) {
  const [telegramId, setTelegramId] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Создаем фиктивные данные для разработки
      const authData = {
        id: parseInt(telegramId),
        first_name: firstName,
        last_name: lastName || undefined,
        username: username || undefined,
        auth_date: Math.floor(Date.now() / 1000),
        hash: 'dev_hash_' + telegramId, // Фиктивный хеш для разработки
        inviteCode
      };

      const response = await axios.post('/api/auth/telegram-widget-login', authData);
      const { token, user } = response.data;
      
      // Сохраняем токен
      localStorage.setItem('authToken', token);
      
      // Перенаправляем в зависимости от роли и статуса
      if (user.needsShopCreation) {
        navigate('/create-shop');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Ошибка авторизации';
      setError(errorMessage);
      console.error('Telegram login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-700">
          <strong>Режим разработки:</strong> Имитация Telegram авторизации
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="telegramId" className="block text-sm font-medium text-gray-700 mb-1">
            Telegram ID
          </label>
          <input
            type="number"
            id="telegramId"
            value={telegramId}
            onChange={(e) => setTelegramId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="123456789"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Ваш Telegram ID (можно узнать у @userinfobot)
          </p>
        </div>

        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
            Имя
          </label>
          <input
            type="text"
            id="firstName"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Иван"
            required
          />
        </div>

        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
            Фамилия (необязательно)
          </label>
          <input
            type="text"
            id="lastName"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Иванов"
          />
        </div>

        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
            Username (необязательно)
          </label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="@username"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Авторизация...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.56c-.21 2.27-1.13 7.75-1.6 10.29-.2 1.08-.59 1.44-.97 1.47-.83.07-1.46-.55-2.26-1.07-1.26-.82-1.96-1.33-3.18-2.13-1.41-.92-.5-1.42.31-2.25.21-.22 3.94-3.61 4.01-3.92.01-.04 0-.17-.06-.25s-.15-.09-.22-.07c-.09.02-1.56 1-4.41 2.91-.42.3-.8.44-1.14.44-.37 0-1.09-.21-1.63-.39-.65-.21-1.17-.33-1.13-.69.02-.19.29-.38.81-.58 3.18-1.39 5.31-2.3 6.38-2.75 3.04-1.26 3.67-1.48 4.08-1.49.09 0 .29.02.42.13.11.09.14.21.16.35-.01.04.01.19 0 .29z"/>
              </svg>
              Войти (DEV режим)
            </>
          )}
        </button>
      </form>

      <div className="text-center">
        <p className="text-xs text-gray-500">
          В продакции используется настоящая авторизация через Telegram
        </p>
      </div>
    </div>
  );
}