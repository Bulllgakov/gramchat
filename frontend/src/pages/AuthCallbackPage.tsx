import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [token, setToken] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    const inviteParam = searchParams.get('invite');
    
    if (!tokenParam) {
      navigate('/auth');
      return;
    }

    setToken(tokenParam);
    if (inviteParam) {
      setInviteCode(inviteParam);
    }
    handleAuth(tokenParam, inviteParam || undefined);
  }, [searchParams]);

  const handleAuth = async (authToken: string, invite?: string) => {
    try {
      console.log('Starting auth with token:', authToken);
      console.log('Invite code:', invite);
      
      await login(authToken, invite);
      console.log('Login successful, navigating to home');
      navigate('/');
    } catch (error: any) {
      console.error('Auth failed:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        response: error.response
      });
      
      // Если ошибка - требуется инвайт-код
      if (error.message?.includes('инвайт-код') || error.message?.includes('invite code')) {
        setShowInviteForm(true);
        setError('Для регистрации требуется инвайт-код');
      } else {
        setError(error.message || 'Ошибка авторизации');
      }
    }
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!inviteCode.trim()) {
      setError('Введите инвайт-код');
      return;
    }

    await handleAuth(token, inviteCode);
  };

  if (showInviteForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Требуется инвайт-код</h2>
            <p className="text-gray-600 mt-2">Для завершения регистрации введите код приглашения</p>
          </div>

          <form onSubmit={handleInviteSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Инвайт-код
              </label>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="XXXXXXXX"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength={8}
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-1">
                Получите код у администратора или владельца магазина
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Продолжить
            </button>
          </form>

          <div className="mt-6 text-center">
            <a
              href="/auth"
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Вернуться к авторизации
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-xl">Авторизация...</div>
    </div>
  );
}