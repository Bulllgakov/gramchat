
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';

import { authService } from '../services/auth.service';



interface User {

  id: string;

  telegramId: string;

  firstName: string;

  lastName?: string;

  username?: string;

  role: string;

  hasFullAccess?: boolean;

  shop?: any;

}



interface AuthContextType {

  isAuthenticated: boolean;

  isLoading: boolean;

  user: User | null;

  login: (token: string, inviteCode?: string) => Promise<void>;

  logout: () => void;

}



const AuthContext = createContext<AuthContextType | undefined>(undefined);



export function AuthProvider({ children }: { children: ReactNode }) {

  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [isLoading, setIsLoading] = useState(true);

  const [user, setUser] = useState<User | null>(null);



  useEffect(() => {

    checkAuth();

  }, []);



  const checkAuth = async () => {

    try {

      if (authService.isAuthenticated()) {

        const userData = await authService.getCurrentUser();

        if (userData) {

          setUser(userData);

          setIsAuthenticated(true);

        }

      }

    } catch (error) {

      console.error('Auth check failed:', error);

    } finally {

      setIsLoading(false);

    }

  };



  const login = async (token: string, inviteCode?: string) => {

    const data = await authService.validateToken(token, inviteCode);

    setUser(data.user);

    setIsAuthenticated(true);

  };



  const logout = () => {

    authService.logout();

    setIsAuthenticated(false);

    setUser(null);

  };



  return (

    <AuthContext.Provider value={{ isAuthenticated, isLoading, user, login, logout }}>

      {children}

    </AuthContext.Provider>

  );

}



export function useAuth() {

  const context = useContext(AuthContext);

  if (context === undefined) {

    throw new Error('useAuth must be used within an AuthProvider');

  }

  return context;

}

