import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Обновляем состояние, чтобы следующий рендер показал fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Логируем ошибку в консоль
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Обновляем состояние с подробной информацией об ошибке
    this.setState({
      error,
      errorInfo
    });

    // Здесь можно также отправить ошибку в сервис логирования
    // logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      // Кастомный fallback UI если предоставлен
      if (this.props.fallback) {
        return <>{this.props.fallback}</>;
      }

      // Дефолтный fallback UI
      return (
        <div style={{
          padding: '20px',
          margin: '20px',
          backgroundColor: '#f8f8f8',
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          maxWidth: '600px',
          marginLeft: 'auto',
          marginRight: 'auto'
        }}>
          <h2 style={{ color: '#d32f2f', marginBottom: '16px' }}>
            🚨 Что-то пошло не так
          </h2>
          
          <p style={{ marginBottom: '16px', color: '#666' }}>
            Произошла непредвиденная ошибка. Пожалуйста, попробуйте обновить страницу.
          </p>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <button
              onClick={this.handleReset}
              style={{
                padding: '10px 20px',
                backgroundColor: '#1976d2',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Попробовать снова
            </button>
            
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '10px 20px',
                backgroundColor: '#757575',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Обновить страницу
            </button>
          </div>

          {/* Детали ошибки для разработки */}
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details style={{ marginTop: '20px' }}>
              <summary style={{ cursor: 'pointer', color: '#666' }}>
                Подробности ошибки (только для разработчиков)
              </summary>
              <div style={{
                marginTop: '10px',
                padding: '10px',
                backgroundColor: '#fff',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '12px',
                fontFamily: 'monospace',
                overflow: 'auto'
              }}>
                <strong>Error:</strong> {this.state.error.toString()}
                <br /><br />
                <strong>Stack:</strong>
                <pre style={{ margin: 0 }}>{this.state.error.stack}</pre>
                {this.state.errorInfo && (
                  <>
                    <br />
                    <strong>Component Stack:</strong>
                    <pre style={{ margin: 0 }}>{this.state.errorInfo.componentStack}</pre>
                  </>
                )}
              </div>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}