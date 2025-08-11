import { useState, useEffect } from 'react';
import axios from 'axios';
import { getApiUrl } from '../../config/api.config';

const API_URL = getApiUrl();

interface Manager {
  id: string;
  firstName: string;
  lastName: string;
  username?: string;
  email?: string;
  isActive: boolean;
  createdAt: string;
  requirePasswordChange?: boolean;
  inviteCode?: {
    code: string;
    comment?: string;
  };
}

export function ManagersList() {
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchManagers();
  }, []);

  const fetchManagers = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${API_URL}/owner/managers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setManagers(response.data.managers);
    } catch (err) {
      console.error('Error fetching managers:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleManagerStatus = async (managerId: string) => {
    try {
      const token = localStorage.getItem('authToken');
      await axios.patch(`/api/owner/managers/${managerId}/toggle`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchManagers();
    } catch (err) {
      alert('Ошибка изменения статуса менеджера');
    }
  };

  const removeManager = async (managerId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этого менеджера? Он потеряет доступ к системе.')) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      await axios.delete(`/api/owner/managers/${managerId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchManagers();
    } catch (err) {
      alert('Ошибка удаления менеджера');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Загрузка...</div>;
  }

  // Фильтруем только менеджеров с Telegram авторизацией (без email)
  const telegramManagers = managers.filter(m => !m.email);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="p-6 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900">Менеджеры с Telegram авторизацией</h3>
        <p className="text-sm text-gray-500 mt-1">
          Менеджеры, зарегистрированные через Telegram бот
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Менеджер
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Telegram
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Статус
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Дата регистрации
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Инвайт-код
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Действия
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {telegramManagers.map((manager) => (
              <tr key={manager.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">
                    {manager.firstName} {manager.lastName}
                  </div>
                </td>
                <td className="px-6 py-4">
                  {manager.username ? (
                    <a 
                      href={`https://t.me/${manager.username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      @{manager.username}
                    </a>
                  ) : (
                    <span className="text-sm text-gray-400">Не указан</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => toggleManagerStatus(manager.id)}
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      manager.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {manager.isActive ? 'Активен' : 'Заблокирован'}
                  </button>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-500">
                    {new Date(manager.createdAt).toLocaleDateString('ru-RU')}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {manager.inviteCode ? (
                    <div className="text-sm">
                      <code className="font-mono bg-gray-100 px-1 rounded">
                        {manager.inviteCode.code}
                      </code>
                      {manager.inviteCode.comment && (
                        <p className="text-xs text-gray-500 mt-1">
                          {manager.inviteCode.comment}
                        </p>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleManagerStatus(manager.id)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      {manager.isActive ? 'Заблокировать' : 'Разблокировать'}
                    </button>
                    <button
                      onClick={() => removeManager(manager.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Удалить
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {telegramManagers.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>У вас пока нет менеджеров с Telegram авторизацией</p>
          <p className="text-sm mt-2">Создайте инвайт-код и поделитесь им с менеджером</p>
        </div>
      )}
    </div>
  );
}