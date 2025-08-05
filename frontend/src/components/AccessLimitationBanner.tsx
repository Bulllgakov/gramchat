import React from 'react';

interface User {
  role: string;
  hasFullAccess?: boolean;
}

interface AccessLimitationBannerProps {
  user: User;
  className?: string;
}

export function AccessLimitationBanner({ user, className = '' }: AccessLimitationBannerProps) {
  // Показываем только для владельцев с ограниченным доступом
  if (user.role !== 'OWNER' || user.hasFullAccess) {
    return null;
  }

  return (
    <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-yellow-800">
            Ограниченный доступ
          </h3>
          <div className="mt-2 text-sm text-yellow-700">
            <p>Ваш аккаунт имеет ограниченные права:</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Нельзя отправлять сообщения клиентам</li>
              <li>Нельзя приглашать менеджеров</li>
              <li>Доступ только для просмотра диалогов</li>
            </ul>
            <p className="mt-2 font-medium">
              Для получения полного доступа обратитесь к администратору за инвайт-кодом.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface RestrictedActionTooltipProps {
  user: User;
  children: React.ReactNode;
  action: 'sendMessage' | 'inviteManager';
}

export function RestrictedActionTooltip({ user, children, action }: RestrictedActionTooltipProps) {
  const isRestricted = user.role === 'OWNER' && !user.hasFullAccess;
  
  if (!isRestricted) {
    return <>{children}</>;
  }

  const messages = {
    sendMessage: 'Отправка сообщений недоступна при ограниченном доступе',
    inviteManager: 'Приглашение менеджеров недоступно при ограниченном доступе'
  };

  return (
    <div className="relative group">
      <div className="opacity-50 cursor-not-allowed">
        {children}
      </div>
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
        {messages[action]}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
      </div>
    </div>
  );
}