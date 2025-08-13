import { useState, useEffect } from 'react';
import { getApiUrl } from '../../config/api.config';
import { Dialog } from './types';
import { getApiUrl } from '../../config/api.config';

const API_URL = getApiUrl();

interface DialogsListProps {
  botId?: string;
  onSelectDialog: (dialog: Dialog) => void;
  selectedDialogId?: string;
}

export function DialogsList({ botId, onSelectDialog, selectedDialogId }: DialogsListProps) {
  const [dialogs, setDialogs] = useState<Dialog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'NEW' | 'ACTIVE' | 'CLOSED'>('all');

  useEffect(() => {
    fetchDialogs();
    // Обновляем список каждые 10 секунд
    // const interval = setInterval(fetchDialogs, 10000); // Отключено для разработки
    // return () => clearInterval(interval);
  }, [filter, botId]);

  const fetchDialogs = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('status', filter);
      if (botId) params.append('botId', botId);
      
      const response = await fetch(`${API_URL}/dialogs?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dialogs');
      }

      const data = await response.json();
      setDialogs(data.dialogs || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NEW': return 'bg-green-100 text-green-800';
      case 'ACTIVE': return 'bg-blue-100 text-blue-800';
      case 'CLOSED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'NEW': return 'Новый';
      case 'ACTIVE': return 'Активный';
      case 'CLOSED': return 'Закрыт';
      default: return status;
    }
  };

  if (loading && dialogs.length === 0) return <div className="p-4">Загрузка...</div>;
  if (error) return <div className="p-4 text-red-600">Ошибка: {error}</div>;

  return (
    <div className="h-full flex flex-col">
      {/* Фильтры */}
      <div className="p-3 border-b bg-gray-50">
        <div className="flex gap-1">
          <button
            onClick={() => setFilter('all')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              filter === 'all' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            Все
          </button>
          <button
            onClick={() => setFilter('NEW')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              filter === 'NEW' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            Новые
          </button>
          <button
            onClick={() => setFilter('ACTIVE')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              filter === 'ACTIVE' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            Активные
          </button>
          <button
            onClick={() => setFilter('CLOSED')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              filter === 'CLOSED' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            Закрытые
          </button>
        </div>
      </div>

      {/* Список диалогов */}
      <div className="flex-1 overflow-y-auto">
        {dialogs.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            Нет диалогов
          </div>
        ) : (
          <div className="divide-y">
            {dialogs.map(dialog => (
              <div
                key={dialog.id}
                onClick={() => onSelectDialog(dialog)}
                className={`p-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                  selectedDialogId === dialog.id ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex gap-3">
                  {/* Аватарка клиента */}
                  <div className="flex-shrink-0">
                    {dialog.customerPhotoUrl ? (
                      <img
                        src={`${API_URL}/dialogs/${dialog.id}/avatar?token=${localStorage.getItem('authToken')}`}
                        alt={dialog.customerName}
                        className="w-10 h-10 rounded-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(dialog.customerName)}&background=random`;
                        }}
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold text-sm">
                        {dialog.customerName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  
                  {/* Информация о диалоге */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <h4 className="font-medium truncate">{dialog.customerName}</h4>
                        {dialog.customerUsername && (
                          <span className="text-sm text-gray-500">@{dialog.customerUsername}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-gray-400">
                          {new Date(dialog.lastMessageAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(dialog.status)}`}>
                          {getStatusText(dialog.status)}
                        </span>
                      </div>
                    </div>
                    {dialog.messages?.[0] && (
                      <p className="text-sm text-gray-600 truncate">
                        {dialog.messages[0].fromUser ? (
                          <span className="text-gray-500">Вы: </span>
                        ) : null}
                        {dialog.messages[0].text}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}