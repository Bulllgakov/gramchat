import { useState, useCallback } from 'react';
import { showErrorNotification, showSuccessNotification } from '../utils/errorHandler';

export interface ErrorRecoveryOptions {
  onSuccess?: () => void;
  onError?: (error: any) => void;
  showNotifications?: boolean;
}

export function useErrorRecovery(options: ErrorRecoveryOptions = {}) {
  const [isRecovering, setIsRecovering] = useState(false);
  const [lastError, setLastError] = useState<Error | null>(null);
  
  const recover = useCallback(async (
    recoveryAction: () => Promise<void>
  ) => {
    if (isRecovering) return;
    
    setIsRecovering(true);
    
    try {
      await recoveryAction();
      setLastError(null);
      
      if (options.showNotifications !== false) {
        showSuccessNotification('Операция выполнена успешно');
      }
      
      options.onSuccess?.();
    } catch (error) {
      setLastError(error as Error);
      
      if (options.showNotifications !== false) {
        showErrorNotification(
          `Ошибка восстановления: ${(error as Error).message || 'Неизвестная ошибка'}`
        );
      }
      
      options.onError?.(error);
    } finally {
      setIsRecovering(false);
    }
  }, [isRecovering, options]);
  
  const retry = useCallback(async () => {
    if (!lastError) return;
    
    // Попытаемся перезагрузить страницу как последнее средство
    if (window.confirm('Произошла ошибка. Перезагрузить страницу?')) {
      window.location.reload();
    }
  }, [lastError]);
  
  return {
    isRecovering,
    lastError,
    recover,
    retry
  };
}