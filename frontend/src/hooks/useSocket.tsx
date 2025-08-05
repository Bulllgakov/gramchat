import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { showErrorNotification, showSuccessNotification } from '../utils/errorHandler';

export interface SocketOptions {
  autoConnect?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
}

export function useSocket(url: string, options: SocketOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  
  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;
    
    const token = localStorage.getItem('authToken');
    if (!token) {
      showErrorNotification('Требуется авторизация');
      return;
    }
    
    socketRef.current = io(url, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: options.reconnectionAttempts || 5,
      reconnectionDelay: options.reconnectionDelay || 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000
    });
    
    socketRef.current.on('connect', () => {
      setIsConnected(true);
      setIsReconnecting(false);
      reconnectAttemptsRef.current = 0;
      console.log('Socket connected');
      
      if (reconnectAttemptsRef.current > 0) {
        showSuccessNotification('Соединение восстановлено');
      }
    });
    
    socketRef.current.on('disconnect', (reason) => {
      setIsConnected(false);
      console.log('Socket disconnected:', reason);
      
      if (reason === 'io server disconnect') {
        // Сервер принудительно отключил клиента
        showErrorNotification('Соединение разорвано сервером');
      }
    });
    
    socketRef.current.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      
      if (error.message === 'Unauthorized') {
        showErrorNotification('Ошибка авторизации. Пожалуйста, войдите снова');
        localStorage.removeItem('authToken');
        window.location.href = '/login';
      }
    });
    
    socketRef.current.on('reconnect_attempt', (attemptNumber) => {
      setIsReconnecting(true);
      reconnectAttemptsRef.current = attemptNumber;
      console.log(`Reconnection attempt ${attemptNumber}`);
    });
    
    socketRef.current.on('reconnect_failed', () => {
      setIsReconnecting(false);
      showErrorNotification('Не удалось восстановить соединение. Проверьте интернет-соединение');
    });
    
    return socketRef.current;
  }, [url, options]);
  
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  }, []);
  
  const emit = useCallback((event: string, data?: any) => {
    if (!socketRef.current?.connected) {
      console.error('Socket not connected');
      showErrorNotification('Соединение потеряно. Переподключение...');
      connect();
      return;
    }
    
    socketRef.current.emit(event, data);
  }, [connect]);
  
  const on = useCallback((event: string, handler: (...args: any[]) => void) => {
    if (!socketRef.current) {
      console.error('Socket not initialized');
      return;
    }
    
    socketRef.current.on(event, handler);
    
    // Return cleanup function
    return () => {
      socketRef.current?.off(event, handler);
    };
  }, []);
  
  useEffect(() => {
    if (options.autoConnect !== false) {
      connect();
    }
    
    return () => {
      disconnect();
    };
  }, []);
  
  return {
    socket: socketRef.current,
    isConnected,
    isReconnecting,
    connect,
    disconnect,
    emit,
    on
  };
}