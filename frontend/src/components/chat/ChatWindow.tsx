import { useState, useEffect, useRef } from 'react';
import { getApiUrl } from '../../config/api.config';
import { Dialog, Message } from './types';
import { getApiUrl } from '../../config/api.config';
import { FileUploadInput } from './FileUploadInput';
import { getApiUrl } from '../../config/api.config';
import '@chatscope/chat-ui-kit-styles/dist/default/styles.min.css';
import './ChatWindow.css';

const API_URL = getApiUrl();

interface ChatWindowProps {
  dialog: Dialog | null;
  botId?: string;
  onClose: () => void;
  showConnectButtons?: boolean;
}

export function ChatWindow({ dialog, botId, onClose, showConnectButtons }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (dialog) {
      fetchMessages();
      // Обновляем сообщения каждые 3 секунды
      const interval = setInterval(fetchMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [dialog]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    if (!dialog) return;
    
    // Only set loading on initial load
    if (messages.length === 0) {
      setLoading(true);
    }
    
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/dialogs/${dialog.id}/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }

      const data = await response.json();
      setMessages(data.messages || []);
      
      // Update dialog info if provided
      if (data.dialog && dialog) {
        // Update dialog properties with new data
        Object.assign(dialog, data.dialog);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dialog || !newMessage.trim() || sending) return;

    setSending(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/dialogs/${dialog.id}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: newMessage })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      setNewMessage('');
      await fetchMessages();
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Ошибка отправки сообщения');
    } finally {
      setSending(false);
    }
  };

  const changeStatus = async (newStatus: 'ACTIVE' | 'CLOSED') => {
    if (!dialog) return;

    try {
      const token = localStorage.getItem('authToken');
      await fetch(`${API_URL}/dialogs/${dialog.id}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      // Обновляем статус локально
      dialog.status = newStatus;
    } catch (err) {
      console.error('Error changing status:', err);
    }
  };

  if (!dialog) {
    // Показываем кнопки подключения ботов для владельцев без ботов
    if (showConnectButtons) {
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
      <div className="h-full flex items-center justify-center text-gray-500">
        Выберите диалог для начала общения
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Заголовок */}
      <div className="p-4 border-b bg-white">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            {/* Аватарка клиента */}
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
              <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold">
                {dialog.customerName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h3 className="font-semibold">{dialog.customerName}</h3>
              {dialog.customerUsername && (
                <p className="text-sm text-gray-500">@{dialog.customerUsername}</p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {dialog.status !== 'CLOSED' && (
              <button
                onClick={() => changeStatus('CLOSED')}
                className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
              >
                Закрыть диалог
              </button>
            )}
            <button
              onClick={onClose}
              className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              ✕
            </button>
          </div>
        </div>
      </div>

      {/* Сообщения */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {loading && messages.length === 0 ? (
          <div className="text-center text-gray-500">Загрузка...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500">Нет сообщений</div>
        ) : (
          <div className="space-y-2">
            {messages.map(message => (
              <div
                key={message.id}
                className={`flex gap-2 ${message.fromUser ? 'justify-start' : 'justify-end'}`}
              >
                {message.fromUser && (
                  <div className="flex-shrink-0">
                    {dialog.customerPhotoUrl ? (
                      <img
                        src={`${API_URL}/dialogs/${dialog.id}/avatar?token=${localStorage.getItem('authToken')}`}
                        alt={dialog.customerName}
                        className="w-8 h-8 rounded-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(dialog.customerName)}&background=random`;
                        }}
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-sm font-semibold">
                        {dialog.customerName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                )}
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.fromUser
                      ? 'bg-white text-gray-800'
                      : 'bg-blue-600 text-white'
                  }`}
                >
                  {/* Media content */}
                  {message.messageType === 'PHOTO' && message.fileUrl && (
                    <div className="mb-2">
                      <img 
                        src={`${API_URL}${message.fileUrl}`}
                        alt={message.fileName || 'Photo'}
                        className="rounded max-w-full cursor-pointer"
                        onClick={() => window.open(`${API_URL}${message.fileUrl}`, '_blank')}
                      />
                    </div>
                  )}
                  
                  {message.messageType === 'VIDEO' && message.fileUrl && (
                    <div className="mb-2">
                      <video 
                        src={`${API_URL}${message.fileUrl}`}
                        controls
                        className="rounded max-w-full"
                      />
                    </div>
                  )}
                  
                  {message.messageType === 'DOCUMENT' && message.fileUrl && (
                    <div className="mb-2">
                      <a 
                        href={`${API_URL}${message.fileUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center gap-2 p-2 rounded ${
                          message.fromUser ? 'bg-gray-100' : 'bg-blue-500'
                        }`}
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm truncate">
                          {message.fileName || 'Document'}
                        </span>
                      </a>
                    </div>
                  )}
                  
                  {message.messageType === 'VOICE' && message.fileUrl && (
                    <div className="mb-2">
                      <audio 
                        src={`${API_URL}${message.fileUrl}`}
                        controls
                        className="max-w-full"
                      />
                    </div>
                  )}
                  
                  {/* Text content */}
                  {message.text && (
                    <p className="text-sm">{message.text}</p>
                  )}
                  
                  <p className={`text-xs mt-1 ${
                    message.fromUser ? 'text-gray-400' : 'text-blue-100'
                  }`}>
                    {new Date(message.createdAt).toLocaleTimeString('ru-RU')}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Форма отправки */}
      {dialog.status !== 'CLOSED' && (
        <div style={{ borderTop: '1px solid #d1dbe3' }}>
          <FileUploadInput
            dialogId={dialog.id}
            value={newMessage}
            onChange={setNewMessage}
            onSend={() => {
              if (newMessage.trim() && !sending) {
                sendMessage(new Event('submit') as any);
              }
            }}
            onFileUpload={() => {
              // Обновляем сообщения после загрузки файла
              fetchMessages();
            }}
            disabled={sending}
            placeholder="Введите сообщение..."
          />
        </div>
      )}
    </div>
  );
}