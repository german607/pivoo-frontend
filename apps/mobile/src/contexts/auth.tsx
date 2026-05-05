import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { AuthTokens, UserRole } from '@pivoo/shared';

interface AuthUser {
  id: string;
  email: string;
  role?: UserRole;
  complexId?: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  tokens: AuthTokens | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const storedTokens = await SecureStore.getItemAsync('tokens');
        const storedUser = await SecureStore.getItemAsync('user');
        if (storedTokens && storedUser) {
          const parsed = JSON.parse(storedTokens);
          const payload = JSON.parse(atob(parsed.accessToken.split('.')[1]));
          if (payload.exp && payload.exp * 1000 > Date.now()) {
            setTokens(parsed);
            setUser(JSON.parse(storedUser));
          } else {
            await SecureStore.deleteItemAsync('tokens');
            await SecureStore.deleteItemAsync('user');
          }
        }
      } catch {
        // ignore malformed stored data
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.message || `Error ${res.status}`);
    }
    const data = await res.json();
    const authUser: AuthUser = { id: data.userId, email, role: data.role ?? UserRole.PLAYER, complexId: data.complexId ?? null };
    setTokens(data);
    setUser(authUser);
    await SecureStore.setItemAsync('tokens', JSON.stringify(data));
    await SecureStore.setItemAsync('user', JSON.stringify(authUser));
  };

  const register = async (email: string, password: string) => {
    const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error('Error al registrarse');
    const data = await res.json();
    const authUser: AuthUser = { id: data.userId, email, role: data.role ?? UserRole.PLAYER, complexId: data.complexId ?? null };
    setTokens(data);
    setUser(authUser);
    await SecureStore.setItemAsync('tokens', JSON.stringify(data));
    await SecureStore.setItemAsync('user', JSON.stringify(authUser));
  };

  const logout = async () => {
    setTokens(null);
    setUser(null);
    await SecureStore.deleteItemAsync('tokens');
    await SecureStore.deleteItemAsync('user');
  };

  return (
    <AuthContext.Provider value={{ user, tokens, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
