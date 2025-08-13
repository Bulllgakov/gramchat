import { useState, useEffect } from 'react';
import axios from 'axios';
import { DialogsList } from '../chat/DialogsList';
import { ChatWindow } from '../chat/ChatWindow';
import { Dialog } from '../chat/types';
import { getApiUrl } from '../../config/api.config';

const API_URL = getApiUrl();

interface Bot {
  id: string;
  name: string;
  botUsername: string;
  category: string;
  isActive: boolean;
  isApproved: boolean;
}

interface BotsDashboardProps {
  userRole: 'OWNER' | 'MANAGER' | 'ADMIN';
}

export function BotsDashboard({ userRole }: BotsDashboardProps) {
  const [bots, setBots] = useState<Bot[]>([]);
  const [selectedBot, setSelectedBot] = useState<Bot | null>(null);
  const [selectedDialog, setSelectedDialog] = useState<Dialog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBots();
  }, []);

  const loadBots = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/bots/my-bots`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setBots(response.data);
      if (response.data.length > 0 && !selectedBot) {
        setSelectedBot(response.data[0]);
      }
    } catch (error) {
      console.error('Error loading bots:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Загрузка ботов...</div>
      </div>
    );
  }

  if (bots.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <h2 className="text-xl font-semibold mb-4">У вас пока нет ботов</h2>
        <p className="text-gray-600 mb-6">
          {userRole === 'OWNER' 
            ? 'Создайте своего первого бота для начала работы'
            : 'Владелец еще не назначил вам боты для управления'}
        </p>
        {userRole === 'OWNER' && (
          <button 
            onClick={() => window.location.href = '/create-bot'}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Создать бота
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Селектор ботов для выбора */}
      {bots.length > 1 && (
        <div className="p-4 border-b bg-gray-50">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Выберите бота:
          </label>
          <select
            value={selectedBot?.id || ''}
            onChange={(e) => {
              const bot = bots.find(b => b.id === e.target.value);
              setSelectedBot(bot || null);
              setSelectedDialog(null);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {bots.map(bot => (
              <option key={bot.id} value={bot.id}>
                {bot.name} (@{bot.botUsername})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Информация о выбранном боте */}
      {selectedBot && (
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">
            {selectedBot.name}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Бот: @{selectedBot.botUsername} | Категория: {selectedBot.category}
          </p>
          {!selectedBot.isActive && (
            <span className="inline-block mt-2 px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
              Бот неактивен
            </span>
          )}
          {!selectedBot.isApproved && (
            <span className="inline-block mt-2 ml-2 px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
              Ожидает одобрения
            </span>
          )}
        </div>
      )}

      {/* Интерфейс чата */}
      {selectedBot && (
        <div className="flex h-[600px]">
          {/* Список диалогов */}
          <div className="w-1/3 border-r">
            <DialogsList 
              botId={selectedBot.id}
              onSelectDialog={setSelectedDialog}
              selectedDialogId={selectedDialog?.id}
            />
          </div>

          {/* Окно чата */}
          <div className="flex-1">
            <ChatWindow 
              dialog={selectedDialog}
              botId={selectedBot.id}
              onClose={() => setSelectedDialog(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}