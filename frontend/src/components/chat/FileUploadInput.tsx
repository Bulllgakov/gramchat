import React, { useRef, useState } from 'react';
import { MessageInput } from '@chatscope/chat-ui-kit-react';
import axios from 'axios';

interface FileUploadInputProps {
  dialogId: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onFileUpload?: (file: any) => void;
  disabled?: boolean;
}

export function FileUploadInput({
  dialogId,
  placeholder = "Введите сообщение...",
  value,
  onChange,
  onSend,
  onFileUpload,
  disabled
}: FileUploadInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Проверка размера (50MB)
    if (file.size > 50 * 1024 * 1024) {
      alert('Файл слишком большой. Максимальный размер: 50MB');
      return;
    }

    // Проверка типа файла
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/mpeg', 'video/quicktime',
      'audio/mpeg', 'audio/wav', 'audio/ogg',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (!allowedTypes.includes(file.type)) {
      alert('Неподдерживаемый тип файла');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (value.trim()) {
        formData.append('caption', value.trim());
      }

      const token = localStorage.getItem('authToken');
      const response = await axios.post(`/api/upload/dialog/${dialogId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });

      // Очищаем поле ввода после успешной отправки
      onChange('');
      
      // Вызываем callback если он предоставлен
      if (onFileUpload) {
        onFileUpload(response.data);
      }

      // Сбрасываем input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      alert(error.response?.data?.message || 'Ошибка загрузки файла');
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <MessageInput 
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onSend={onSend}
        disabled={disabled || uploading}
        attachButton={true}
        onAttachClick={() => fileInputRef.current?.click()}
        sendButton={true}
        sendOnReturnDisabled={false}
      />
      
      {/* Скрытый input для выбора файла */}
      <input
        ref={fileInputRef}
        type="file"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx"
      />
    </>
  );
}