import { useState, useEffect } from 'react';
import axios from 'axios';
import { getApiUrl } from '../../config/api.config';

const API_URL = getApiUrl();

interface Bot {
  id: string;
  name: string;
  botUsername: string;
  botToken: string;
  category: string;
  isActive: boolean;
  isApproved: boolean;
  ownerId: string;
  owner: {
    id: string;
    firstName: string;
    lastName: string;
    username?: string;
  };
  _count: {
    dialogs: number;
    managers: number;
  };
  createdAt: string;
}

export function BotsList() {
  const [bots, setBots] = useState<Bot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingBot, setEditingBot] = useState<Bot | null>(null);

  useEffect(() => {
    fetchBots();
  }, []);

  const fetchBots = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${API_URL}/admin/bots`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBots(response.data.bots);
    } catch (err) {
      setError('Ошибка загрузки ботов');
      console.error('Error fetching bots:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleBotStatus = async (botId: string, isActive: boolean) => {
    try {
      const token = localStorage.getItem('authToken');
      await axios.patch(`${API_URL}/admin/bots/${botId}/status`, 
        { isActive: !isActive },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchBots();
    } catch (err) {
      alert('Ошибка изменения статуса бота');
    }
  };

  const approveBot = async (botId: string) => {
    try {
      const token = localStorage.getItem('authToken');
      await axios.patch(`${API_URL}/admin/bots/${botId}/approve`, 
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchBots();
    } catch (err) {
      alert('Ошибка одобрения бота');
    }
  };

  const deleteBot = async (botId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот бот? Это действие необратимо.')) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      await axios.delete(`${API_URL}/admin/bots/${botId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchBots();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Ошибка удаления бота');
    }
  };

  const getCategoryLabel = (category: string) => {
    const categories: Record<string, string> = {
      RETAIL: 'Розничная торговля',
      SERVICES: 'Услуги',
      FOOD: 'Еда и напитки',
      ELECTRONICS: 'Электроника',
      FASHION: 'Мода и одежда',
      HEALTH: 'Здоровье и красота',
      OTHER: 'Другое'
    };
    return categories[category] || category;
  };

  if (loading) {
    return <div className="text-center py-8">Загрузка ботов...</div>;
  }

  if (error) {
    return <div className="text-red-600 text-center py-8">{error}</div>;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="p-6 border-b border-gray-100">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Управление ботами</h3>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Создать бота
          </button>
        </div>
      </div>

      {bots.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          Боты пока не созданы
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Бот
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Владелец
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Категория
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Статистика
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Статус
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {bots.map((bot) => (
                <tr key={bot.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{bot.name}</div>
                      <div className="text-sm text-gray-500">@{bot.botUsername}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {bot.owner.firstName} {bot.owner.lastName}
                    </div>
                    {bot.owner.username && (
                      <div className="text-sm text-gray-500">@{bot.owner.username}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                      {getCategoryLabel(bot.category)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>Диалоги: {bot._count.dialogs}</div>
                    <div>Менеджеры: {bot._count.managers}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        bot.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {bot.isActive ? 'Активен' : 'Неактивен'}
                      </span>
                      {!bot.isApproved && (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          Не одобрен
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      {!bot.isApproved && (
                        <button
                          onClick={() => approveBot(bot.id)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Одобрить
                        </button>
                      )}
                      <button
                        onClick={() => toggleBotStatus(bot.id, bot.isActive)}
                        className={`${
                          bot.isActive 
                            ? 'text-yellow-600 hover:text-yellow-900' 
                            : 'text-blue-600 hover:text-blue-900'
                        }`}
                      >
                        {bot.isActive ? 'Деактивировать' : 'Активировать'}
                      </button>
                      <button
                        onClick={() => setEditingBot(bot)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Изменить
                      </button>
                      {bot._count.dialogs === 0 && (
                        <button
                          onClick={() => deleteBot(bot.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Удалить
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Модальное окно создания/редактирования бота */}
      {(showCreateForm || editingBot) && (
        <BotFormModal
          bot={editingBot}
          onClose={() => {
            setShowCreateForm(false);
            setEditingBot(null);
          }}
          onSuccess={() => {
            setShowCreateForm(false);
            setEditingBot(null);
            fetchBots();
          }}
        />
      )}
    </div>
  );
}

// Компонент модального окна для создания/редактирования бота
function BotFormModal({ bot, onClose, onSuccess }: {
  bot: Bot | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: bot?.name || '',
    botToken: bot?.botToken || '',
    botUsername: bot?.botUsername || '',
    category: bot?.category || 'OTHER',
    ownerId: bot?.ownerId || ''
  });
  const [owners, setOwners] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOwners();
  }, []);

  const fetchOwners = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${API_URL}/admin/users?role=OWNER`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOwners(response.data.users.filter((u: any) => u.role === 'OWNER'));
    } catch (err) {
      console.error('Error fetching owners:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('authToken');
      
      if (bot) {
        // Редактирование
        await axios.patch(`${API_URL}/admin/bots/${bot.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        // Создание
        await axios.post(`${API_URL}/admin/bots`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Произошла ошибка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">
          {bot ? 'Редактировать бота' : 'Создать бота'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {!bot && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Владелец
              </label>
              <select
                value={formData.ownerId}
                onChange={(e) => setFormData({...formData, ownerId: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              >
                <option value="">Выберите владельца</option>
                {owners.map(owner => (
                  <option key={owner.id} value={owner.id}>
                    {owner.firstName} {owner.lastName} 
                    {owner.username && `(@${owner.username})`}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Название
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
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
              onChange={(e) => setFormData({...formData, botToken: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username бота
            </label>
            <input
              type="text"
              value={formData.botUsername}
              onChange={(e) => setFormData({...formData, botUsername: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="@mybot"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Категория
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
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
          
          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}
          
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
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