import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = '/api';

interface UserDetails {
  id: string;
  telegramId: string;
  firstName: string;
  lastName?: string;
  username?: string;
  email?: string;
  role: 'ADMIN' | 'OWNER' | 'MANAGER';
  isActive: boolean;
  hasFullAccess: boolean;
  createdAt: string;
  ownedShop?: {
    id: string;
    name: string;
    botUsername: string;
    category: string;
    isActive: boolean;
    isApproved: boolean;
    createdAt: string;
    _count: {
      dialogs: number;
      managers: number;
    };
  };
  managedShop?: {
    id: string;
    name: string;
    owner: {
      firstName: string;
      lastName?: string;
      username?: string;
    };
  };
  inviteCode?: {
    code: string;
    role: string;
    comment?: string;
    createdAt: string;
    createdBy: {
      firstName: string;
      lastName?: string;
      username?: string;
    };
  };
}

interface UserDetailsModalProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  onAccessGranted: () => void;
}

export function UserDetailsModal({ userId, isOpen, onClose, onAccessGranted }: UserDetailsModalProps) {
  const [user, setUser] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [granting, setGranting] = useState(false);

  useEffect(() => {
    if (isOpen && userId) {
      fetchUserDetails();
    }
  }, [isOpen, userId]);

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${API_URL}/admin/users/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setUser(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка загрузки данных пользователя');
    } finally {
      setLoading(false);
    }
  };

  const grantFullAccess = async () => {
    try {
      setGranting(true);
      const token = localStorage.getItem('authToken');
      await axios.patch(
        `${API_URL}/admin/users/${userId}/grant-access`,
        {},
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      // Обновляем локальные данные
      if (user) {
        setUser({ ...user, hasFullAccess: true });
      }
      
      onAccessGranted();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Ошибка предоставления доступа');
    } finally {
      setGranting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">
            Детальная информация о пользователе
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="mt-4">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-2">Загрузка...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {user && (
            <div className="space-y-6">
              {/* Основная информация */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-md font-semibold text-gray-900 mb-3">Основная информация</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Имя:</span>
                    <p className="text-sm text-gray-900">{user.firstName} {user.lastName}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Username:</span>
                    <p className="text-sm text-gray-900">{user.username ? `@${user.username}` : 'Не указан'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Telegram ID:</span>
                    <p className="text-sm text-gray-900">{user.telegramId}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Email:</span>
                    <p className="text-sm text-gray-900">{user.email || 'Не указан'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Роль:</span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 
                      user.role === 'OWNER' ? 'bg-blue-100 text-blue-800' : 
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {user.role}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Статус:</span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.isActive ? 'Активен' : 'Заблокирован'}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Дата регистрации:</span>
                    <p className="text-sm text-gray-900">
                      {new Date(user.createdAt).toLocaleDateString('ru-RU', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  {user.role === 'OWNER' && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">Доступ:</span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.hasFullAccess ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {user.hasFullAccess ? 'Полный доступ' : 'Ограниченный доступ'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Информация об инвайт-коде */}
              {user.inviteCode && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="text-md font-semibold text-gray-900 mb-3">Инвайт-код</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Код:</span>
                      <p className="text-sm text-gray-900 font-mono">{user.inviteCode.code}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Роль по коду:</span>
                      <p className="text-sm text-gray-900">{user.inviteCode.role}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Создал:</span>
                      <p className="text-sm text-gray-900">
                        {user.inviteCode.createdBy.firstName} {user.inviteCode.createdBy.lastName}
                        {user.inviteCode.createdBy.username && ` (@${user.inviteCode.createdBy.username})`}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Дата создания:</span>
                      <p className="text-sm text-gray-900">
                        {new Date(user.inviteCode.createdAt).toLocaleDateString('ru-RU')}
                      </p>
                    </div>
                    {user.inviteCode.comment && (
                      <div className="col-span-2">
                        <span className="text-sm font-medium text-gray-500">Комментарий:</span>
                        <p className="text-sm text-gray-900">{user.inviteCode.comment}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Информация о магазине */}
              {user.ownedShop && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="text-md font-semibold text-gray-900 mb-3">Собственный магазин</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Название:</span>
                      <p className="text-sm text-gray-900">{user.ownedShop.name}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Бот:</span>
                      <p className="text-sm text-gray-900">@{user.ownedShop.botUsername}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Категория:</span>
                      <p className="text-sm text-gray-900">{user.ownedShop.category}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Статус:</span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.ownedShop.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.ownedShop.isActive ? 'Активен' : 'Неактивен'}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Создан:</span>
                      <p className="text-sm text-gray-900">
                        {new Date(user.ownedShop.createdAt).toLocaleDateString('ru-RU')}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Диалогов:</span>
                      <p className="text-sm text-gray-900">{user.ownedShop._count.dialogs}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Менеджеров:</span>
                      <p className="text-sm text-gray-900">{user.ownedShop._count.managers}</p>
                    </div>
                  </div>
                </div>
              )}

              {user.managedShop && (
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h4 className="text-md font-semibold text-gray-900 mb-3">Управляемый магазин</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Название:</span>
                      <p className="text-sm text-gray-900">{user.managedShop.name}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Владелец:</span>
                      <p className="text-sm text-gray-900">
                        {user.managedShop.owner.firstName} {user.managedShop.owner.lastName}
                        {user.managedShop.owner.username && ` (@${user.managedShop.owner.username})`}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Кнопки действий */}
              {user.role === 'OWNER' && !user.hasFullAccess && (
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3 flex-1">
                      <h3 className="text-sm font-medium text-yellow-800">
                        Владелец ожидает модерации
                      </h3>
                      <p className="mt-2 text-sm text-yellow-700">
                        Пользователь зарегистрировался без инвайт-кода и имеет ограниченный доступ.
                        После проверки вы можете предоставить полный доступ.
                      </p>
                      <div className="mt-4">
                        <button
                          onClick={grantFullAccess}
                          disabled={granting}
                          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                          {granting ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Предоставление доступа...
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Проверка пройдена
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}