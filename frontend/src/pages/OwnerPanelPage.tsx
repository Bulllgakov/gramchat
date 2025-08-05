import { OwnerPanel } from '../components/owner/OwnerPanel';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export function OwnerPanelPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (user?.role !== 'OWNER') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Доступ запрещен</h2>
          <p className="text-gray-600 mb-4">Эта страница доступна только владельцам магазинов.</p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Вернуться
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 shadow-lg">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">Управление менеджерами</h1>
          <button
            onClick={() => window.close()}
            className="text-white hover:bg-white/20 p-2 rounded transition-colors"
            title="Закрыть"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      
      <div className="p-4">
        <OwnerPanel />
      </div>
    </div>
  );
}