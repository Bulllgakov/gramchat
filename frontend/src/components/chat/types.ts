export interface Dialog {
  id: string;
  telegramChatId: string;
  customerName: string;
  customerUsername?: string;
  customerPhotoUrl?: string;
  status: 'NEW' | 'ACTIVE' | 'CLOSED';
  shopId: string;
  lastMessageAt: string;
  createdAt: string;
  messages?: Message[];
  assignedToId?: string;
  assignedTo?: {
    id: string;
    firstName: string;
    lastName?: string;
    username?: string;
  };
  assignedAt?: string;
  closeReason?: 'DEAL' | 'CANCELLED';
  closedAt?: string;
}

export interface Message {
  id: string;
  dialogId: string;
  text: string;
  fromUser: boolean;
  messageType: 'TEXT' | 'PHOTO' | 'VIDEO' | 'DOCUMENT' | 'VOICE' | 'STICKER' | 'LOCATION';
  telegramId?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  thumbnailUrl?: string;
  createdAt: string;
}