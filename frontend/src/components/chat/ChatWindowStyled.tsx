import { useState, useEffect, memo, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Dialog, Message as IMessage } from './types';
import { useSocket } from '../../hooks/useSocket';
import { useAuth } from '../../hooks/useAuth';
import '@chatscope/chat-ui-kit-styles/dist/default/styles.min.css';
import './ChatWindow.css';
import {
  MainContainer,
  ChatContainer,
  ConversationHeader,
  Avatar
} from '@chatscope/chat-ui-kit-react';
import { FileUploadInput } from './FileUploadInput';

import { getApiUrl } from '../../config/api.config';

const API_URL = getApiUrl();

// Глобальный кеш для аватарок
const globalAvatarCache = new Map<string, string>();

interface ChatWindowStyledProps {
  dialog: Dialog | null;
  onClose: () => void;
  onTransfer?: () => void;
  showConnectButtons?: boolean;
  userRole?: string;
}

export function ChatWindowStyled({ dialog, showConnectButtons, userRole }: ChatWindowStyledProps) {
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [messageInputValue, setMessageInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [showCloseMenu, setShowCloseMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [localDialog, setLocalDialog] = useState(dialog);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const { user } = useAuth();
  const socket = useSocket(user?.shop?.id);
  const token = localStorage.getItem('authToken');
  
  let currentUserId = user?.id || '';
  
  // Если нет user ID, попробуем получить из токена
  if (!currentUserId && token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      currentUserId = payload.userId || '';
    } catch (e) {
      console.error('Failed to get userId from token:', e);
    }
  }
  
  // Получаем роль из токена как запасной вариант
  let tokenUserRole = user?.role;
  if (token && !tokenUserRole) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      tokenUserRole = payload.role;
    } catch (e) {
      console.error('Failed to parse token:', e);
    }
  }

  useEffect(() => {
    setLocalDialog(dialog);
  }, [dialog]);
  
  useEffect(() => {
    if (localDialog) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [localDialog]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Закрываем меню при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.close-menu-container')) {
        setShowCloseMenu(false);
      }
    };

    if (showCloseMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showCloseMenu]);

  useEffect(() => {
    if (!socket || !localDialog) return;

    const handleNewMessage = (data: any) => {
      if (data.localDialogId === localDialog.id) {
        fetchMessages();
      }
    };

    socket.on('new-message', handleNewMessage);

    return () => {
      socket.off('new-message', handleNewMessage);
    };
  }, [socket, localDialog]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    if (!localDialog) return;
    
    // Only set loading on initial load
    if (messages.length === 0) {
      setLoading(true);
    }
    
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/dialogs/${localDialog.id}/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }

      const data = await response.json();
      console.log('Rendering messages in ChatWindowStyled:', data.messages);
      if (data.messages && Array.isArray(data.messages)) {
        setMessages(data.messages);
      } else {
        setMessages([]);
      }
      
      // Update localDialog data if provided by API
      if (data.dialog) {
        setLocalDialog(prev => ({ ...prev, ...data.dialog }));
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (message: string) => {
    if (!localDialog || !message.trim() || sending) return;

    setSending(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/dialogs/${localDialog.id}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: message })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      setMessageInputValue('');
      await fetchMessages();
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Ошибка отправки сообщения');
    } finally {
      setSending(false);
    }
  };

  const changeStatus = async (newStatus: 'ACTIVE' | 'CLOSED', closeReason?: 'DEAL' | 'CANCELLED') => {
    if (!localDialog) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/dialogs/${localDialog.id}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          status: newStatus,
          closeReason: closeReason
        })
      });
      
      if (response.ok) {
        localDialog.status = newStatus;
        if (closeReason) {
          localDialog.closeReason = closeReason;
        }
        setLocalDialog({...localDialog});
      }
    } catch (err) {
      console.error('Error changing status:', err);
    }
  };

  const claimDialog = async () => {
    if (!localDialog || claiming) return;

    setClaiming(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/dialogs/${localDialog.id}/claim`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to claim dialog');
      }

      const updatedDialog = await response.json();
      // Обновляем локальное состояние диалога
      setLocalDialog(updatedDialog);
      // Также обновляем messages для перезагрузки UI
      await fetchMessages();
    } catch (err: any) {
      console.error('Error claiming dialog:', err);
      alert(err.message || 'Ошибка при захвате диалога');
    } finally {
      setClaiming(false);
    }
  };

  const releaseDialog = async () => {
    if (!localDialog) return;

    if (!confirm('Освободить диалог? Другой менеджер сможет его взять.')) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/dialogs/${localDialog.id}/release`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to release dialog');
      }

      const updatedDialog = await response.json();
      // Обновляем локальное состояние диалога
      setLocalDialog(updatedDialog);
      // Также обновляем messages для перезагрузки UI
      await fetchMessages();
    } catch (err) {
      console.error('Error releasing dialog:', err);
      alert('Ошибка при освобождении диалога');
    }
  };

  if (!localDialog) {
    // Показываем кнопки подключения ботов для владельцев без ботов
    if (showConnectButtons && userRole === 'OWNER') {
      return (
        <div className="h-full flex flex-col items-center justify-center bg-gray-50 p-8">
          <div className="text-gray-400 mb-6">
            <svg className="w-20 h-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Подключите бота для начала работы
          </h3>
          <p className="text-sm text-gray-500 mb-8 text-center max-w-md">
            Создайте и подключите бота в Telegram или другой платформе, чтобы начать общение с клиентами
          </p>
          
          {/* Кнопки подключения */}
          <div className="grid md:grid-cols-2 gap-4 w-full max-w-lg">
            {/* Telegram Bot */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <button
                onClick={() => window.location.href = '/create-bot'}
                className="w-full p-6 text-left"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.56c-.21 2.27-1.13 7.75-1.6 10.29-.2 1.08-.59 1.44-.97 1.47-.82.07-1.45-.54-2.24-.97-1.24-.77-1.94-1.24-3.14-1.99-1.39-.86-.49-1.33.3-2.1.21-.2 3.82-3.5 3.89-3.8.01-.04.01-.19-.07-.27-.09-.08-.22-.05-.32-.03-.13.03-2.3 1.46-6.5 4.29-.61.42-1.17.63-1.67.62-.55-.01-1.6-.31-2.39-.56-.96-.31-1.72-.47-1.66-1 .04-.27.41-.55 1.13-.82 4.43-1.93 7.39-3.2 8.88-3.82 4.23-1.75 5.11-2.06 5.68-2.07.13 0 .4.03.58.17.15.12.19.28.21.44-.01.12-.03.31-.05.47z"/>
                  </svg>
                </div>
                <h4 className="font-medium text-gray-900 mb-1">
                  Подключить бота Telegram
                </h4>
                <p className="text-xs text-gray-500">
                  Создайте бота через @BotFather
                </p>
              </button>
            </div>

            {/* MAX Bot */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 relative overflow-hidden opacity-75">
              <div className="absolute inset-0 bg-gray-100 opacity-30"></div>
              <button
                disabled
                className="w-full p-6 text-left cursor-not-allowed relative"
              >
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h4 className="font-medium text-gray-900 mb-1">
                  Подключить бота MAX
                </h4>
                <p className="text-xs text-gray-500">
                  Скоро будет доступно
                </p>
                <div className="absolute top-2 right-2">
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded">
                    В разработке
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>
      );
    }
    
    // Если показывать кнопки подключения ботов
    if (showConnectButtons && userRole === 'OWNER') {
      return (
        <div className="h-full flex flex-col items-center justify-center bg-gray-50 p-8">
          <div className="text-gray-400 mb-6">
            <svg className="w-20 h-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Подключите бота для начала работы
          </h3>
          <p className="text-sm text-gray-500 mb-8 text-center max-w-md">
            Создайте и подключите бота в Telegram или другой платформе, чтобы начать общение с клиентами
          </p>
          
          {/* Кнопки подключения */}
          <div className="grid md:grid-cols-2 gap-4 w-full max-w-lg">
            {/* Telegram Bot */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <button
                onClick={() => window.location.href = '/create-bot'}
                className="w-full p-6 text-left"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.56c-.21 2.27-1.13 7.75-1.6 10.29-.2 1.08-.59 1.44-.97 1.47-.82.07-1.45-.54-2.24-.97-1.24-.77-1.94-1.24-3.14-1.99-1.39-.86-.49-1.33.3-2.1.21-.2 3.82-3.5 3.89-3.8.01-.04.01-.19-.07-.27-.09-.08-.22-.05-.32-.03-.13.03-2.3 1.46-6.5 4.29-.61.42-1.17.63-1.67.62-.55-.01-1.6-.31-2.39-.56-.96-.31-1.72-.47-1.66-1 .04-.27.41-.55 1.13-.82 4.43-1.93 7.39-3.2 8.88-3.82 4.23-1.75 5.11-2.06 5.68-2.07.13 0 .4.03.58.17.15.12.19.28.21.44-.01.12-.03.31-.05.47z"/>
                  </svg>
                </div>
                <h4 className="font-medium text-gray-900 mb-1">
                  Подключить бота Telegram
                </h4>
                <p className="text-xs text-gray-500">
                  Создайте бота через @BotFather
                </p>
              </button>
            </div>

            {/* MAX Bot */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 relative overflow-hidden opacity-75">
              <div className="absolute inset-0 bg-gray-100 opacity-30"></div>
              <button
                disabled
                className="w-full p-6 text-left cursor-not-allowed relative"
              >
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h4 className="font-medium text-gray-900 mb-1">
                  Подключить бота MAX
                </h4>
                <p className="text-xs text-gray-500">
                  Скоро будет доступно
                </p>
                <div className="absolute top-2 right-2">
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded">
                    В разработке
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>
      );
    }
    
    // Обычное сообщение для выбора диалога
    return (
      <div className="h-full flex items-center justify-center text-gray-500 bg-gray-50">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <p>Выберите диалог для начала общения</p>
        </div>
      </div>
    );
  }

  if (loading && messages.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-gray-500">Загрузка чата...</div>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };
  
  const CustomerAvatar = memo(({ size = 42, marginRight = 0 }: { size?: number; marginRight?: number }) => {
    const [imageError, setImageError] = useState(false);
    const [loading, setLoading] = useState(false);
    
    // Проверяем кеш
    const cachedAvatar = localDialog ? globalAvatarCache.get(localDialog.id) : null;
    const [avatarDataUrl, setAvatarDataUrl] = useState<string | null>(cachedAvatar || null);
    
    useEffect(() => {
      // Если уже есть в кеше, ничего не делаем
      if (cachedAvatar || !localDialog) return;
      
      if (localDialog.customerPhotoUrl && !imageError && !loading) {
        setLoading(true);
        const token = localStorage.getItem('authToken');
        fetch(`${API_URL}/dialogs/${localDialog.id}/avatar?token=${token}`)
          .then(res => res.json())
          .then(data => {
            if (data.avatarUrl) {
              // Сохраняем в глобальный кеш
              globalAvatarCache.set(localDialog.id, data.avatarUrl);
              setAvatarDataUrl(data.avatarUrl);
            }
          })
          .catch(err => {
            console.error('Failed to fetch avatar:', err);
            setImageError(true);
          })
          .finally(() => setLoading(false));
      }
    }, [localDialog?.id, cachedAvatar, imageError, loading]);
    
    if (!localDialog) return null;
    
    if (loading) {
      return (
        <div
          style={{
            width: `${size}px`,
            height: `${size}px`,
            borderRadius: '50%',
            backgroundColor: '#e0e0e0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <span style={{ fontSize: `${size / 3}px`, color: '#999' }}>...</span>
        </div>
      );
    }
    
    if (avatarDataUrl && !imageError) {
      return (
        <img
          src={avatarDataUrl}
          alt={localDialog.customerName}
          style={{
            width: `${size}px`,
            height: `${size}px`,
            borderRadius: '50%',
            objectFit: 'cover',
            marginRight: marginRight ? `${marginRight}px` : 0,
            flexShrink: 0
          }}
          onError={() => {
            console.error('Failed to display avatar');
            setImageError(true);
          }}
        />
      );
    }
    
    // Fallback to initials
    return (
      <div
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '50%',
          backgroundColor: '#007bff',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: `${size / 2.5}px`,
          fontWeight: 'bold',
          marginRight: marginRight ? `${marginRight}px` : 0,
          flexShrink: 0
        }}
      >
        {getInitials(localDialog.customerName)}
      </div>
    );
  });

  return (
    <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <MainContainer style={{ flex: 1, paddingBottom: '120px' }}>
        <ChatContainer style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <ConversationHeader>
            <Avatar>
              <CustomerAvatar />
            </Avatar>
            <ConversationHeader.Content 
              userName={`${localDialog.customerName}${localDialog.assignedToId === currentUserId ? ' • Ваш диалог' : ''}`}
              info={
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '4px',
                    fontSize: '12px',
                    color: '#666'
                  }}>
                    <svg style={{ width: '14px', height: '14px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    {localDialog.customerUsername ? `@${localDialog.customerUsername}` : 'Telegram'}
                  </div>
                  {localDialog.assignedTo && localDialog.assignedToId !== currentUserId && (
                    <div style={{ 
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '12px', 
                      color: '#666'
                    }}>
                      <svg style={{ width: '14px', height: '14px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                      <span>Менеджер: {localDialog.assignedTo.firstName} {localDialog.assignedTo.lastName || ''}</span>
                    </div>
                  )}
                </div>
              }
            />
            <ConversationHeader.Actions>
              {!localDialog.assignedToId && localDialog.status !== 'CLOSED' && (
                <button
                  onClick={claimDialog}
                  disabled={claiming}
                  style={{
                    padding: '6px 12px',
                    marginRight: '8px',
                    background: '#4caf50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: claiming ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    opacity: claiming ? 0.6 : 1
                  }}
                >
                  {claiming ? '...' : 'Взять себе'}
                </button>
              )}
              
              {localDialog.assignedToId === currentUserId && localDialog.status !== 'CLOSED' && (
                <button
                  onClick={releaseDialog}
                  style={{
                    padding: '6px 12px',
                    marginRight: '8px',
                    background: '#ff9800',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Освободить
                </button>
              )}
              
              {localDialog.status !== 'CLOSED' && (
                <div className="close-menu-container" style={{ position: 'relative', zIndex: 1001 }}>
                  <button
                    ref={closeButtonRef}
                    onClick={() => {
                      if (closeButtonRef.current) {
                        const rect = closeButtonRef.current.getBoundingClientRect();
                        setMenuPosition({
                          top: rect.bottom + 4,
                          left: rect.right - 180
                        });
                      }
                      setShowCloseMenu(!showCloseMenu);
                    }}
                    style={{
                      padding: '6px 12px',
                      background: '#4caf50',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <svg style={{ width: '16px', height: '16px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Закрыть
                  </button>
                </div>
              )}
            </ConversationHeader.Actions>
          </ConversationHeader>
        </ChatContainer>
        
        {/* Наши сообщения вне ChatContainer */}
        <div style={{ 
          position: 'absolute', 
          top: '60px', 
          left: 0, 
          right: 0, 
          bottom: '80px',
          background: '#fafafa',
          overflow: 'auto',
          borderTop: '1px solid #e0e0e0',
          zIndex: 10
        }}>
          <div style={{ padding: '20px', height: '100%', overflowY: 'auto' }}>
            {messages.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                <svg style={{ width: '48px', height: '48px', marginBottom: '16px', opacity: 0.5 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <div>Нет сообщений</div>
              </div>
            ) : (
              messages.map((msg) => {
                let messageContent = msg.text || '';
                
                // Добавляем иконки для разных типов сообщений
                if (msg.messageType !== 'TEXT' && msg.messageType) {
                  const typeLabels: Record<string, string> = {
                    'PHOTO': '📷 Фото',
                    'VIDEO': '🎥 Видео',
                    'AUDIO': '🎵 Аудио',
                    'DOCUMENT': '📄 Документ',
                    'VOICE': '🎤 Голосовое сообщение',
                    'LOCATION': '📍 Локация'
                  };
                  messageContent = typeLabels[msg.messageType] || '📎 Файл';
                  if (msg.text) {
                    messageContent += ': ' + msg.text;
                  }
                }
                
                return (
                  <div
                    key={msg.id}
                    style={{
                      display: 'flex',
                      justifyContent: msg.fromUser ? 'flex-start' : 'flex-end',
                      marginBottom: '16px',
                      alignItems: 'flex-end'
                    }}
                  >
                    {msg.fromUser && (
                      <CustomerAvatar size={32} marginRight={8} />
                    )}
                    <div
                      style={{
                        maxWidth: '70%',
                        padding: '12px 16px',
                        borderRadius: msg.fromUser ? '18px 18px 18px 4px' : '18px 18px 4px 18px',
                        backgroundColor: msg.fromUser ? '#ffffff' : '#007bff',
                        color: msg.fromUser ? '#000' : '#fff',
                        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                        wordBreak: 'break-word'
                      }}
                    >
                      <div style={{ fontSize: '15px', lineHeight: '1.4' }}>{messageContent}</div>
                      <div style={{ 
                        fontSize: '11px', 
                        marginTop: '4px', 
                        opacity: 0.7,
                        color: msg.fromUser ? '#666' : 'rgba(255, 255, 255, 0.8)'
                      }}>
                        {new Date(msg.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </MainContainer>

      {/* Поле ввода сообщений */}
      {localDialog.status !== 'CLOSED' ? (
        localDialog.assignedToId && localDialog.assignedToId !== currentUserId ? (
          (userRole || tokenUserRole) === 'OWNER' ? (
            <div style={{ 
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: '#fafafa',
              borderTop: '1px solid #e0e0e0',
              zIndex: 30
            }}>
              <div style={{ padding: '8px 16px', background: '#fff8e1', borderBottom: '1px solid #ffe0b2' }}>
                <p style={{ margin: 0, fontSize: '12px', color: '#f57c00' }}>
                  Диалог обрабатывается менеджером: <strong>{localDialog.assignedTo?.firstName} {localDialog.assignedTo?.lastName || ''}</strong>
                </p>
              </div>
              <FileUploadInput
                dialogId={localDialog.id}
                placeholder="Введите сообщение (как владелец)..." 
                value={messageInputValue}
                onChange={val => setMessageInputValue(val)}
                onSend={() => handleSend(messageInputValue)}
                onFileUpload={() => fetchMessages()}
                disabled={sending}
              />
            </div>
          ) : (
            <div style={{ 
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '16px',
              background: '#fff8e1',
              textAlign: 'center',
              borderTop: '1px solid #ffe0b2'
            }}>
              <p style={{ margin: 0, color: '#f57c00' }}>
                Диалог обрабатывается менеджером: <strong>{localDialog.assignedTo?.firstName} {localDialog.assignedTo?.lastName || ''}</strong>
              </p>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#ff6f00' }}>
                Вы можете только просматривать сообщения
              </p>
            </div>
          )
        ) : (
          <div style={{ 
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: '#fafafa',
            borderTop: '1px solid #e0e0e0',
            zIndex: 30
          }}>
            <FileUploadInput
              dialogId={localDialog.id}
              placeholder="Введите сообщение..." 
              value={messageInputValue}
              onChange={val => setMessageInputValue(val)}
              onSend={() => handleSend(messageInputValue)}
              onFileUpload={() => fetchMessages()}
              disabled={sending}
            />
          </div>
        )
      ) : (
        <div style={{ 
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '16px',
          background: '#f5f5f5',
          textAlign: 'center',
          borderTop: '1px solid #e0e0e0'
        }}>
          <p style={{ margin: '0 0 12px 0', color: '#666' }}>Диалог закрыт</p>
          {((userRole || tokenUserRole) === 'OWNER' || localDialog.assignedToId === currentUserId) && (
            <button
              onClick={() => changeStatus('ACTIVE')}
              style={{
                padding: '8px 24px',
                background: '#4caf50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Переоткрыть диалог
            </button>
          )}
        </div>
      )}
      
      {/* Портал для попапа закрытия диалога */}
      {showCloseMenu && ReactDOM.createPortal(
        <div style={{
          position: 'fixed',
          top: `${menuPosition.top}px`,
          left: `${menuPosition.left}px`,
          background: 'white',
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 99999,
          minWidth: '180px'
        }}>
          <button
            onClick={() => {
              changeStatus('CLOSED', 'DEAL');
              setShowCloseMenu(false);
            }}
            style={{
              width: '100%',
              padding: '10px 16px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              textAlign: 'left',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              borderRadius: '8px 8px 0 0'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#f5f5f5'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <svg style={{ width: '20px', height: '20px', color: '#4caf50' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <div style={{ fontWeight: 500 }}>Сделка</div>
              <div style={{ fontSize: '12px', color: '#666' }}>Успешно завершено</div>
            </div>
          </button>
          
          <div style={{ height: '1px', background: '#e0e0e0' }} />
          
          <button
            onClick={() => {
              changeStatus('CLOSED', 'CANCELLED');
              setShowCloseMenu(false);
            }}
            style={{
              width: '100%',
              padding: '10px 16px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              textAlign: 'left',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              borderRadius: '0 0 8px 8px'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#f5f5f5'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <svg style={{ width: '20px', height: '20px', color: '#f44336' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <div style={{ fontWeight: 500 }}>Отмена</div>
              <div style={{ fontSize: '12px', color: '#666' }}>Клиент отказался</div>
            </div>
          </button>
        </div>,
        document.body
      )}
    </div>
  );
}