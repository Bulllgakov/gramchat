import { useState } from 'react';
import { getApiUrl } from '../../config/api.config';
import axios from 'axios';
import { getApiUrl } from '../../config/api.config';

const API_URL = getApiUrl();

export function QuickActions() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const createTestShop = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const token = localStorage.getItem('authToken');
      
      // 1. Сначала изменяем роль на OWNER
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        throw new Error('User not found');
      }
      
      const user = JSON.parse(userStr);
      
      await axios.patch(
        `${API_URL}/admin/users/${user.id}/role`,
        { role: 'OWNER' },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      // 2. Создаем тестовый магазин
      await axios.post(
        `${API_URL}/shops`,
        {
          name: 'Тестовый магазин',
          botToken: '123456:ABC-DEF1234567890', // Фейковый токен для теста
          botUsername: 'test_shop_bot',
          category: 'retail'
        },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      setMessage('Магазин создан! Перезагрузите страницу.');
      
      // Автоматическая перезагрузка через 2 секунды
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (err: any) {
      console.error('Error:', err);
      setMessage(err.response?.data?.message || 'Ошибка создания магазина');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
      <h3 className="text-lg font-medium text-yellow-900 mb-2">
        Быстрые действия для тестирования
      </h3>
      <p className="text-sm text-yellow-700 mb-4">
        Создайте тестовый магазин для проверки функционала чата
      </p>
      
      <button
        onClick={createTestShop}
        disabled={loading}
        className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 disabled:opacity-50"
      >
        {loading ? 'Создание...' : 'Создать тестовый магазин'}
      </button>
      
      {message && (
        <p className={`mt-2 text-sm ${message.includes('Ошибка') ? 'text-red-600' : 'text-green-600'}`}>
          {message}
        </p>
      )}
      
      <p className="text-xs text-yellow-600 mt-2">
        Внимание: Это изменит вашу роль на OWNER и создаст тестовый магазин
      </p>
    </div>
  );
}