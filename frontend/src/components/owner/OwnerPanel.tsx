import { useState } from 'react';
import { InviteCodesManagement } from './InviteCodesManagement';
import { ManagersList } from './ManagersList';
import { ManagerManagement } from './ManagerManagement';

export function OwnerPanel() {
  const [activeTab, setActiveTab] = useState('email-managers');

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Управление персоналом</h2>
      
      <div className="bg-white rounded-lg shadow">
        <div className="border-b">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('email-managers')}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'email-managers'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Менеджеры (Email)
            </button>
            <button
              onClick={() => setActiveTab('telegram-managers')}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'telegram-managers'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Менеджеры (Telegram)
            </button>
            <button
              onClick={() => setActiveTab('invites')}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'invites'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Инвайт-коды
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'email-managers' && <ManagerManagement />}
          {activeTab === 'telegram-managers' && <ManagersList />}
          {activeTab === 'invites' && <InviteCodesManagement />}
        </div>
      </div>

      {/* Инструкции в зависимости от выбранной вкладки */}
      {activeTab === 'email-managers' && (
        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-green-900 mb-2">
            Управление менеджерами через Email:
          </h3>
          <ul className="text-sm text-green-700 space-y-1 list-disc list-inside">
            <li>Создайте менеджера с указанием email адреса</li>
            <li>Пароль будет сгенерирован автоматически</li>
            <li>Данные для входа отправятся на email или вы можете скопировать их</li>
            <li>Менеджер сможет войти используя email и пароль</li>
            <li>При первом входе менеджер должен будет сменить пароль</li>
          </ul>
        </div>
      )}

      {activeTab === 'telegram-managers' && (
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">
            Менеджеры с Telegram авторизацией:
          </h3>
          <p className="text-sm text-blue-700">
            Здесь отображаются менеджеры, которые зарегистрировались через Telegram бот используя инвайт-коды.
          </p>
        </div>
      )}

      {activeTab === 'invites' && (
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">
            Как добавить менеджера через Telegram:
          </h3>
          <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
            <li>Создайте новый инвайт-код</li>
            <li>Скопируйте код и отправьте менеджеру</li>
            <li>Менеджер должен:</li>
            <ul className="ml-6 mt-1 list-disc list-inside">
              <li>Перейти к боту @gramchatauth_bot</li>
              <li>Нажать /start</li>
              <li>Отправить команду /login КОД</li>
            </ul>
            <li>После регистрации менеджер появится в списке</li>
          </ol>
        </div>
      )}
    </div>
  );
}