import { useState, useEffect } from 'react';
import { apiService } from '../../services/api.service';

interface Bot {
  id: string;
  name: string;
  botToken: string;
  botUsername: string;
  category: string;
  isActive: boolean;
}

interface EditBotModalProps {
  bot: Bot;
  onClose: () => void;
  onSave: (updatedBot: Bot) => void;
  onDelete?: (botId: string) => void;
}

const CATEGORIES = [
  { value: 'RETAIL', label: 'Розничная торговля' },
  { value: 'SERVICES', label: 'Услуги' },
  { value: 'EDUCATION', label: 'Образование' },
  { value: 'HEALTH', label: 'Здоровье' },
  { value: 'FOOD', label: 'Еда и рестораны' },
  { value: 'TECH', label: 'Технологии' },
  { value: 'FINANCE', label: 'Финансы' },
  { value: 'OTHER', label: 'Другое' }
];

export function EditBotModal({ bot, onClose, onSave, onDelete }: EditBotModalProps) {
  const [formData, setFormData] = useState({
    name: bot.name,
    botToken: bot.botToken,
    botUsername: bot.botUsername,
    category: bot.category
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      setError('');

      // Валидация
      if (!formData.name.trim()) {
        setError('Название бота обязательно');
        return;
      }

      // Нормализуем username (убираем @)
      const normalizedUsername = formData.botUsername.replace('@', '');

      const updateData = {
        name: formData.name.trim(),
        botToken: formData.botToken.trim(),
        botUsername: normalizedUsername,
        category: formData.category
      };

      const updatedBot = await apiService.put(`/bots/${bot.id}`, updateData);
      
      onSave(updatedBot);
      onClose();
    } catch (err: any) {
      console.error('Error updating bot:', err);
      setError(err.response?.data?.message || err.message || 'Ошибка при обновлении бота');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsLoading(true);
      await apiService.delete(`/bots/${bot.id}`);
      
      if (onDelete) {
        onDelete(bot.id);
      }
      onClose();
    } catch (err: any) {
      console.error('Error deleting bot:', err);
      setError(err.response?.data?.message || err.message || 'Ошибка при удалении бота');
      setShowDeleteConfirm(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Заголовок */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Редактирование бота</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Форма */}
        <div className="p-6 space-y-4">
          {/* Название */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Название бота
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Мой магазин"
            />
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username бота
            </label>
            <input
              type="text"
              name="botUsername"
              value={formData.botUsername}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="my_shop_bot"
            />
            <p className="text-xs text-gray-500 mt-1">
              Username бота в Telegram (без @)
            </p>
          </div>

          {/* Токен */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Токен бота
            </label>
            <div className="relative">
              <input
                type="password"
                name="botToken"
                value={formData.botToken}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                placeholder="1234567890:ABCdef..."
              />
              <button
                type="button"
                onClick={() => {
                  const input = document.querySelector('input[name="botToken"]') as HTMLInputElement;
                  input.type = input.type === 'password' ? 'text' : 'password';
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Будьте осторожны при изменении токена
            </p>
          </div>

          {/* Категория */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Категория
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Статус */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Статус:</span>
              <span className={`px-2 py-1 text-xs rounded ${
                bot.isActive 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {bot.isActive ? 'Активен' : 'Неактивен'}
              </span>
            </div>
          </div>

          {/* Ошибка */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Подтверждение удаления */}
          {showDeleteConfirm && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800 mb-3">
                Вы уверены, что хотите удалить этого бота? Все диалоги и сообщения будут сохранены, но бот будет отключен.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleDelete}
                  disabled={isLoading}
                  className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
                >
                  Да, удалить
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isLoading}
                  className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300 disabled:opacity-50"
                >
                  Отмена
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Кнопки действий */}
        <div className="flex items-center justify-between p-6 border-t">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isLoading || showDeleteConfirm}
            className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
          >
            Удалить бота
          </button>
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Отмена
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}