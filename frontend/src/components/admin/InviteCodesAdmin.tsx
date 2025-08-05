import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';

interface InviteCode {
  id: string;
  code: string;
  type: 'SINGLE' | 'MULTI';
  role: 'OWNER' | 'MANAGER';
  maxUses: number;
  usedCount: number;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
  comment: string | null;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string | null;
    username: string | null;
  };
  shop: {
    id: string;
    name: string;
  } | null;
  usedBy: Array<{
    id: string;
    firstName: string;
    lastName: string | null;
    username: string | null;
    telegramId: string;
  }>;
}

export function InviteCodesAdmin() {
  const { user } = useAuth();
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    role: 'OWNER' as 'OWNER' | 'MANAGER',
    type: 'SINGLE' as 'SINGLE' | 'MULTI',
    maxUses: 1,
    expiresInDays: 7,
    comment: ''
  });
  const [formError, setFormError] = useState('');
  const [showCode, setShowCode] = useState<string | null>(null);

  useEffect(() => {
    fetchInviteCodes();
  }, []);

  const fetchInviteCodes = async () => {
    try {
      setError('');
      const token = localStorage.getItem('authToken');
      const response = await axios.get('/api/admin/invite-codes', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setInviteCodes(response.data.inviteCodes || []);
      } else {
        setError('Ошибка при загрузке инвайт-кодов');
      }
    } catch (err: any) {
      console.error('Failed to fetch invite codes:', err);
      setError(err.response?.data?.error || 'Не удалось загрузить инвайт-коды');
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
      const response = await axios.post('/api/admin/invite-codes', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setShowCode(response.data.inviteCode.code);
        setShowCreateForm(false);
        setFormData({
          role: 'OWNER',
          type: 'SINGLE',
          maxUses: 1,
          expiresInDays: 7,
          comment: ''
        });
        await fetchInviteCodes();
      }
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'Ошибка при создании инвайт-кода');
    } finally {
      setCreating(false);
    }
  };

  const toggleCodeStatus = async (codeId: string) => {
    try {
      const token = localStorage.getItem('authToken');
      await axios.patch(`/api/admin/invite-codes/${codeId}/toggle`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchInviteCodes();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Ошибка при изменении статуса');
    }
  };

  const deleteCode = async (codeId: string) => {
    if (!confirm('Удалить инвайт-код?')) return;
    
    try {
      const token = localStorage.getItem('authToken');
      await axios.delete(`/api/admin/invite-codes/${codeId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchInviteCodes();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Ошибка при удалении');
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
        <span className="ml-2">Загрузка инвайт-кодов...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок и кнопка создания */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Управление инвайт-кодами</h2>
          <p className="text-sm text-gray-600 mt-1">
            Создавайте инвайт-коды для регистрации владельцев магазинов
          </p>
        </div>
        
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium transition-colors"
        >
          Создать инвайт-код
        </button>
      </div>

      {/* Ошибки */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Модальное окно с новым кодом */}
      {showCode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">
              Инвайт-код создан
            </h3>
            
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg mb-4">
              <div className="flex items-center justify-between">
                <code className="text-2xl font-mono font-bold text-green-800">
                  {showCode}
                </code>
                <button
                  onClick={() => copyToClipboard(showCode)}
                  className="p-2 text-green-600 hover:bg-green-100 rounded transition-colors"
                  title="Копировать"
                >
                  📋
                </button>
              </div>
            </div>

            <button
              onClick={() => setShowCode(null)}
              className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}

      {/* Форма создания */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">
              Создать инвайт-код
            </h3>
            
            {formError && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateInviteCode} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Роль пользователя
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as 'OWNER' | 'MANAGER' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="OWNER">Владелец магазина</option>
                  <option value="MANAGER">Менеджер</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Тип кода
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as 'SINGLE' | 'MULTI' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="SINGLE">Одноразовый</option>
                  <option value="MULTI">Многоразовый</option>
                </select>
              </div>

              {formData.type === 'MULTI' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Максимум использований
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={formData.maxUses}
                    onChange={(e) => setFormData({ ...formData, maxUses: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Срок действия (дней)
                </label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={formData.expiresInDays}
                  onChange={(e) => setFormData({ ...formData, expiresInDays: parseInt(e.target.value) || 7 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Комментарий
                </label>
                <input
                  type="text"
                  value={formData.comment}
                  onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Например: Для партнера Иван Петров"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {creating ? 'Создание...' : 'Создать'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setFormError('');
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

      {/* Таблица инвайт-кодов */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Инвайт-коды ({inviteCodes.length})
          </h3>
        </div>

        {inviteCodes.length === 0 ? (
          <div className="p-8 text-center">
            <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm">
              Инвайт-коды пока не созданы
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Код
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Тип / Роль
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Использован
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Истекает
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Создал
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Комментарий
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {inviteCodes.map((code) => (
                  <tr key={code.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <code className="font-mono text-sm font-bold text-gray-900">
                          {code.code}
                        </code>
                        <button
                          onClick={() => copyToClipboard(code.code)}
                          className="ml-2 p-1 text-gray-400 hover:text-gray-600"
                          title="Копировать"
                        >
                          📋
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          code.type === 'SINGLE' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                        }`}>
                          {code.type === 'SINGLE' ? 'Одноразовый' : 'Многоразовый'}
                        </span>
                        <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          code.role === 'OWNER' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                        }`}>
                          {code.role === 'OWNER' ? 'Владелец' : 'Менеджер'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {code.usedCount} / {code.maxUses}
                      {code.usedBy.length > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                          {code.usedBy.map(u => u.firstName).join(', ')}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {code.expiresAt ? new Date(code.expiresAt).toLocaleDateString('ru-RU') : 'Бессрочно'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {code.createdBy.firstName} {code.createdBy.lastName}
                      {code.shop && (
                        <div className="text-xs text-gray-400">
                          Магазин: {code.shop.name}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {code.comment || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <div className="flex items-center justify-end space-x-2">
                        {code.isActive ? (
                          <button
                            onClick={() => toggleCodeStatus(code.id)}
                            className="text-yellow-600 hover:text-yellow-900"
                          >
                            Деактивировать
                          </button>
                        ) : (
                          <button
                            onClick={() => toggleCodeStatus(code.id)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Активировать
                          </button>
                        )}
                        <button
                          onClick={() => deleteCode(code.id)}
                          className="text-red-600 hover:text-red-900"
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
        )}
      </div>

      {/* Инструкции */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">
          Как работают инвайт-коды:
        </h4>
        <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
          <li>Инвайт-коды для владельцев дают полный доступ после регистрации</li>
          <li>Владельцы без инвайт-кода получают ограниченный доступ</li>
          <li>Менеджеры могут регистрироваться только по инвайт-кодам</li>
          <li>Одноразовые коды становятся неактивными после использования</li>
          <li>Многоразовые коды можно использовать несколько раз</li>
        </ul>
      </div>
    </div>
  );
}