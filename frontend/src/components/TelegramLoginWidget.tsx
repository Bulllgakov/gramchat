import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { TelegramLoginDev } from './TelegramLoginDev';

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

interface TelegramLoginWidgetProps {
  botUsername: string;
  buttonSize?: 'large' | 'medium' | 'small';
  cornerRadius?: number;
  requestAccess?: 'write';
  onAuth?: (user: TelegramUser) => void;
  inviteCode?: string;
}

export function TelegramLoginWidget({ 
  botUsername, 
  buttonSize = 'large',
  cornerRadius = 10,
  requestAccess,
  onAuth,
  inviteCode 
}: TelegramLoginWidgetProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDev, setIsDev] = useState(false);
  const navigate = useNavigate();

  // Проверяем, является ли это dev окружением
  useEffect(() => {
    const isDevEnv = import.meta.env.DEV || window.location.hostname === 'localhost';
    setIsDev(isDevEnv);
  }, []);

  useEffect(() => {
    // В dev режиме не загружаем Telegram Widget
    if (isDev) return;
    
    // Загружаем Telegram Widget script
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', botUsername);
    script.setAttribute('data-size', buttonSize);
    script.setAttribute('data-radius', cornerRadius.toString());
    if (requestAccess) {
      script.setAttribute('data-request-access', requestAccess);
    }
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.async = true;

    // Добавляем глобальную функцию для обработки авторизации
    (window as any).onTelegramAuth = handleTelegramAuth;

    const widgetContainer = document.getElementById('telegram-login-widget');
    if (widgetContainer) {
      widgetContainer.appendChild(script);
    }

    return () => {
      // Очищаем при размонтировании
      delete (window as any).onTelegramAuth;
      if (widgetContainer && script.parentNode) {
        widgetContainer.removeChild(script);
      }
    };
  }, [botUsername, buttonSize, cornerRadius, requestAccess, isDev]);

  const handleTelegramAuth = async (user: TelegramUser) => {
    setIsLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/auth/telegram-widget-login', {
        ...user,
        inviteCode
      });

      const { token, user: userData } = response.data;
      
      // Сохраняем токен
      localStorage.setItem('authToken', token);
      
      // Вызываем callback если есть
      if (onAuth) {
        onAuth(user);
      }
      
      // Перенаправляем в зависимости от роли и статуса
      if (userData.needsShopCreation) {
        navigate('/create-shop');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Ошибка авторизации';
      setError(errorMessage);
      console.error('Telegram login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // В dev режиме показываем форму для ввода данных
  if (isDev) {
    return <TelegramLoginDev inviteCode={inviteCode} />;
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}
      
      <div id="telegram-login-widget" className="flex justify-center">
        {isLoading && (
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-gray-600">Авторизация...</span>
          </div>
        )}
      </div>
      
      <div className="text-center">
        <p className="text-xs text-gray-500">
          Нажимая "Войти через Telegram", вы соглашаетесь с условиями использования
        </p>
      </div>
    </div>
  );
}

interface TelegramLoginWithInviteProps {
  botUsername: string;
}

export function TelegramLoginWithInvite({ botUsername }: TelegramLoginWithInviteProps) {
  const [showInviteInput, setShowInviteInput] = useState(false);
  const [inviteCode, setInviteCode] = useState('');

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Вход для владельцев и администраторов
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Войдите через Telegram для быстрого доступа к системе
        </p>
      </div>

      {!showInviteInput && (
        <div className="flex flex-col space-y-3">
          <TelegramLoginWidget 
            botUsername={botUsername}
            buttonSize="large"
          />
          
          <div className="text-center">
            <button
              onClick={() => setShowInviteInput(true)}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              У меня есть инвайт-код
            </button>
          </div>
        </div>
      )}

      {showInviteInput && (
        <div className="space-y-4">
          <div>
            <label htmlFor="inviteCode" className="block text-sm font-medium text-gray-700 mb-1">
              Инвайт-код (для полного доступа)
            </label>
            <input
              type="text"
              id="inviteCode"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Введите инвайт-код"
            />
          </div>
          
          <TelegramLoginWidget 
            botUsername={botUsername}
            buttonSize="large"
            inviteCode={inviteCode}
          />
          
          <div className="text-center">
            <button
              onClick={() => setShowInviteInput(false)}
              className="text-sm text-gray-600 hover:text-gray-800 underline"
            >
              Войти без инвайт-кода (ограниченный доступ)
            </button>
          </div>
        </div>
      )}

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-700">
          <strong>Без инвайт-кода:</strong> ограниченный доступ (нельзя отправлять сообщения и приглашать менеджеров)
          <br />
          <strong>С инвайт-кодом:</strong> полный доступ ко всем функциям
        </p>
      </div>
    </div>
  );
}