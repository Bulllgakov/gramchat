import { useState, useEffect } from 'react';
import axios from 'axios';
import { UserDetailsModal } from './UserDetailsModal';
import { getApiUrl } from '../../config/api.config';

const API_URL = getApiUrl();

interface User {
  id: string;
  telegramId: string;
  firstName: string;
  lastName?: string;
  username?: string;
  role: 'ADMIN' | 'OWNER' | 'MANAGER';
  isActive: boolean;
  hasFullAccess: boolean;
  createdAt: string;
  ownedShop?: { name: string };
  managedShop?: { name: string };
  inviteCode?: { code: string };
}

export function UsersList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('authToken');
      console.log('Token:', token); // Для отладки
      
      const response = await axios.get(`${API_URL}/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setUsers(response.data.users);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.response?.data?.message || err.message || 'Ошибка загрузки пользователей');
    } finally {
      setLoading(false);
    }
  };

  const changeUserRole = async (userId: string, newRole: string) => {
    try {
      const token = localStorage.getItem('authToken');
      await axios.patch(
        `${API_URL}/admin/users/${userId}/role`,
        { role: newRole },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      await fetchUsers();
      setEditingUserId(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Ошибка изменения роли');
    }
  };

  const toggleUserStatus = async (userId: string) => {
    try {
      const token = localStorage.getItem('authToken');
      await axios.patch(
        `${API_URL}/admin/users/${userId}/toggle`,
        {},
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      await fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Ошибка изменения статуса');
    }
  };

  const openUserDetails = (userId: string) => {
    setSelectedUserId(userId);
    setIsModalOpen(true);
  };

  const closeUserDetails = () => {
    setSelectedUserId(null);
    setIsModalOpen(false);
  };

  const handleAccessGranted = () => {
    // Обновляем список пользователей после предоставления доступа
    fetchUsers();
  };

  if (loading) return <div>Загрузка...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div>
      <h3 className="text-lg font-medium mb-4">Управление пользователями</h3>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Пользователь
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Telegram
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Роль
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Магазин
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Статус
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Модерация
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Дата регистрации
              </th>
              <th className="relative px-6 py-3">
                <span className="sr-only">Действия</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {user.firstName} {user.lastName}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {user.username ? `@${user.username}` : user.telegramId}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingUserId === user.id ? (
                    <select
                      value={user.role}
                      onChange={(e) => changeUserRole(user.id, e.target.value)}
                      onBlur={() => setEditingUserId(null)}
                      className="text-sm rounded border-gray-300"
                      autoFocus
                    >
                      <option value="MANAGER">MANAGER</option>
                      <option value="OWNER">OWNER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  ) : (
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full cursor-pointer
                        ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 
                          user.role === 'OWNER' ? 'bg-blue-100 text-blue-800' : 
                          'bg-gray-100 text-gray-800'}`}
                      onClick={() => setEditingUserId(user.id)}
                    >
                      {user.role}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.ownedShop?.name || user.managedShop?.name || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                      ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                  >
                    {user.isActive ? 'Активен' : 'Заблокирован'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {user.role === 'OWNER' ? (
                    <div className="flex items-center">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                          ${user.hasFullAccess ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}
                      >
                        {user.hasFullAccess ? 'Пройдена' : 'Ожидает'}
                      </span>
                      {!user.hasFullAccess && (
                        <svg className="ml-1 w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-500">Не требуется</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(user.createdAt).toLocaleDateString('ru-RU')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-2">
                    {user.role === 'OWNER' && (
                      <button
                        onClick={() => openUserDetails(user.id)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Подробнее
                      </button>
                    )}
                    <button
                      onClick={() => toggleUserStatus(user.id)}
                      className={`${user.isActive ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                    >
                      {user.isActive ? 'Заблокировать' : 'Разблокировать'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="mt-4 text-sm text-gray-500">
        Всего пользователей: {users.length}
      </div>

      {/* Модальное окно с детальной информацией */}
      {selectedUserId && (
        <UserDetailsModal
          userId={selectedUserId}
          isOpen={isModalOpen}
          onClose={closeUserDetails}
          onAccessGranted={handleAccessGranted}
        />
      )}
    </div>
  );
}