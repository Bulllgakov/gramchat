import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';
import { AccessLimitationBanner, RestrictedActionTooltip } from '../AccessLimitationBanner';
import { getApiUrl } from '../../config/api.config';

const API_URL = getApiUrl();

interface Manager {
  id: string;
  telegramId: string | null;
  firstName: string;
  lastName: string | null;
  username: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
  hasFullAccess: boolean;
  bots?: Array<{
    id: string;
    name: string;
    botUsername: string;
  }>;
}

interface InviteCodeData {
  code: string;
  comment: string;
  message: string;
  shopName: string;
}

export function ManagerManagement() {
  const { user } = useAuth();
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Состояние для создания инвайт-кода
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showInviteCode, setShowInviteCode] = useState<InviteCodeData | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    comment: ''
  });
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');

  // Проверяем права доступа
  const hasFullAccess = user?.role === 'ADMIN' || (user?.role === 'OWNER' && user?.hasFullAccess);

  useEffect(() => {
    fetchManagers();
  }, []);

  const fetchManagers = async () => {
    try {
      setError('');
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${API_URL}/managers/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setManagers(response.data.managers || []);
      } else {
        setError('Ошибка при загрузке списка менеджеров');
      }
    } catch (err: any) {
      console.error('Failed to fetch managers:', err);
      setError(err.response?.data?.error || 'Не удалось загрузить список менеджеров');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInviteCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setCreating(true);

    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.post(`${API_URL}/managers/create`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setShowInviteCode(response.data.inviteCode);
        setFormData({ firstName: '', lastName: '', comment: '' });
        setShowCreateForm(false);
        // Обновляем список менеджеров
        await fetchManagers();
      }
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'Ошибка при создании инвайт-кода');
    } finally {
      setCreating(false);
    }
  };

  const handleResetAccess = async (managerId: string, managerName: string) => {
    if (!confirm(`Создать новый инвайт-код для ${managerName}? Это заблокирует текущий доступ менеджера.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.post(`${API_URL}/managers/reset-access`, {
        userId: managerId,
        comment: `Новый инвайт-код для ${managerName}`
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setShowInviteCode(response.data.inviteCode);
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Ошибка при создании нового инвайт-кода');
    }
  };

  const handleRemoveManager = async (managerId: string, managerName: string) => {
    if (!confirm(`Удалить менеджера ${managerName} из магазина?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      await axios.delete(`/api/managers/${managerId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      await fetchManagers();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Ошибка при удалении менеджера');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Скопировано в буфер обмена');
    }).catch(() => {
      alert('Не удалось скопировать');
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2">Загрузка менеджеров...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Баннер ограничений для владельцев без полного доступа */}
      {user && <AccessLimitationBanner user={user} />}

      {/* Заголовок и кнопка создания */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Управление менеджерами</h2>
          <p className="text-sm text-gray-600 mt-1">
            Создавайте инвайт-коды для приглашения менеджеров в ваш магазин
          </p>
        </div>
        
        <RestrictedActionTooltip user={user!} action="inviteManager">
          <button
            onClick={() => hasFullAccess && setShowCreateForm(true)}
            disabled={!hasFullAccess}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              hasFullAccess
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Создать инвайт-код
          </button>
        </RestrictedActionTooltip>
      </div>

      {/* Ошибки */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Модальное окно с инвайт-кодом */}
      {showInviteCode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">
              Инвайт-код для менеджера создан
            </h3>
            
            <div className="space-y-4">
              {/* Инвайт-код */}
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <label className="text-sm font-medium text-blue-800 block mb-2">
                  Инвайт-код для регистрации:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={showInviteCode.code}
                    readOnly
                    className="flex-1 px-3 py-2 border rounded bg-white font-mono text-lg font-bold text-center text-blue-900"
                  />
                  <button
                    onClick={() => copyToClipboard(showInviteCode.code)}
                    className="p-2 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                    title="Копировать код"
                  >
                    📋
                  </button>
                </div>
              </div>

              {/* Комментарий */}
              {showInviteCode.comment && (
                <div>
                  <label className="text-sm font-medium text-gray-600 block mb-1">
                    Комментарий:
                  </label>
                  <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded border">
                    {showInviteCode.comment}
                  </p>
                </div>
              )}

              {/* Инструкции */}
              <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                <h4 className="text-sm font-medium text-yellow-800 mb-2">
                  Инструкция для менеджера:
                </h4>
                <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
                  <li>Перейти на страницу входа в систему</li>
                  <li>Нажать кнопку "Войти через Telegram"</li>
                  <li>Ввести полученный инвайт-код: <code className="font-mono bg-yellow-200 px-1 rounded">{showInviteCode.code}</code></li>
                  <li>Завершить авторизацию через Telegram</li>
                </ol>
              </div>

              <div className="text-xs text-gray-500">
                ⚠️ Инвайт-код одноразовый и привязан к вашему магазину "{showInviteCode.shopName}"
              </div>
            </div>

            <button
              onClick={() => setShowInviteCode(null)}
              className="mt-6 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}

      {/* Форма создания инвайт-кода */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">
              Создать инвайт-код для менеджера
            </h3>
            
            {formError && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateInviteCode} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Имя менеджера <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Введите имя менеджера"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Фамилия
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Введите фамилию менеджера"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Комментарий к инвайт-коду
                </label>
                <input
                  type="text"
                  value={formData.comment}
                  onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Например: Инвайт для Иван Петров - главный менеджер"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-800">
                      Будет создан одноразовый инвайт-код для авторизации менеджера через Telegram Widget.
                      Передайте код менеджеру для регистрации в системе.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {creating ? 'Создание...' : 'Создать инвайт-код'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setFormError('');
                    setFormData({ firstName: '', lastName: '', comment: '' });
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Список менеджеров */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Менеджеры магазина ({managers.length})
          </h3>
        </div>

        {managers.length === 0 ? (
          <div className="p-8 text-center">
            <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm">
              У вас пока нет менеджеров
            </p>
            <p className="text-gray-400 text-xs mt-1">
              Создайте инвайт-код для приглашения первого менеджера
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Менеджер
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Контакт
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Доступ к ботам
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Статус
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Добавлен
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {managers.map((manager) => (
                  <tr key={manager.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-medium text-sm">
                              {manager.firstName.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {manager.firstName} {manager.lastName}
                          </div>
                          <div className="text-xs text-gray-500">
                            Менеджер
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {manager.username ? (
                          <span className="inline-flex items-center">
                            <svg className="w-4 h-4 mr-1 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.56c-.21 2.27-1.13 7.75-1.6 10.29-.2 1.08-.59 1.44-.97 1.47-.83.07-1.46-.55-2.26-1.07-1.26-.82-1.96-1.33-3.18-2.13-1.41-.92-.5-1.42.31-2.25.21-.22 3.94-3.61 4.01-3.92.01-.04 0-.17-.06-.25s-.15-.09-.22-.07c-.09.02-1.56 1-4.41 2.91-.42.3-.8.44-1.14.44-.37 0-1.09-.21-1.63-.39-.65-.21-1.17-.33-1.13-.69.02-.19.29-.38.81-.58 3.18-1.39 5.31-2.3 6.38-2.75 3.04-1.26 3.67-1.48 4.08-1.49.09 0 .29.02.42.13.11.09.14.21.16.35-.01.04.01.19 0 .29z"/>
                            </svg>
                            @{manager.username}
                          </span>
                        ) : (
                          <span className="text-gray-500">
                            ID: {manager.telegramId}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-blue-600">
                        Telegram авторизация
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {manager.bots && manager.bots.length > 0 ? (
                        <div className="space-y-1">
                          {manager.bots.map((bot, index) => (
                            <div key={bot.id} className="text-xs">
                              <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                                {bot.name}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">
                          Все боты
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        manager.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {manager.isActive ? 'Активен' : 'Заблокирован'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(manager.createdAt).toLocaleDateString('ru-RU')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <div className="flex items-center justify-end space-x-2">
                        <RestrictedActionTooltip user={user!} action="inviteManager">
                          <button
                            onClick={() => hasFullAccess && handleResetAccess(manager.id, manager.firstName)}
                            disabled={!hasFullAccess}
                            className={`px-3 py-1 text-xs rounded-md transition-colors ${
                              hasFullAccess
                                ? 'text-blue-600 hover:text-blue-900 hover:bg-blue-50'
                                : 'text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            Новый код
                          </button>
                        </RestrictedActionTooltip>
                        <RestrictedActionTooltip user={user!} action="inviteManager">
                          <button
                            onClick={() => hasFullAccess && handleRemoveManager(manager.id, manager.firstName)}
                            disabled={!hasFullAccess}
                            className={`px-3 py-1 text-xs rounded-md transition-colors ${
                              hasFullAccess
                                ? 'text-red-600 hover:text-red-900 hover:bg-red-50'
                                : 'text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            Удалить
                          </button>
                        </RestrictedActionTooltip>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}