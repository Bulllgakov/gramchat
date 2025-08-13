
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { AuthPage } from './pages/AuthPage';
import { ShopDashboard } from './components/shop/ShopDashboard';
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



function MainPage() {
  const { user } = useAuth();
  const [shop, setShop] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  
  React.useEffect(() => {
    // Загружаем данные о магазине/боте
    const loadShopData = async () => {
      try {
        const token = localStorage.getItem('authToken');
        // Пробуем загрузить первый бот пользователя
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://api.gramchat.ru'}/bots/my-bots`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const bots = await response.json();
          if (bots.length > 0) {
            // Используем первый бот как "shop" для совместимости
            setShop({
              id: bots[0].id,
              name: bots[0].name || 'Мой бот',
              botUsername: bots[0].username,
              botId: bots[0].id,
              category: bots[0].category || 'Общее'
            });
          }
        }
      } catch (error) {
        console.error('Error loading shop data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (user?.role !== 'ADMIN') {
      loadShopData();
    } else {
      setLoading(false);
    }
  }, [user]);
  
  // Для админов показываем админ панель
  if (user?.role === 'ADMIN') {
    return <AdminPanel />;
  }
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Загрузка...</div>
      </div>
    );
  }
  
  // Если нет магазина, создаем заглушку
  const shopData = shop || {
    name: 'Диалоги',
    botUsername: 'не подключен',
    category: 'Общее',
    botId: null
  };
  
  // Для владельцев и менеджеров показываем страницу диалогов
  return <ShopDashboard shop={shopData} />;
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

 
