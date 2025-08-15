
import React, { useEffect, useState, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { AuthPage } from './pages/AuthPage';
import { ShopDashboardStyled } from './components/shop/ShopDashboardStyled';
import { AdminPanel } from './components/admin/AdminPanel';
import { AuthCallbackPage } from './pages/AuthCallbackPage';
import { TestPage } from './pages/TestPage';
import { OwnerPanelPage } from './pages/OwnerPanelPage';
import { LoginPage } from './pages/LoginPage';
import { ChangePasswordPage } from './pages/ChangePasswordPage';
import { CreateBotPage } from './pages/CreateBotPage';
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



function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  
  // Закрываем меню при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const handleLogout = () => {
    logout();
    navigate('/auth');
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Шапка */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-white">GramChat Admin</h1>
            </div>
            
            {/* Профиль */}
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>{user?.firstName}</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg py-2 z-50">
                  <div className="px-4 py-3 border-b">
                    <p className="text-sm font-medium text-gray-900">{user?.firstName} {user?.lastName}</p>
                    <p className="text-sm text-gray-500">@{user?.username || 'Не указан'}</p>
                    <p className="text-xs text-gray-400">ID: {user?.telegramId}</p>
                  </div>
                  
                  <div className="px-4 py-2">
                    <div className="flex items-center justify-between py-1">
                      <span className="text-sm text-gray-600">Роль:</span>
                      <span className="text-sm font-medium text-gray-900">Администратор</span>
                    </div>
                  </div>
                  
                  <div className="border-t pt-2">
                    <button
                      onClick={() => {
                        handleLogout();
                        setShowProfileMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Выйти
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Контент */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Панель администратора</h2>
          <AdminPanel />
        </div>
      </div>
    </div>
  );
}

function MainPage() {
  const { user } = useAuth();
  
  // Для админов показываем админ панель с полной разметкой
  if (user?.role === 'ADMIN') {
    return <AdminDashboard />;
  }
  
  // Для владельцев и менеджеров показываем страницу диалогов
  return <ShopDashboardStyled userRole={user?.role} />;
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

            <MainPage />

          </PrivateRoute>

        } 

      />

      <Route 

        path="/create-bot" 

        element={

          <PrivateRoute>

            <CreateBotPage />

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

 
