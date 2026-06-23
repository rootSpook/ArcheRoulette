import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../lib/api';

interface AuthContextType {
  isAuthenticated: boolean;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // The JWT lives in an httpOnly cookie, invisible to JS — so auth state is
  // determined by asking the server, not by reading a token locally.
  useEffect(() => {
    api.get('/auth/me')
      .then(() => setIsAuthenticated(true))
      .catch(() => setIsAuthenticated(false))
      .finally(() => setLoading(false));
  }, []);

  async function login(username: string, password: string) {
    await api.post('/auth/login', { username, password });
    setIsAuthenticated(true);
  }

  async function logout() {
    await api.post('/auth/logout');
    setIsAuthenticated(false);
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
