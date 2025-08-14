import { useState, useEffect, useRef } from 'react';
import { DialogsListStyled } from '../chat/DialogsListStyled';
import { ChatWindowStyled } from '../chat/ChatWindowStyled';
import { Dialog } from '../chat/types';
import { DialogTransfer } from '../owner/DialogTransfer';
import { ManagerManagement } from '../owner/ManagerManagement';
import { Analytics } from '../analytics/Analytics';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { ChatErrorBoundary } from '../ChatErrorBoundary';
import { ErrorBoundary } from '../ErrorBoundary';

interface ShopDashboardStyledProps {
  shop?: any;
  userRole?: string;
}

export function ShopDashboardStyled({ shop, userRole }: ShopDashboardStyledProps) {
  const [selectedDialog, setSelectedDialog] = useState<Dialog | null>(null);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showManagersPanel, setShowManagersPanel] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [bots, setBots] = useState<any[]>([]);
  const [selectedBot, setSelectedBot] = useState<any>(null);
  const [botsLoading, setBotsLoading] = useState(true);
  const [showBotSelector, setShowBotSelector] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const botSelectorRef = useRef<HTMLDivElement>(null);
  
  // Загружаем боты для владельцев
  useEffect(() => {
    if ((user?.role === 'OWNER' || userRole === 'OWNER') && !shop) {
      loadBots();
    } else {
      setBotsLoading(false);
    }
  }, [user, userRole]);
  
  // Устанавливаем первый бот как выбранный
  useEffect(() => {
    if (bots.length > 0 && !selectedBot) {
      setSelectedBot(bots[0]);
    }
  }, [bots]);
  
  const loadBots = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://api.gramchat.ru'}/bots/my-bots`, {
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
    } finally {
      setBotsLoading(false);
    }
  };
  
  // Закрываем меню при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
      if (botSelectorRef.current && !botSelectorRef.current.contains(event.target as Node)) {
        setShowBotSelector(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Компактная шапка с названием бота и профилем */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              {/* Селектор ботов для владельцев */}
              {user?.role === 'OWNER' && bots.length > 0 ? (
                <div className="relative" ref={botSelectorRef}>
                  <button
                    onClick={() => setShowBotSelector(!showBotSelector)}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-4l-4 4z" />
                    </svg>
                    <div className="text-left">
                      <div className="text-sm font-semibold">{selectedBot?.name || 'Выберите бота'}</div>
                      {selectedBot && (
                        <div className="text-xs text-blue-100">@{selectedBot.botUsername}</div>
                      )}
                    </div>
                    <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {showBotSelector && (
                    <div className="absolute left-0 mt-2 w-72 bg-white rounded-lg shadow-lg py-2 z-50 max-h-80 overflow-y-auto">
                      {bots.map((bot) => (
                        <button
                          key={bot.id}
                          onClick={() => {
                            setSelectedBot(bot);
                            setShowBotSelector(false);
                            setSelectedDialog(null);
                          }}
                          className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b last:border-b-0 ${
                            selectedBot?.id === bot.id ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-gray-900">{bot.name}</div>
                              <div className="text-sm text-gray-500">@{bot.botUsername}</div>
                              <div className="text-xs text-gray-400 mt-1">{bot.category}</div>
                            </div>
                            {selectedBot?.id === bot.id && (
                              <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                        </button>
                      ))}
                      <div className="border-t pt-2 px-4">
                        <button
                          onClick={() => {
                            setShowBotSelector(false);
                            navigate('/create-bot');
                          }}
                          className="w-full text-left py-2 text-blue-600 hover:text-blue-700 flex items-center gap-2"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          <span>Подключить нового бота</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <h2 className="text-xl font-bold">{shop?.name || selectedBot?.name || 'GramChat'}</h2>
              )}
              
              {(shop || selectedBot) && (
                <div className="flex items-center gap-3 text-blue-100 text-sm">
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>{(shop || selectedBot)?.botUsername?.startsWith('@') ? (shop || selectedBot).botUsername : `@${(shop || selectedBot)?.botUsername || 'не подключен'}`}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <span>{(shop || selectedBot)?.category || 'Общее'}</span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {/* Кнопка аналитики для владельцев и менеджеров */}
              <button
                onClick={() => setShowAnalytics(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors"
                title="Аналитика"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span>Аналитика</span>
              </button>
              
              {/* Кнопка управления менеджерами для владельцев */}
              {user?.role === 'OWNER' && (
                <button
                  onClick={() => setShowManagersPanel(true)}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors"
                  title="Управление менеджерами"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <span>Менеджеры</span>
                </button>
              )}
              
              {/* Кнопка профиля */}
              <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>{user?.firstName}</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg py-2 z-50">
                <div className="px-4 py-3 border-b">
                  <p className="text-sm font-medium text-gray-900">{user?.firstName} {user?.lastName}</p>
                  <p className="text-sm text-gray-500">@{user?.username || 'Не указан'}</p>
                  <p className="text-xs text-gray-400">ID: {user?.telegramId}</p>
                </div>
                
                <div className="px-4 py-2">
                  <div className="flex items-center justify-between py-1">
                    <span className="text-sm text-gray-600">Роль:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {user?.role === 'OWNER' ? 'Владелец' : 'Менеджер'}
                    </span>
                  </div>
                </div>
                
                <div className="border-t pt-2">
                  <button
                    onClick={() => {
                      handleLogout();
                      setShowProfileMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Выйти
                  </button>
                </div>
              </div>
            )}
          </div>
            </div>
          </div>
        </div>
      </div>

      {/* Основной контент с ограниченной шириной */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-6">
        <div className="flex bg-white rounded-xl shadow-lg overflow-hidden" style={{ height: 'calc(100vh - 120px)', marginTop: '1rem' }}>
        {/* Список диалогов */}
        <div style={{ width: '320px', borderRight: '1px solid #e0e0e0' }}>
          <ErrorBoundary>
            <DialogsListStyled 
              onSelectDialog={setSelectedDialog}
              selectedDialogId={selectedDialog?.id}
              botId={selectedBot?.id || shop?.id}
            />
          </ErrorBoundary>
        </div>

        {/* Окно чата */}
        <div style={{ flex: 1 }}>
          <ChatErrorBoundary>
            <ChatWindowStyled 
              dialog={selectedDialog}
              onClose={() => setSelectedDialog(null)}
              onTransfer={user?.role === 'OWNER' ? () => setShowTransfer(true) : undefined}
              showConnectButtons={(user?.role === 'OWNER' || userRole === 'OWNER') && bots.length === 0 && !botsLoading}
              userRole={user?.role || userRole}
            />
          </ChatErrorBoundary>
        </div>
        </div>
      </div>
      
      {/* Модальное окно передачи диалога */}
      {showTransfer && selectedDialog && (
        <ErrorBoundary>
          <DialogTransfer
            dialog={selectedDialog}
            onTransfer={() => {
              window.location.reload();
            }}
            onClose={() => setShowTransfer(false)}
          />
        </ErrorBoundary>
      )}
      
      {/* Модальное окно управления менеджерами */}
      {showManagersPanel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-semibold">Управление персоналом</h2>
              <button
                onClick={() => setShowManagersPanel(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
              <ErrorBoundary>
                <ManagerManagement />
              </ErrorBoundary>
            </div>
          </div>
        </div>
      )}
      
      {/* Модальное окно аналитики */}
      {showAnalytics && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-semibold">Аналитика</h2>
              <button
                onClick={() => setShowAnalytics(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
              <ErrorBoundary>
                <Analytics />
              </ErrorBoundary>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}