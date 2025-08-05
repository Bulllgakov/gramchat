import React from 'react';
import { TelegramLoginWithInvite } from '../components/TelegramLoginWidget';

export function LoginPage() {


  // Получаем имя бота из переменных окружения или конфига
  const BOT_USERNAME = import.meta.env.VITE_TELEGRAM_AUTH_BOT_USERNAME || 'gramchatauth_bot';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">GramChat</h1>
          <p className="text-gray-600">Вход в систему</p>
        </div>

        <TelegramLoginWithInvite botUsername={BOT_USERNAME} />

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Все пользователи авторизуются через Telegram.
            Менеджеры должны использовать инвайт-код от владельца магазина.
          </p>
        </div>
      </div>
    </div>
  );
}