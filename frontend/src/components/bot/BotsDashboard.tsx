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
      const token = localStorage.getItem('authToken');
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

  // Для менеджеров без ботов показываем сообщение
  if (bots.length === 0 && userRole === 'MANAGER') {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <h2 className="text-xl font-semibold mb-4">У вас пока нет назначенных ботов</h2>
        <p className="text-gray-600">
          Владелец еще не назначил вам боты для управления. Обратитесь к владельцу для получения доступа.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Шапка */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-white">GramChat</h1>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem('authToken');
                localStorage.removeItem('refreshToken');
                window.location.href = '/login';
              }}
              className="text-white/90 hover:text-white transition-colors flex items-center gap-2"
            >
              <span>Выйти</span>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

          {/* Интерфейс чата - показываем всегда для владельцев */}
          <div className="flex h-[600px]">
            {/* Список диалогов */}
            <div className="w-1/3 border-r">
              <DialogsList 
                botId={selectedBot?.id}
                onSelectDialog={setSelectedDialog}
                selectedDialogId={selectedDialog?.id}
              />
            </div>

            {/* Окно чата */}
            <div className="flex-1">
              <ChatWindow 
                dialog={selectedDialog}
                botId={selectedBot?.id || ''}
                onClose={() => setSelectedDialog(null)}
                showConnectButtons={userRole === 'OWNER' && bots.length === 0}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}