import { useState, useEffect } from 'react';
import { DialogsListStyled } from '../chat/DialogsListStyled';
import { ChatWindowStyled } from '../chat/ChatWindowStyled';
import { Dialog } from '../chat/types';
import { DialogTransfer } from '../owner/DialogTransfer';
import { ManagerManagement } from '../owner/ManagerManagement';
import { Analytics } from '../analytics/Analytics';
import { useAuth } from '../../hooks/useAuth';
import { ChatErrorBoundary } from '../ChatErrorBoundary';
import { ErrorBoundary } from '../ErrorBoundary';

interface ShopDashboardStyledProps {
  shop?: any;
  userRole?: string;
}

export function ShopDashboardStyled({ shop, userRole }: ShopDashboardStyledProps) {
  const [selectedDialog, setSelectedDialog] = useState<Dialog | null>(null);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showManagersPanel, setShowManagersPanel] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [bots, setBots] = useState<any[]>([]);
  const [selectedBot, setSelectedBot] = useState<any | null>(null);
  const { user } = useAuth();
  
  // Загружаем боты если нет объекта shop
  useEffect(() => {
    if (!shop && userRole === 'OWNER') {
      loadBots();
    }
  }, []);

  const loadBots = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://api.gramchat.ru'}/bots/my-bots`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setBots(data);
        if (data.length > 0 && !selectedBot) {
          setSelectedBot(data[0]);
        }
      }
    } catch (error) {
      console.error('Error loading bots:', error);
    }
  };

  // Определяем, нужно ли показывать кнопки подключения ботов
  const showConnectButtons = userRole === 'OWNER' && bots.length === 0 && !shop;
  
  // Даем возможность показывать интерфейс даже без botId для владельцев
  // Менеджеры должны иметь botId через shop
  const botIdToUse = selectedBot?.id || shop?.botId || (userRole === 'OWNER' ? 'placeholder' : undefined);

  return (
    <div className="h-screen overflow-hidden bg-gray-50">
      <ChatErrorBoundary>
        <div className="flex h-full">
          {/* Список диалогов в styled компоненте */}
          <DialogsListStyled
            onSelectDialog={(d) => setSelectedDialog(d)}
            selectedDialogId={selectedDialog?.id}
            botId={botIdToUse}
            onShowAnalytics={() => setShowAnalytics(true)}
            onShowManagers={() => setShowManagersPanel(true)}
            userRole={userRole || user?.role}
          />
          
          {/* Окно чата в styled компоненте */}
          <ChatWindowStyled
            dialog={selectedDialog}
            onClose={() => setSelectedDialog(null)}
            showConnectButtons={showConnectButtons}
            userRole={userRole || user?.role}
          />
        </div>
      </ChatErrorBoundary>

      {/* Модальное окно передачи диалога */}
      {showTransfer && selectedDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Передать диалог менеджеру</h3>
            <DialogTransfer
              dialogId={selectedDialog.id}
              currentManagerId={selectedDialog.managerId || undefined}
              onClose={() => setShowTransfer(false)}
            />
          </div>
        </div>
      )}

      {/* Модальное окно управления менеджерами */}
      {showManagersPanel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-6xl w-full m-4 max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold">Управление менеджерами</h2>
              <button
                onClick={() => setShowManagersPanel(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
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
          <div className="bg-white rounded-lg max-w-6xl w-full m-4 max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
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