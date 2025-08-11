
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { AuthCallbackPage } from './pages/AuthCallbackPage';
import { TestPage } from './pages/TestPage';
import { OwnerPanelPage } from './pages/OwnerPanelPage';
import { LoginPage } from './pages/LoginPage';
import { ChangePasswordPage } from './pages/ChangePasswordPage';
// import { csrfService } from './services/csrf.service';
import { ErrorBoundary } from './components/ErrorBoundary';
import { setupGlobalErrorHandlers } from './utils/errorHandler';

console.log('API URL:', 'https://api.gramchat.ru');
function PrivateRoute({ children }: { children: React.ReactElement }) {

  const { isAuthenticated, isLoading } = useAuth();



  if (isLoading) {

    return (

      <div className="min-h-screen flex items-center justify-center">

        <div className="text-xl">Загрузка...</div>

      </div>

    );

  }



  return isAuthenticated ? children : <Navigate to="/login" />;

}



function AppRoutes() {

  const { isAuthenticated } = useAuth();

  // useEffect(() => {
  //   // Инициализируем CSRF токен при авторизации
  //   if (isAuthenticated) {
  //     csrfService.getToken().catch(console.error);
  //   } else {
  //     csrfService.clearToken();
  //   }
  // }, [isAuthenticated]);



  return (

    <Routes>

      <Route 

        path="/auth" 

        element={!isAuthenticated ? <AuthCallbackPage /> : <Navigate to="/" />} 

      />

      <Route 

        path="/login" 

        element={!isAuthenticated ? <LoginPage /> : <Navigate to="/" />} 

      />

      <Route 

        path="/change-password" 

        element={isAuthenticated ? <ChangePasswordPage /> : <Navigate to="/login" />} 

      />

      <Route 

        path="/" 

        element={

          <PrivateRoute>

            <DashboardPage />

          </PrivateRoute>

        } 

      />

      <Route 

        path="/test" 

        element={<TestPage />} 

      />

      <Route 

        path="/owner-panel" 

        element={

          <PrivateRoute>

            <OwnerPanelPage />

          </PrivateRoute>

        } 

      />

    </Routes>

  );

}



function App() {

  useEffect(() => {
    // Настраиваем глобальные обработчики ошибок
    setupGlobalErrorHandlers();
  }, []);

  return (

    <ErrorBoundary>

      <Router>

        <AuthProvider>

          <AppRoutes />

        </AuthProvider>

      </Router>

    </ErrorBoundary>

  );

}



export default App;

 
