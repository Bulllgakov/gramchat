import { useNavigate } from 'react-router-dom';
import { CreateBotForm } from '../components/bot/CreateBotForm';
import { useAuth } from '../hooks/useAuth';
import { useEffect } from 'react';

export function CreateBotPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    // Если не владелец, перенаправляем на главную
    if (user && user.role !== 'OWNER') {
      navigate('/');
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Шапка */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-white">GramChat</h1>
            </div>
            <button
              onClick={() => navigate('/')}
              className="text-white/90 hover:text-white transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Назад
            </button>
          </div>
        </div>
      </div>

      {/* Контент */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Подключение Telegram бота
            </h2>
            <p className="text-gray-600">
              Подключите существующего бота из @BotFather к системе
            </p>
          </div>

          {/* Инструкция */}
          <div className="mb-8 bg-blue-50 rounded-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-3">Как получить данные бота:</h3>
            <ol className="space-y-2 text-sm text-gray-700">
              <li className="flex gap-2">
                <span className="font-semibold">1.</span>
                <span>Если у вас уже есть бот - перейдите к шагу 3</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold">2.</span>
                <span>Если нет - создайте бота через @BotFather командой /newbot</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold">3.</span>
                <span>Откройте чат с @BotFather и отправьте /mybots</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold">4.</span>
                <span>Выберите вашего бота и нажмите "API Token"</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold">5.</span>
                <span>Скопируйте токен и данные бота, вставьте их ниже</span>
              </li>
            </ol>
          </div>

          {/* Форма создания бота */}
          <CreateBotForm 
            onSuccess={() => {
              navigate('/');
            }}
            onCancel={() => {
              navigate('/');
            }}
          />
        </div>
      </div>
    </div>
  );
}