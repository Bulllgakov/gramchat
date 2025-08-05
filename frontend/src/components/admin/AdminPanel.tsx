import { useState } from 'react';
import { UsersList } from './UsersList';
import { UsersListSimple } from './UsersListSimple';
import { ShopsList } from './ShopsList';
import { InviteCodesAdmin } from './InviteCodesAdmin';

export function AdminPanel() {
  const [activeTab, setActiveTab] = useState('users');
  const [useSimpleList] = useState(false); // Используем полную версию с таблицей

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="border-b">
        <nav className="flex -mb-px">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === 'users'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Пользователи
          </button>
          <button
            onClick={() => setActiveTab('shops')}
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === 'shops'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Магазины
          </button>
          <button
            onClick={() => setActiveTab('invites')}
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === 'invites'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Инвайт-коды
          </button>
        </nav>
      </div>

      <div className="p-6">
        {activeTab === 'users' && (useSimpleList ? <UsersListSimple /> : <UsersList />)}
        
        {activeTab === 'shops' && <ShopsList />}
        
        {activeTab === 'invites' && <InviteCodesAdmin />}
      </div>
    </div>
  );
}