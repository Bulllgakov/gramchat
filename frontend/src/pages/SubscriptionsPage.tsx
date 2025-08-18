import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { API_URL } from '../config/api.config';
import AddSubscriptionModal from '../components/subscriptions/AddSubscriptionModal';

interface BotSubscription {
  id: string;
  botType: 'TELEGRAM' | 'MAX';
  planType: 'FREE' | 'PRO' | 'MAX';
  billingPeriod: number;
  discount: number;
  basePrice: number;
  finalPrice: number;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  autoRenew: boolean;
  payments: any[];
}

interface Bot {
  id: string;
  name: string;
  botUsername: string;
  category: string;
  isActive: boolean;
  botSubscription: BotSubscription | null;
  _count: {
    dialogs: number;
  };
}

export default function SubscriptionsPage() {
  const { user } = useAuth();
  const [bots, setBots] = useState<Bot[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedBot, setSelectedBot] = useState<Bot | null>(null);

  useEffect(() => {
    if (user?.role === 'OWNER') {
      fetchSubscriptions();
    }
  }, [user]);

  const fetchSubscriptions = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/subscriptions/my-subscriptions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setBots(data);
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubscription = (bot: Bot) => {
    setSelectedBot(bot);
    setShowAddModal(true);
  };

  const handleCancelSubscription = async (subscriptionId: string) => {
    if (!confirm('Вы уверены, что хотите отменить подписку?')) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/subscriptions/${subscriptionId}/cancel`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        fetchSubscriptions();
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
    }
  };

  const downloadInvoice = async (paymentId: string) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/subscriptions/invoice/${paymentId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const { invoiceUrl } = await response.json();
        window.open(`${API_URL}${invoiceUrl}`, '_blank');
      }
    } catch (error) {
      console.error('Error downloading invoice:', error);
    }
  };

  const getPlanBadgeColor = (planType: string) => {
    switch (planType) {
      case 'FREE': return 'bg-gray-100 text-gray-700';
      case 'PRO': return 'bg-blue-100 text-blue-700';
      case 'MAX': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getBotTypeBadgeColor = (botType: string) => {
    return botType === 'TELEGRAM' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600';
  };

  if (user?.role !== 'OWNER') {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Раздел доступен только владельцам</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Подписки</h1>
        <p className="text-gray-600 mt-2">Управление подписками на ваших ботов</p>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-2xl font-bold text-gray-900">{bots.length}</div>
          <div className="text-sm text-gray-500">Всего ботов</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-2xl font-bold text-green-600">
            {bots.filter(b => b.botSubscription?.isActive).length}
          </div>
          <div className="text-sm text-gray-500">Активных подписок</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-2xl font-bold text-blue-600">
            {bots.filter(b => b.botSubscription?.planType === 'FREE').length}
          </div>
          <div className="text-sm text-gray-500">Бесплатных</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-2xl font-bold text-purple-600">
            {bots.filter(b => b.botSubscription && b.botSubscription.planType !== 'FREE').length}
          </div>
          <div className="text-sm text-gray-500">Платных</div>
        </div>
      </div>

      {/* Список подписок */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Мои боты</h2>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Добавить подписку
            </button>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {bots.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              У вас пока нет подключенных ботов
            </div>
          ) : (
            bots.map(bot => (
              <div key={bot.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">{bot.name}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getBotTypeBadgeColor(bot.botSubscription?.botType || 'TELEGRAM')}`}>
                        {bot.botSubscription?.botType || 'TELEGRAM'}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPlanBadgeColor(bot.botSubscription?.planType || 'FREE')}`}>
                        {bot.botSubscription?.planType || 'FREE'}
                      </span>
                      {bot.botSubscription?.isActive && (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                          Активна
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      @{bot.botUsername} • {bot._count.dialogs} диалогов
                    </div>
                    {bot.botSubscription && bot.botSubscription.planType !== 'FREE' && (
                      <div className="mt-2 text-sm text-gray-600">
                        {bot.botSubscription.billingPeriod} мес. • 
                        {bot.botSubscription.discount > 0 && ` Скидка ${bot.botSubscription.discount}% • `}
                        {bot.botSubscription.finalPrice} руб/период
                        {bot.botSubscription.endDate && (
                          <> • До {new Date(bot.botSubscription.endDate).toLocaleDateString('ru-RU')}</>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {bot.botSubscription?.payments?.[0]?.paymentMethod === 'INVOICE' && 
                     bot.botSubscription.payments[0].invoiceUrl && (
                      <button
                        onClick={() => downloadInvoice(bot.botSubscription!.payments[0].id)}
                        className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                      >
                        Скачать счет
                      </button>
                    )}
                    
                    {(!bot.botSubscription || bot.botSubscription.planType === 'FREE') && (
                      <button
                        onClick={() => handleAddSubscription(bot)}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Улучшить
                      </button>
                    )}
                    
                    {bot.botSubscription && bot.botSubscription.planType !== 'FREE' && bot.botSubscription.isActive && (
                      <button
                        onClick={() => handleCancelSubscription(bot.botSubscription!.id)}
                        className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                      >
                        Отменить
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Модальное окно добавления подписки */}
      {showAddModal && (
        <AddSubscriptionModal
          bot={selectedBot}
          bots={bots.filter(b => !b.botSubscription || b.botSubscription.planType === 'FREE')}
          onClose={() => {
            setShowAddModal(false);
            setSelectedBot(null);
          }}
          onSuccess={() => {
            setShowAddModal(false);
            setSelectedBot(null);
            fetchSubscriptions();
          }}
        />
      )}
    </div>
  );
}