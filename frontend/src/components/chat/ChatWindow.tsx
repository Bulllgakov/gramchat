import { useState, useEffect, useRef } from 'react';
import { Dialog, Message } from './types';
import { FileUploadInput } from './FileUploadInput';
import '@chatscope/chat-ui-kit-styles/dist/default/styles.min.css';
import './ChatWindow.css';

const API_URL = 'http://localhost:3000/api';

interface ChatWindowProps {
  dialog: Dialog | null;
  onClose: () => void;
}

export function ChatWindow({ dialog, onClose }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (dialog) {
      console.log('Dialog changed, fetching messages for:', dialog.id);
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
      console.log('Fetched messages:', data);
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