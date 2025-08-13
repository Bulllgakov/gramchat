import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api.service';

interface Bot {
  id: string;
  name: string;
  botUsername: string;
  isActive: boolean;
}

interface Manager {
  id: string;
  firstName: string;
  lastName: string;
  username?: string;
  assignedBots: Bot[];
  isActive: boolean;
  createdAt: string;
}

export function ManagerBotAssignment() {
  const [managers, setManagers] = useState<Manager[]>([]);
  const [ownerBots, setOwnerBots] = useState<Bot[]>([]);
  const [selectedManager, setSelectedManager] = useState<Manager | null>(null);
  const [selectedBotIds, setSelectedBotIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [managersData, botsData] = await Promise.all([
        apiService.get('/managers'),
        apiService.get('/bots')
      ]);
      setManagers(managersData);
      setOwnerBots(botsData);
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    } finally {
      setLoading(false);
    }
  };

  const openBotAssignment = (manager: Manager) => {
    setSelectedManager(manager);
    setSelectedBotIds(manager.assignedBots.map(b => b.id));
  };

  const toggleBot = (botId: string) => {
    setSelectedBotIds(prev => 
      prev.includes(botId) 
        ? prev.filter(id => id !== botId)
        : [...prev, botId]
    );
  };

  const saveBotAssignment = async () => {
    if (!selectedManager) return;
    
    try {
      setSaving(true);
      await apiService.put(`/managers/${selectedManager.id}/bots`, {
        botIds: selectedBotIds
      });
      
      // Обновляем локальные данные
      setManagers(prev => prev.map(m => 
        m.id === selectedManager.id 
          ? {
              ...m,
              assignedBots: ownerBots.filter(b => selectedBotIds.includes(b.id))
            }
          : m
      ));
      
      setSelectedManager(null);
      alert('Боты успешно назначены');
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      alert('Ошибка при сохранении');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-4">Загрузка...</div>;
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Управление менеджерами и ботами</h2>
      
      {managers.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600 mb-4">У вас пока нет менеджеров</p>
          <p className="text-sm text-gray-500">
            Создайте инвайт-код и отправьте его менеджеру для регистрации
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {managers.map(manager => (
            <div key={manager.id} className="bg-white border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">
                    {manager.firstName} {manager.lastName}
                  </h3>
                  {manager.username && (
                    <p className="text-sm text-gray-500">@{manager.username}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    Зарегистрирован: {new Date(manager.createdAt).toLocaleDateString()}
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs rounded ${
                    manager.isActive 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {manager.isActive ? 'Активен' : 'Заблокирован'}
                  </span>
                  <button
                    onClick={() => openBotAssignment(manager)}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Управление ботами
                  </button>
                </div>
              </div>
              
              <div className="mt-3">
                <p className="text-sm text-gray-600 mb-2">Назначенные боты:</p>
                <div className="flex flex-wrap gap-2">
                  {manager.assignedBots.length === 0 ? (
                    <span className="text-sm text-gray-400">Нет назначенных ботов</span>
                  ) : (
                    manager.assignedBots.map(bot => (
                      <span 
                        key={bot.id} 
                        className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm"
                      >
                        @{bot.botUsername}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Модальное окно назначения ботов */}
      {selectedManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">
              Управление ботами: {selectedManager.firstName} {selectedManager.lastName}
            </h3>
            
            <p className="text-sm text-gray-600 mb-4">
              Выберите боты, к которым менеджер будет иметь доступ:
            </p>
            
            {ownerBots.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                У вас пока нет ботов
              </p>
            ) : (
              <div className="space-y-3 mb-6">
                {ownerBots.map(bot => (
                  <label 
                    key={bot.id} 
                    className="flex items-center space-x-3 p-3 border rounded hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedBotIds.includes(bot.id)}
                      onChange={() => toggleBot(bot.id)}
                      className="h-4 w-4 text-blue-600"
                    />
                    <div className="flex-1">
                      <div className="font-medium">@{bot.botUsername}</div>
                      <div className="text-sm text-gray-500">{bot.name}</div>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded ${
                      bot.isActive 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {bot.isActive ? 'Активен' : 'Выключен'}
                    </span>
                  </label>
                ))}
              </div>
            )}
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setSelectedManager(null)}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                disabled={saving}
              >
                Отмена
              </button>
              <button
                onClick={saveBotAssignment}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                disabled={saving}
              >
                {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}