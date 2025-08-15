import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { apiService } from '../../services/api.service';
import { showErrorNotification } from '../../utils/errorHandler';
import { getApiUrl } from '../../config/api.config';

interface AnalyticsData {
  totalDialogs: number;
  newDialogs: number;
  activeDialogs: number;
  closedDialogs: number;
  dealsCount: number;
  cancelledCount: number;
  avgResponseTime: number;
  totalMessages: number;
  assignedCount: number;
  releasedCount: number;
  transferredCount: number;
  periodComparison?: {
    dialogsChange: number;
    dealsChange: number;
    responseTimeChange: number;
  };
}

interface ManagerAnalytics extends AnalyticsData {
  managerId: string;
  managerName: string;
}

export function Analytics() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('week');
  const [activeTab, setActiveTab] = useState<'personal' | 'managers'>('personal');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [managersData, setManagersData] = useState<ManagerAnalytics[]>([]);
  const [selectedBotId, setSelectedBotId] = useState<string>('all');
  const [bots, setBots] = useState<any[]>([]);

  // Загружаем список ботов для владельцев
  useEffect(() => {
    if (user?.role === 'OWNER') {
      fetchBots();
    }
  }, [user]);

  useEffect(() => {
    fetchAnalytics();
  }, [period, activeTab, selectedBotId]);

  const fetchBots = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${getApiUrl()}/bots/my-bots`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setBots(data || []);
      }
    } catch (error) {
      console.error('Error loading bots:', error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Добавляем параметр botId если выбран конкретный бот
      const botParam = selectedBotId !== 'all' ? `&botId=${selectedBotId}` : '';
      
      if (activeTab === 'personal' || user?.role !== 'OWNER') {
        const data = await apiService.get<AnalyticsData>(`/analytics?period=${period}${botParam}`);
        setAnalyticsData(data);
      } else {
        // Для владельцев - загружаем данные по менеджерам
        const data = await apiService.get<{ managers: ManagerAnalytics[] }>(`/analytics/managers?period=${period}${botParam}`);
        setManagersData(data.managers || []);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Не удалось загрузить аналитику';
      setError(errorMessage);
      showErrorNotification(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${Math.round(minutes)} мин`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}ч ${mins}м`;
  };

  const formatChange = (change: number) => {
    if (change > 0) return `+${change}%`;
    return `${change}%`;
  };

  return (
    <div className="p-6">
      {/* Селектор бота для владельцев */}
      {user?.role === 'OWNER' && bots.length > 0 && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Выберите бота</label>
          <select
            value={selectedBotId}
            onChange={(e) => setSelectedBotId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Все боты</option>
            {bots.map(bot => (
              <option key={bot.id} value={bot.id}>
                {bot.name} (@{bot.botUsername})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Переключатель периодов */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setPeriod('today')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              period === 'today' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Сегодня
          </button>
          <button
            onClick={() => setPeriod('week')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              period === 'week' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Неделя
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              period === 'month' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Месяц
          </button>
        </div>
      </div>

      {/* Табы для владельцев */}
      {user?.role === 'OWNER' && (
        <div className="border-b mb-6">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('personal')}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'personal'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Моя статистика
            </button>
            <button
              onClick={() => setActiveTab('managers')}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'managers'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Менеджеры
            </button>
          </nav>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">Ошибка: {error}</div>
          <button
            onClick={() => fetchAnalytics()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Повторить попытку
          </button>
        </div>
      ) : activeTab === 'personal' && analyticsData ? (
        <div>
          {/* Основные метрики */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg p-4 border">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-500">Всего диалогов</h3>
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-2xl font-bold">{analyticsData.totalDialogs}</p>
              {analyticsData.periodComparison && (
                <p className={`text-sm mt-1 ${analyticsData.periodComparison.dialogsChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatChange(analyticsData.periodComparison.dialogsChange)} к прошлому периоду
                </p>
              )}
            </div>

            <div className="bg-white rounded-lg p-4 border">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-500">Сделки</h3>
                <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-2xl font-bold text-green-600">{analyticsData.dealsCount}</p>
              {analyticsData.periodComparison && (
                <p className={`text-sm mt-1 ${analyticsData.periodComparison.dealsChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatChange(analyticsData.periodComparison.dealsChange)} к прошлому периоду
                </p>
              )}
            </div>

            <div className="bg-white rounded-lg p-4 border">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-500">Среднее время ответа</h3>
                <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-2xl font-bold">{formatTime(analyticsData.avgResponseTime)}</p>
              {analyticsData.periodComparison && (
                <p className={`text-sm mt-1 ${analyticsData.periodComparison.responseTimeChange <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatChange(analyticsData.periodComparison.responseTimeChange)} к прошлому периоду
                </p>
              )}
            </div>

            <div className="bg-white rounded-lg p-4 border">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-500">Конверсия в сделку</h3>
                <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
              </div>
              <p className="text-2xl font-bold">
                {analyticsData.totalDialogs > 0 
                  ? `${Math.round((analyticsData.dealsCount / analyticsData.totalDialogs) * 100)}%`
                  : '0%'
                }
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Статусы диалогов */}
            <div className="bg-white rounded-lg p-6 border">
              <h3 className="text-lg font-semibold mb-4">Статистика по статусам</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium">Новые</span>
                  </div>
                  <span className="text-sm font-bold">{analyticsData.newDialogs}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm font-medium">Активные</span>
                  </div>
                  <span className="text-sm font-bold">{analyticsData.activeDialogs}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                    <span className="text-sm font-medium">Закрытые</span>
                  </div>
                  <span className="text-sm font-bold">{analyticsData.closedDialogs}</span>
                </div>
              </div>
            </div>

            {/* Действия с диалогами */}
            <div className="bg-white rounded-lg p-6 border">
              <h3 className="text-lg font-semibold mb-4">Действия с диалогами</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-medium">Взял себе</span>
                  </div>
                  <span className="text-sm font-bold">{analyticsData.assignedCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="text-sm font-medium">Освободил</span>
                  </div>
                  <span className="text-sm font-bold">{analyticsData.releasedCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    <span className="text-sm font-medium">Передал</span>
                  </div>
                  <span className="text-sm font-bold">{analyticsData.transferredCount}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'managers' && managersData.length > 0 ? (
        <div>
          {/* Таблица сравнения менеджеров */}
          <div className="bg-white rounded-lg border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Менеджер
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Диалоги
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Сделки
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Конверсия
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ср. время ответа
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Сообщений
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {managersData.map((manager) => (
                    <tr key={manager.managerId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{manager.managerName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-sm text-gray-900">{manager.totalDialogs}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-sm font-medium text-green-600">{manager.dealsCount}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {manager.totalDialogs > 0 
                            ? `${Math.round((manager.dealsCount / manager.totalDialogs) * 100)}%`
                            : '0%'
                          }
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-sm text-gray-900">{formatTime(manager.avgResponseTime)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-sm text-gray-900">{manager.totalMessages}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Лучший менеджер */}
          {managersData.length > 0 && (
            <div className="mt-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">🏆 Лучший менеджер периода</h3>
              <p className="text-blue-700">
                {(() => {
                  const best = managersData.reduce((prev, current) => 
                    (current.dealsCount > prev.dealsCount) ? current : prev
                  );
                  return `${best.managerName} - ${best.dealsCount} сделок`;
                })()}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          Нет данных для отображения
        </div>
      )}
    </div>
  );
}