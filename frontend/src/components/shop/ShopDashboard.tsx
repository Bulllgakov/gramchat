import { useState } from 'react';
import { DialogsList } from '../chat/DialogsList';
import { ChatWindow } from '../chat/ChatWindow';
import { Dialog } from '../chat/types';

interface ShopDashboardProps {
  shop: any;
}

export function ShopDashboard({ shop }: ShopDashboardProps) {
  const [selectedDialog, setSelectedDialog] = useState<Dialog | null>(null);

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Управление магазином: {shop.name}</h2>
        <p className="text-sm text-gray-500 mt-1">
          Бот: @{shop.botUsername} | Категория: {shop.category}
        </p>
      </div>

      <div className="flex h-[600px]">
        {/* Список диалогов */}
        <div className="w-1/3 border-r">
          <DialogsList 
            onSelectDialog={setSelectedDialog}
            selectedDialogId={selectedDialog?.id}
          />
        </div>

        {/* Окно чата */}
        <div className="flex-1">
          <ChatWindow 
            dialog={selectedDialog}
            onClose={() => setSelectedDialog(null)}
          />
        </div>
      </div>
    </div>
  );
}