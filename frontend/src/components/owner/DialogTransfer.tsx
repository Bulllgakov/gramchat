import { useState, useEffect } from 'react';
import { getApiUrl } from '../../config/api.config';
import { Dialog } from '../chat/types';

const API_URL = getApiUrl();

interface Manager {
  id: string;
  firstName: string;
  lastName?: string;
  username?: string;
}

interface DialogTransferProps {
  dialog: Dialog;
  onTransfer: () => void;
  onClose: () => void;
}

export function DialogTransfer({ dialog, onTransfer, onClose }: DialogTransferProps) {
  const [managers, setManagers] = useState<Manager[]>([]);
  const [selectedManagerId, setSelectedManagerId] = useState('');
  const [loading, setLoading] = useState(true);
  const [transferring, setTransferring] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchManagers();
  }, []);

  const fetchManagers = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/users?role=MANAGER`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Не удалось загрузить менеджеров');
      }

      const data = await response.json();
      // Фильтруем только активных менеджеров, исключая текущего
      const activeManagers = data.users.filter((m: Manager) => 
        m.id !== dialog.assignedToId
      );
      setManagers(activeManagers);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async () => {
    if (!selectedManagerId) {
      alert('Выберите менеджера');
      return;
    }

    setTransferring(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/dialogs/${dialog.id}/transfer`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ managerId: selectedManagerId })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Не удалось передать диалог');
      }

      onTransfer();
      onClose();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setTransferring(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h3 className="text-lg font-semibold mb-4">Передача диалога</h3>
        
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">
            Клиент: <strong>{dialog.customerName}</strong>
          </p>
          {dialog.assignedTo && (
            <p className="text-sm text-gray-600">
              Текущий менеджер: <strong>{dialog.assignedTo.firstName} {dialog.assignedTo.lastName || ''}</strong>
            </p>
          )}
        </div>

        {loading ? (
          <div className="text-center py-4">Загрузка менеджеров...</div>
        ) : error ? (
          <div className="text-red-500 text-center py-4">{error}</div>
        ) : managers.length === 0 ? (
          <div className="text-gray-500 text-center py-4">Нет доступных менеджеров</div>
        ) : (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Выберите менеджера:
            </label>
            <select
              value={selectedManagerId}
              onChange={(e) => setSelectedManagerId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">-- Выберите менеджера --</option>
              {managers.map(manager => (
                <option key={manager.id} value={manager.id}>
                  {manager.firstName} {manager.lastName || ''} 
                  {manager.username && ` (@${manager.username})`}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
          >
            Отмена
          </button>
          <button
            onClick={handleTransfer}
            disabled={!selectedManagerId || transferring}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {transferring ? 'Передача...' : 'Передать'}
          </button>
        </div>
      </div>
    </div>
  );
}