import React from 'react';
import { ErrorBoundary } from './ErrorBoundary';

interface Props {
  children: React.ReactNode;
  onError?: () => void;
}

export function ChatErrorBoundary({ children, onError }: Props) {
  return (
    <ErrorBoundary
      fallback={
        <div style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '20px'
          }}>
            💬❌
          </div>
          
          <h3 style={{
            fontSize: '20px',
            fontWeight: 'bold',
            marginBottom: '10px',
            color: '#333'
          }}>
            Ошибка загрузки чата
          </h3>
          
          <p style={{
            color: '#666',
            marginBottom: '20px',
            maxWidth: '400px'
          }}>
            Не удалось загрузить сообщения. Проверьте подключение к интернету и попробуйте снова.
          </p>
          
          <button
            onClick={() => {
              onError?.();
              window.location.reload();
            }}
            style={{
              padding: '10px 24px',
              backgroundColor: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Перезагрузить чат
          </button>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}