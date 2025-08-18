import React, { useState } from 'react';
import { API_URL } from '../../config/api.config';

interface Bot {
  id: string;
  name: string;
  botUsername: string;
  category: string;
}

interface Props {
  bot: Bot | null;
  bots: Bot[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddSubscriptionModal({ bot, bots, onClose, onSuccess }: Props) {
  const [step, setStep] = useState(1);
  const [selectedBot, setSelectedBot] = useState<Bot | null>(bot);
  const [selectedPlan, setSelectedPlan] = useState<'PRO' | 'MAX' | null>(null);
  const [billingPeriod, setBillingPeriod] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'INVOICE' | null>(null);
  const [calculation, setCalculation] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const plans = {
    PRO: {
      name: 'PRO',
      price: 990, // Одинаковая цена для всех типов ботов
      features: [
        'Безлимит диалогов',
        'Приоритетная поддержка',
        'Статистика и аналитика',
        'API доступ'
      ]
    },
    MAX: {
      name: 'MAX',
      price: 3000, // Одинаковая цена для всех типов ботов
      features: [
        'Всё из PRO',
        'Премиум поддержка 24/7',
        'Персональный менеджер',
        'Кастомизация интерфейса',
        'Приоритетная обработка'
      ]
    }
  };

  const calculatePrice = async () => {
    if (!selectedBot || !selectedPlan) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const botType = selectedBot.category === 'MAX' ? 'MAX' : 'TELEGRAM';
      
      const response = await fetch(`${API_URL}/subscriptions/calculate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          planType: selectedPlan,
          botType,
          billingPeriod
        })
      });

      if (response.ok) {
        const data = await response.json();
        setCalculation(data);
      }
    } catch (error) {
      console.error('Error calculating price:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlanSelect = (plan: 'PRO' | 'MAX') => {
    setSelectedPlan(plan);
    setStep(2);
  };

  const handlePeriodChange = (period: number) => {
    setBillingPeriod(period);
  };

  React.useEffect(() => {
    if (selectedBot && selectedPlan && step === 2) {
      calculatePrice();
    }
  }, [selectedBot, selectedPlan, billingPeriod, step]);

  const handlePaymentMethodSelect = (method: 'CARD' | 'INVOICE') => {
    setPaymentMethod(method);
    handleSubmit(method);
  };

  const handleSubmit = async (method: 'CARD' | 'INVOICE') => {
    if (!selectedBot || !selectedPlan) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/subscriptions/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          botId: selectedBot.id,
          planType: selectedPlan,
          billingPeriod,
          paymentMethod: method
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        if (method === 'CARD') {
          // Редирект на страницу оплаты
          alert('Оплата картой временно недоступна. Используйте оплату по счету.');
        } else if (method === 'INVOICE' && data.payment.invoiceUrl) {
          // Открываем счет в новом окне
          window.open(`${API_URL}${data.payment.invoiceUrl}`, '_blank');
        }
        
        onSuccess();
      }
    } catch (error) {
      console.error('Error creating subscription:', error);
      alert('Ошибка создания подписки');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Заголовок */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {step === 1 && 'Выберите тариф'}
            {step === 2 && 'Настройка подписки'}
            {step === 3 && 'Способ оплаты'}
          </h2>
        </div>

        {/* Шаг 1: Выбор тарифа */}
        {step === 1 && (
          <div className="p-6">
            {!bot && bots.length > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Выберите бота
                </label>
                <select
                  value={selectedBot?.id || ''}
                  onChange={(e) => {
                    const bot = bots.find(b => b.id === e.target.value);
                    setSelectedBot(bot || null);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Выберите бота</option>
                  {bots.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name} (@{b.botUsername})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {selectedBot && (
              <div className="mb-6 p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">Выбранный бот:</div>
                <div className="font-medium">{selectedBot.name}</div>
                <div className="text-sm text-gray-500">@{selectedBot.botUsername}</div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Тариф PRO */}
              <div className="border-2 border-gray-200 rounded-lg p-6 hover:border-blue-500 transition-colors cursor-pointer"
                   onClick={() => handlePlanSelect('PRO')}>
                <h3 className="text-lg font-bold text-gray-900 mb-2">PRO</h3>
                <div className="text-2xl font-bold text-blue-600 mb-4">
                  ₽990
                  <span className="text-sm text-gray-500 font-normal">/месяц</span>
                </div>
                <ul className="space-y-2">
                  {plans.PRO.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start">
                      <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button className="mt-4 w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Выбрать PRO
                </button>
              </div>

              {/* Тариф MAX */}
              <div className="border-2 border-gray-200 rounded-lg p-6 hover:border-purple-500 transition-colors cursor-pointer relative"
                   onClick={() => handlePlanSelect('MAX')}>
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="px-3 py-1 bg-purple-600 text-white text-xs font-semibold rounded-full">
                    ПОПУЛЯРНЫЙ
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">MAX</h3>
                <div className="text-2xl font-bold text-purple-600 mb-4">
                  ₽3,000
                  <span className="text-sm text-gray-500 font-normal">/месяц</span>
                </div>
                <ul className="space-y-2">
                  {plans.MAX.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start">
                      <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button className="mt-4 w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                  Выбрать MAX
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Шаг 2: Выбор периода */}
        {step === 2 && calculation && (
          <div className="p-6">
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Выберите период подписки</h3>
              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={() => handlePeriodChange(1)}
                  className={`p-4 border-2 rounded-lg transition-colors ${
                    billingPeriod === 1 ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium">1 месяц</div>
                  <div className="text-sm text-gray-500">Без скидки</div>
                </button>
                <button
                  onClick={() => handlePeriodChange(6)}
                  className={`p-4 border-2 rounded-lg transition-colors relative ${
                    billingPeriod === 6 ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="absolute -top-2 -right-2 px-2 py-1 bg-green-500 text-white text-xs rounded-full">
                    -15%
                  </div>
                  <div className="font-medium">6 месяцев</div>
                  <div className="text-sm text-gray-500">Скидка 15%</div>
                </button>
                <button
                  onClick={() => handlePeriodChange(12)}
                  className={`p-4 border-2 rounded-lg transition-colors relative ${
                    billingPeriod === 12 ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="absolute -top-2 -right-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                    -25%
                  </div>
                  <div className="font-medium">12 месяцев</div>
                  <div className="text-sm text-gray-500">Скидка 25%</div>
                </button>
              </div>
            </div>

            {/* Расчет стоимости */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="font-medium text-gray-900 mb-4">Расчет стоимости</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Тариф {calculation.planType}</span>
                  <span>₽{calculation.basePrice}/мес</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Период</span>
                  <span>{calculation.billingPeriod} мес.</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Сумма без скидки</span>
                  <span>₽{calculation.monthlyTotal}</span>
                </div>
                {calculation.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Скидка {calculation.discount}%</span>
                    <span>-₽{calculation.discountAmount}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-gray-200">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Итого к оплате</span>
                    <span>₽{calculation.finalPrice}</span>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setStep(3)}
              className="mt-6 w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Продолжить к оплате
            </button>
          </div>
        )}

        {/* Шаг 3: Способ оплаты */}
        {step === 3 && (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Выберите способ оплаты</h3>
            <div className="space-y-4">
              <button
                onClick={() => handlePaymentMethodSelect('CARD')}
                disabled={loading}
                className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 transition-colors text-left disabled:opacity-50"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Картой онлайн</div>
                    <div className="text-sm text-gray-500">Мгновенная активация подписки</div>
                  </div>
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
              </button>

              <button
                onClick={() => handlePaymentMethodSelect('INVOICE')}
                disabled={loading}
                className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 transition-colors text-left disabled:opacity-50"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Оплата по счету</div>
                    <div className="text-sm text-gray-500">Получите счет в PDF для оплаты</div>
                  </div>
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </button>
            </div>

            {loading && (
              <div className="mt-4 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Обработка...</p>
              </div>
            )}
          </div>
        )}

        {/* Кнопки навигации */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 text-gray-700 hover:text-gray-900"
            >
              Назад
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:text-gray-900 ml-auto"
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}