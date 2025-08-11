import { useState, useEffect } from 'react';
import axios from 'axios';
import { getApiUrl } from '../../config/api.config';

const API_URL = getApiUrl();

interface InviteCode {
  id: string;
  code: string;
  type: 'SINGLE' | 'MULTI';
  maxUses: number;
  usedCount: number;
  isActive: boolean;
  expiresAt?: string;
  comment?: string;
  createdAt: string;
  usedByUsers: Array<{
    id: string;
    firstName: string;
    lastName: string;
    username?: string;
    createdAt: string;
  }>;
}

export function InviteCodesManagement() {
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    comment: '',
    maxUses: 1,
    expiresInDays: 30
  });
  const [selectedCode, setSelectedCode] = useState<InviteCode | null>(null);

  useEffect(() => {
    fetchInviteCodes();
  }, []);

  const fetchInviteCodes = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${API_URL}/owner/invite-codes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInviteCodes(response.data.codes);
    } catch (err) {
      console.error('Error fetching invite codes:', err);
    } finally {
      setLoading(false);
    }
  };

  const createInviteCode = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('authToken');
      await axios.post(`${API_URL}/owner/invite-codes`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowCreateForm(false);
      setFormData({ comment: '', maxUses: 1, expiresInDays: 30 });
      await fetchInviteCodes();
    } catch (err) {
      alert('Ошибка создания инвайт-кода');
    }
  };

  const deactivateCode = async (codeId: string) => {
    try {
      const token = localStorage.getItem('authToken');
      await axios.patch(`/api/owner/invite-codes/${codeId}/deactivate`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchInviteCodes();
    } catch (err) {
      alert('Ошибка деактивации кода');
    }
  };

  const copyToClipboard = (text: string, message: string = 'Скопировано в буфер обмена') => {
    navigator.clipboard.writeText(text);
    // Показываем временное уведомление вместо alert
    const notification = document.createElement('div');
    notification.className = 'fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50';
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 2000);
  };

  const getInviteLink = (code: string) => {
    return `${window.location.origin}/auth?invite=${code}`;
  };

  if (loading) {
    return <div className="text-center py-8">Загрузка...</div>;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="p-6 border-b border-gray-100">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Инвайт-коды для менеджеров</h3>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Создать инвайт-код
          </button>
        </div>
      </div>

      {showCreateForm && (
        <div className="p-6 bg-gray-50 border-b border-gray-100">
          <form onSubmit={createInviteCode} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Комментарий (опционально)
              </label>
              <input
                type="text"
                value={formData.comment}
                onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Например: Для менеджера Ивана"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Количество использований
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={formData.maxUses}
                  onChange={(e) => setFormData({ ...formData, maxUses: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Действителен дней
                </label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={formData.expiresInDays}
                  onChange={(e) => setFormData({ ...formData, expiresInDays: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Создать код
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Отмена
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Код
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Использовано
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Статус
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Истекает
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Комментарий
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Действия
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {inviteCodes.map((code) => (
              <tr key={code.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                      {code.code}
                    </code>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => copyToClipboard(code.code, 'Код скопирован')}
                        className="text-gray-400 hover:text-gray-600"
                        title="Копировать код"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => copyToClipboard(getInviteLink(code.code), 'Ссылка скопирована')}
                        className="text-gray-400 hover:text-gray-600"
                        title="Копировать ссылку для регистрации"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-900">
                    {code.usedCount} / {code.maxUses}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {code.isActive ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Активен
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      Неактивен
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-500">
                    {code.expiresAt 
                      ? new Date(code.expiresAt).toLocaleDateString('ru-RU')
                      : 'Бессрочно'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-500">
                    {code.comment || '-'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {code.usedByUsers.length > 0 && (
                      <button
                        onClick={() => setSelectedCode(code)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Детали
                      </button>
                    )}
                    {code.isActive && code.usedCount < code.maxUses && (
                      <button
                        onClick={() => deactivateCode(code.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Деактивировать
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {inviteCodes.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          Нет созданных инвайт-кодов
        </div>
      )}

      {/* Модальное окно с деталями */}
      {selectedCode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Детали инвайт-кода</h3>
                  <div className="mt-2 space-y-1">
                    <div className="text-sm text-gray-600 space-y-1">
                      <div className="flex items-center gap-2">
                        <span>Код:</span>
                        <code className="font-mono bg-gray-100 px-2 py-1 rounded">{selectedCode.code}</code>
                        <button
                          onClick={() => copyToClipboard(selectedCode.code, 'Код скопирован')}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>Ссылка:</span>
                        <code className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">{getInviteLink(selectedCode.code)}</code>
                        <button
                          onClick={() => copyToClipboard(getInviteLink(selectedCode.code), 'Ссылка скопирована')}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    {selectedCode.comment && (
                      <p className="text-sm text-gray-600">Комментарий: {selectedCode.comment}</p>
                    )}
                    <p className="text-sm text-gray-600">
                      Создан: {new Date(selectedCode.createdAt).toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCode(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <h4 className="text-sm font-medium text-gray-700 mb-4">
                Зарегистрированные пользователи ({selectedCode.usedByUsers.length})
              </h4>
              
              {selectedCode.usedByUsers.length > 0 ? (
                <div className="space-y-3">
                  {selectedCode.usedByUsers.map(user => (
                    <div key={user.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </div>
                          {user.username && (
                            <div className="text-sm text-gray-600 mt-1">
                              Telegram: @{user.username}
                            </div>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 text-right">
                          <div>Зарегистрирован:</div>
                          <div>{new Date(user.createdAt).toLocaleDateString('ru-RU', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}</div>
                          <div className="text-xs">
                            {new Date(user.createdAt).toLocaleTimeString('ru-RU', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Этот код еще не был использован
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}