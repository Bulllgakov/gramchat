import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

export function AuthPage() {
  const [searchParams] = useSearchParams();
  const [inviteCode, setInviteCode] = useState('');

  useEffect(() => {
    const invite = searchParams.get('invite');
    if (invite) {
      setInviteCode(invite);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white p-10 rounded-2xl shadow-xl max-w-md w-full">
        <div className="text-center mb-8">
          <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">GramChat</h1>
          <p className="text-gray-600">Платформа для управления клиентской поддержкой</p>
        </div>
        
        {inviteCode && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 text-green-800">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">У вас есть инвайт-код!</span>
            </div>
            <p className="text-sm text-green-700 mt-1">
              Код <code className="font-mono bg-green-100 px-2 py-0.5 rounded">{inviteCode}</code> будет применен автоматически
            </p>
          </div>
        )}

        <div className="space-y-6">
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-4">Сканируйте QR-код или нажмите кнопку</p>
            <div className="bg-gray-50 p-4 rounded-xl inline-block">
              <img 
                src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://t.me/gramchatauth_bot" 
                alt="QR Code" 
                className="rounded-lg"
              />
            </div>
          </div>
          
          <a 
            href="https://t.me/gramchatauth_bot" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-6 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all transform hover:scale-105 shadow-lg"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.56c-.21 2.27-1.13 7.75-1.6 10.27-.2 1.07-.59 1.43-.97 1.46-.82.07-1.45-.54-2.24-.97-1.24-.68-1.95-1.1-3.15-1.77-1.4-.78-.49-1.21.3-1.91.21-.18 3.85-3.53 3.91-3.83.01-.04.01-.19-.07-.27-.09-.08-.22-.05-.32-.03-.13.03-2.29 1.46-6.47 4.29-.61.42-1.17.63-1.67.62-.55-.01-1.6-.31-2.39-.56-.96-.31-1.72-.47-1.66-.99.04-.26.42-.53 1.16-.8 4.54-1.97 7.57-3.28 9.08-3.91 4.32-1.82 5.22-2.14 5.81-2.15.13 0 .41.03.59.18.15.12.19.29.21.43.02.14.04.36.02.56z"/>
            </svg>
            <span className="font-medium">Войти через Telegram</span>
          </a>
        </div>
        
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            Нажимая кнопку, вы соглашаетесь с условиями использования
          </p>
        </div>
      </div>
    </div>
  );
}
