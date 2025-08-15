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
  const [showBotTypeSelector, setShowBotTypeSelector] = useState(false);
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
  
  // По умолчанию выбираем "Все боты"
  useEffect(() => {
    if (bots.length > 0 && selectedBot === null) {
      setSelectedBot('all');
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
                      <div className="text-sm font-semibold">
                        {selectedBot === 'all' ? 'Все боты' : selectedBot?.name || 'Выберите бота'}
                      </div>
                      {selectedBot && selectedBot !== 'all' && (
                        <div className="text-xs text-blue-100">@{selectedBot.botUsername}</div>
                      )}
                      {selectedBot === 'all' && bots.length > 0 && (
                        <div className="text-xs text-blue-100">{bots.length} подключено</div>
                      )}
                    </div>
                    <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {showBotSelector && (
                    <div className="absolute left-0 mt-2 w-72 bg-white rounded-lg shadow-lg py-2 z-50 max-h-80 overflow-y-auto">
                      {/* Опция "Все боты" */}
                      <button
                        onClick={() => {
                          setSelectedBot('all');
                          setShowBotSelector(false);
                          setSelectedDialog(null);
                        }}
                        className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b ${
                          selectedBot === 'all' ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900">Все боты</div>
                            <div className="text-sm text-gray-500">Показать диалоги всех ботов</div>
                            <div className="text-xs text-gray-400 mt-1">{bots.length} подключено</div>
                          </div>
                          {selectedBot === 'all' && (
                            <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </button>
                      
                      {/* Список конкретных ботов */}
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
                      
                      {/* Кнопка подключения нового бота */}
                      <div className="border-t pt-2 px-4">
                        <button
                          onClick={() => {
                            setShowBotSelector(false);
                            setShowBotTypeSelector(true);
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
                onClick={() => {
                  if (bots.length === 0 && user?.role === 'OWNER') {
                    alert('Доступно после подключения ботов');
                  } else {
                    setShowAnalytics(true);
                  }
                }}
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
                  onClick={() => {
                    if (bots.length === 0) {
                      alert('Доступно после подключения ботов');
                    } else {
                      setShowManagersPanel(true);
                    }
                  }}
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
              botId={selectedBot === 'all' ? undefined : (selectedBot?.id || shop?.id || 'placeholder')}
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

      {/* Модальное окно выбора типа бота */}
      {showBotTypeSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-semibold mb-4">Выберите тип бота</h2>
            <p className="text-gray-600 mb-6">Какого типа бота вы хотите подключить?</p>
            
            <div className="space-y-3">
              {/* Telegram бот */}
              <button
                onClick={() => {
                  setShowBotTypeSelector(false);
                  navigate('/create-bot');
                }}
                className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-7 h-7 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.56c-.21 2.27-1.13 7.75-1.6 10.29-.2 1.08-.59 1.44-.97 1.47-.83.07-1.46-.55-2.26-1.07-1.26-.82-1.96-1.33-3.18-2.13-1.41-.92-.5-1.42.31-2.25.21-.22 3.94-3.61 4.01-3.92.01-.04 0-.17-.06-.25s-.15-.09-.22-.07c-.09.02-1.56 1-4.41 2.91-.42.3-.8.44-1.14.44-.37 0-1.09-.21-1.63-.39-.65-.21-1.17-.33-1.13-.69.02-.19.29-.38.81-.58 3.18-1.39 5.31-2.3 6.38-2.75 3.04-1.26 3.67-1.48 4.08-1.49.09 0 .29.02.42.13.11.09.14.21.16.35-.01.04.01.19 0 .29z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Telegram бот</h3>
                    <p className="text-sm text-gray-500">Подключите бота из Telegram</p>
                  </div>
                </div>
              </button>
              
              {/* MAX бот - в разработке */}
              <button
                disabled
                className="w-full p-4 border-2 border-gray-200 rounded-lg opacity-50 cursor-not-allowed text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">MAX бот</h3>
                    <p className="text-sm text-gray-500">Скоро будет доступно</p>
                  </div>
                  <span className="ml-auto text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">В разработке</span>
                </div>
              </button>
            </div>
            
            <button
              onClick={() => setShowBotTypeSelector(false)}
              className="w-full mt-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Отмена
            </button>
          </div>
        </div>
      )}
    </div>
  );
}