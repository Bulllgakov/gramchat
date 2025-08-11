import { useState, useEffect } from 'react';
import axios from 'axios';
import { getApiUrl } from '../../config/api.config';

const API_URL = getApiUrl();

interface Shop {
  id: string;
  name: string;
  botUsername: string;
  botToken: string;
  category: string;
  isActive: boolean;
  ownerId: string;
  owner: {
    id: string;
    firstName: string;
    lastName: string;
    username?: string;
  };
  _count: {
    dialogs: number;
  };
  createdAt: string;
}

export function ShopsList() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingShop, setEditingShop] = useState<Shop | null>(null);

  useEffect(() => {
    fetchShops();
  }, []);

  const fetchShops = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${API_URL}/admin/shops`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShops(response.data.shops);
    } catch (err) {
      setError('Ошибка загрузки магазинов');
      console.error('Error fetching shops:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleShopStatus = async (shopId: string, isActive: boolean) => {
    try {
      const token = localStorage.getItem('authToken');
      await axios.patch(`${API_URL}/admin/shops/${shopId}/status`, 
        { isActive: !isActive },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchShops();
    } catch (err) {
      alert('Ошибка изменения статуса магазина');
    }
  };

  const deleteShop = async (shopId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот магазин? Это действие необратимо.')) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      await axios.delete(`${API_URL}/admin/shops/${shopId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchShops();
    } catch (err) {
      alert('Ошибка удаления магазина');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Загрузка магазинов...</div>;
  }

  if (error) {
    return <div className="text-red-600 text-center py-8">{error}</div>;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="p-6 border-b border-gray-100">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Управление магазинами</h3>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Создать магазин
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Магазин
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Бот
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Владелец
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Диалоги
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Статус
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Действия
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {shops.map((shop) => (
              <tr key={shop.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{shop.name}</div>
                    <div className="text-sm text-gray-500">{shop.category}</div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <a 
                    href={`https://t.me/${shop.botUsername}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {shop.botUsername.startsWith('@') ? shop.botUsername : `@${shop.botUsername}`}
                  </a>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">
                    {shop.owner.firstName} {shop.owner.lastName}
                  </div>
                  {shop.owner.username && (
                    <div className="text-sm text-gray-500">@{shop.owner.username}</div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-900">{shop._count.dialogs}</span>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => toggleShopStatus(shop.id, shop.isActive)}
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      shop.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {shop.isActive ? 'Активен' : 'Неактивен'}
                  </button>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingShop(shop)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Изменить
                    </button>
                    <button
                      onClick={() => deleteShop(shop.id)}
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

      {shops.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          Нет магазинов
        </div>
      )}

      {/* Модальное окно создания магазина */}
      {showCreateForm && (
        <CreateShopModal
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => {
            setShowCreateForm(false);
            fetchShops();
          }}
        />
      )}

      {/* Модальное окно редактирования магазина */}
      {editingShop && (
        <EditShopModal
          shop={editingShop}
          onClose={() => setEditingShop(null)}
          onSuccess={() => {
            setEditingShop(null);
            fetchShops();
          }}
        />
      )}
    </div>
  );
}

// Компонент создания магазина
function CreateShopModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    botToken: '',
    category: 'OTHER',
    ownerId: ''
  });
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Фильтруем только OWNER без магазина
      const owners = response.data.users.filter((u: any) => 
        u.role === 'OWNER' && !u.ownedShop
      );
      setUsers(owners);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('authToken');
      await axios.post(`${API_URL}/admin/shops`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onSuccess();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Ошибка создания магазина');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Создать магазин</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Название магазина
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Токен бота
            </label>
            <input
              type="text"
              value={formData.botToken}
              onChange={(e) => setFormData({ ...formData, botToken: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Получите токен у @BotFather в Telegram
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Категория
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="RETAIL">Розничная торговля</option>
              <option value="SERVICES">Услуги</option>
              <option value="FOOD">Еда и напитки</option>
              <option value="ELECTRONICS">Электроника</option>
              <option value="FASHION">Мода и одежда</option>
              <option value="HEALTH">Здоровье и красота</option>
              <option value="OTHER">Другое</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Владелец
            </label>
            <select
              value={formData.ownerId}
              onChange={(e) => setFormData({ ...formData, ownerId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            >
              <option value="">Выберите владельца</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.firstName} {user.lastName} (@{user.username})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Создание...' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Компонент редактирования магазина
function EditShopModal({ 
  shop, 
  onClose, 
  onSuccess 
}: { 
  shop: Shop; 
  onClose: () => void; 
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: shop.name,
    category: shop.category,
    botToken: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('authToken');
      const updateData: any = {
        name: formData.name,
        category: formData.category
      };
      
      // Добавляем токен только если он был изменен
      if (formData.botToken) {
        updateData.botToken = formData.botToken;
      }

      await axios.patch(`${API_URL}/admin/shops/${shop.id}`, updateData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onSuccess();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Ошибка обновления магазина');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Редактировать магазин</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Название магазина
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Категория
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="RETAIL">Розничная торговля</option>
              <option value="SERVICES">Услуги</option>
              <option value="FOOD">Еда и напитки</option>
              <option value="ELECTRONICS">Электроника</option>
              <option value="FASHION">Мода и одежда</option>
              <option value="HEALTH">Здоровье и красота</option>
              <option value="OTHER">Другое</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Новый токен бота (опционально)
            </label>
            <input
              type="text"
              value={formData.botToken}
              onChange={(e) => setFormData({ ...formData, botToken: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Оставьте пустым, чтобы не менять"
            />
            <p className="text-xs text-gray-500 mt-1">
              Введите новый токен только если хотите его изменить
            </p>
          </div>

          <div className="bg-gray-50 rounded-md p-3">
            <p className="text-sm text-gray-600">
              <strong>Бот:</strong> {shop.botUsername.startsWith('@') ? shop.botUsername : `@${shop.botUsername}`}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Владелец:</strong> {shop.owner.firstName} {shop.owner.lastName}
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}