import { useState, useEffect } from 'react';

const API_URL = 'http://localhost:3000/api';

interface User {
  id: string;
  telegramId: string;
  firstName: string;
  lastName?: string;
  username?: string;
  role: 'ADMIN' | 'OWNER' | 'MANAGER';
  isActive: boolean;
  createdAt: string;
}

export function UsersListSimple() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('authToken');
      console.log('Fetching with token:', token);
      
      const response = await fetch(`${API_URL}/admin/users`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        } catch {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }

      const data = await response.json();
      console.log('Users data:', data);
      setUsers(data.users || []);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.message || 'Ошибка загрузки пользователей');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Загрузка...</div>;
  if (error) return <div className="text-red-600">Ошибка: {error}</div>;

  return (
    <div>
      <h3 className="text-lg font-medium mb-4">Пользователи системы</h3>
      
      {users.length === 0 ? (
        <p>Нет пользователей</p>
      ) : (
        <div className="space-y-2">
          {users.map(user => (
            <div key={user.id} className="p-4 border rounded">
              <p><strong>{user.firstName} {user.lastName}</strong></p>
              <p className="text-sm text-gray-600">
                {user.username ? `@${user.username}` : `ID: ${user.telegramId}`}
              </p>
              <p className="text-sm">
                Роль: <span className="font-medium">{user.role}</span>
              </p>
              <p className="text-sm">
                Статус: <span className={user.isActive ? 'text-green-600' : 'text-red-600'}>
                  {user.isActive ? 'Активен' : 'Заблокирован'}
                </span>
              </p>
            </div>
          ))}
        </div>
      )}
      
      <div className="mt-4 text-sm text-gray-500">
        Всего пользователей: {users.length}
      </div>
    </div>
  );
}