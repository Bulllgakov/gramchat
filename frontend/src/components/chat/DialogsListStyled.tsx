import { useState, useEffect, memo } from 'react';
import { Dialog } from './types';
import '@chatscope/chat-ui-kit-styles/dist/default/styles.min.css';
import {
  Sidebar,
  ConversationList,
  Conversation,
  Avatar
} from '@chatscope/chat-ui-kit-react';
import { apiService } from '../../services/api.service';
import { showErrorNotification } from '../../utils/errorHandler';
import { useAuth } from '../../hooks/useAuth';

const API_URL = 'http://localhost:3000/api';

// Глобальный кеш для аватарок - вне компонента
const globalAvatarCache = new Map<string, string>();

interface DialogsListStyledProps {
  onSelectDialog: (dialog: Dialog) => void;
  selectedDialogId?: string;
}

export function DialogsListStyled({ onSelectDialog, selectedDialogId }: DialogsListStyledProps) {
  const { user } = useAuth();
  const [dialogs, setDialogs] = useState<Dialog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchValue, setSearchValue] = useState('');
  
  // Определяем начальный фильтр в зависимости от роли
  const getInitialFilter = (): 'all' | 'my' | 'unassigned' => {
    // Для менеджеров фильтр "все" недоступен, используем "свободные" по умолчанию
    return user?.role === 'OWNER' ? 'all' : 'unassigned';
  };
  
  const [filter, setFilter] = useState<'all' | 'my' | 'unassigned'>(getInitialFilter());

  useEffect(() => {
    fetchDialogs();
    // const interval = setInterval(fetchDialogs, 10000); // Отключено для разработки
    // return () => clearInterval(interval);
  }, [filter]);

  const fetchDialogs = async () => {
    try {
      const data = await apiService.get<{ dialogs: Dialog[] }>(`/dialogs?filter=${filter}`);
      console.log('Dialogs fetched:', data);
      console.log('First dialog customerPhotoUrl:', data.dialogs?.[0]?.customerPhotoUrl);
      setDialogs(data.dialogs || []);
      setError(''); // Clear any previous errors
    } catch (err: any) {
      console.error('Error fetching dialogs:', err);
      const errorMessage = err.message || 'Не удалось загрузить диалоги';
      setError(errorMessage);
      // Не показываем уведомление для периодического обновления
      if (dialogs.length === 0) {
        showErrorNotification(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'NEW': return { text: 'Новый', color: 'limegreen' };
      case 'ACTIVE': return { text: 'Активный', color: 'dodgerblue' };
      case 'CLOSED': return { text: 'Закрыт', color: 'gray' };
      default: return { text: status, color: 'gray' };
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };
  
  // Custom avatar component that loads image from API
  const CustomerAvatarForList = memo(({ dialog, size = 36 }: { dialog: Dialog; size?: number }) => {
    const [imageError, setImageError] = useState(false);
    const [loading, setLoading] = useState(false);
    
    // Сразу проверяем кеш
    const cachedAvatar = globalAvatarCache.get(dialog.id);
    const [avatarDataUrl, setAvatarDataUrl] = useState<string | null>(cachedAvatar || null);
    
    useEffect(() => {
      // Если уже есть в кеше, ничего не делаем
      if (cachedAvatar) return;
      
      if (dialog.customerPhotoUrl && !imageError && !loading) {
        setLoading(true);
        const token = localStorage.getItem('authToken');
        fetch(`${API_URL}/dialogs/${dialog.id}/avatar?token=${token}`)
          .then(res => res.json())
          .then(data => {
            if (data.avatarUrl) {
              // Сохраняем в глобальный кеш
              globalAvatarCache.set(dialog.id, data.avatarUrl);
              setAvatarDataUrl(data.avatarUrl);
            }
          })
          .catch(err => {
            console.error('Failed to fetch avatar:', err);
            setImageError(true);
          })
          .finally(() => setLoading(false));
      }
    }, []); // Пустые зависимости - загружаем только один раз
    
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
          alt={dialog.customerName}
          style={{
            width: `${size}px`,
            height: `${size}px`,
            borderRadius: '50%',
            objectFit: 'cover'
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
          fontWeight: 'bold'
        }}
      >
        {getInitials(dialog.customerName)}
      </div>
    );
  }, (prevProps, nextProps) => {
    // Компонент перерисовывается только если изменился dialog.id
    return prevProps.dialog.id === nextProps.dialog.id;
  });

  const filteredDialogs = dialogs.filter(dialog => 
    dialog.customerName.toLowerCase().includes(searchValue.toLowerCase()) ||
    (dialog.customerUsername && dialog.customerUsername.toLowerCase().includes(searchValue.toLowerCase()))
  );


  return (
    <Sidebar position="left" scrollable={false}>
      {/* Кастомное поле поиска */}
      <div style={{ padding: '10px', borderBottom: '1px solid #e0e0e0' }}>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="Поиск диалогов..."
            value={searchValue}
            onChange={e => setSearchValue(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={e => e.target.style.borderColor = '#1976d2'}
            onBlur={e => e.target.style.borderColor = '#e0e0e0'}
          />
          <svg 
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '16px',
              height: '16px',
              color: '#999'
            }}
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchValue && (
            <button
              onClick={() => setSearchValue('')}
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '20px',
                height: '20px',
                border: 'none',
                background: '#f0f0f0',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                color: '#666'
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>
      
      <div style={{ 
        display: 'flex', 
        gap: '4px', 
        padding: '8px',
        borderBottom: '1px solid #e0e0e0'
      }}>
        {/* Сначала Мои */}
        <button
          onClick={() => setFilter('my')}
          style={{
            flex: 1,
            padding: '5px 10px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            background: filter === 'my' ? '#1976d2' : 'white',
            color: filter === 'my' ? 'white' : '#333',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          Мои
        </button>
        
        {/* Потом Свободные */}
        <button
          onClick={() => setFilter('unassigned')}
          style={{
            flex: 1,
            padding: '5px 10px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            background: filter === 'unassigned' ? '#1976d2' : 'white',
            color: filter === 'unassigned' ? 'white' : '#333',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          Свободные
        </button>
        
        {/* Фильтр "Все" - только для владельцев */}
        {user?.role === 'OWNER' && (
          <button
            onClick={() => setFilter('all')}
            style={{
              flex: 1,
              padding: '5px 10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              background: filter === 'all' ? '#1976d2' : 'white',
              color: filter === 'all' ? 'white' : '#333',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Все
          </button>
        )}
      </div>
      
      <ConversationList style={{ paddingTop: 0, paddingBottom: 0 }}>
        <style>
          {`
            .cs-conversation {
              padding: 8px 10px !important;
              min-height: auto !important;
            }
            .cs-conversation__content {
              padding: 0 !important;
            }
            .cs-conversation__name {
              font-size: 14px !important;
              line-height: 1.4 !important;
            }
            .cs-conversation__info {
              font-size: 13px !important;
              line-height: 1.3 !important;
              margin-top: 2px !important;
            }
            .cs-conversation__last-sender-name {
              display: none !important;
            }
            .cs-conversation__operations {
              display: none !important;
            }
            .cs-avatar {
              width: 36px !important;
              height: 36px !important;
            }
            .cs-conversation__unread-dot {
              width: 10px !important;
              height: 10px !important;
              right: 12px !important;
              top: 50% !important;
              transform: translateY(-50%) !important;
              background-color: #f44336 !important;
            }
            .cs-conversation--active .cs-conversation__unread-dot {
              background-color: #2196f3 !important;
            }
          `}
        </style>
        {loading && dialogs.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
            Загрузка...
          </div>
        ) : error ? (
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <div style={{ color: '#f44336', marginBottom: '12px' }}>Ошибка: {error}</div>
            <button
              onClick={fetchDialogs}
              style={{
                padding: '8px 16px',
                background: '#1976d2',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Повторить
            </button>
          </div>
        ) : filteredDialogs.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
            {searchValue ? 'Ничего не найдено' : 'Нет диалогов'}
          </div>
        ) : (
          filteredDialogs.map(dialog => {
            const statusInfo = getStatusInfo(dialog.status);
            const lastMessage = dialog.messages?.[0];
            // Показываем индикатор непрочитанного, если:
            // 1. Диалог новый (NEW)
            // 2. Или последнее сообщение от клиента и диалог активный
            const hasUnread = dialog.status === 'NEW' || 
                            (dialog.status === 'ACTIVE' && lastMessage?.fromUser);
            
            return (
              <Conversation
                key={dialog.id}
                name={dialog.customerName}
                info={lastMessage ? (lastMessage.fromUser ? lastMessage.text : `Вы: ${lastMessage.text}`) : 'Нет сообщений'}
                onClick={() => onSelectDialog(dialog)}
                active={selectedDialogId === dialog.id}
                unreadCnt={hasUnread ? 1 : 0}
              >
                <Avatar status={statusInfo.color as any}>
                  <CustomerAvatarForList dialog={dialog} />
                </Avatar>
              </Conversation>
            );
          })
        )}
      </ConversationList>
    </Sidebar>
  );
}