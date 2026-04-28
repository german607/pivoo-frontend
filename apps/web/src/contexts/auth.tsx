'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthTokens, UserRole } from '@pivoo/shared';

interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  complexId?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  tokens: AuthTokens | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginComplex: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, role: UserRole) => Promise<void>;
  registerComplex: (email: string, password: string, complexId: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('tokens');
    if (stored) {
      setTokens(JSON.parse(stored));
      const storedUser = localStorage.getItem('user');
      if (storedUser) setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.message || 'Login failed');
    }
    const data = await res.json();
    const authUser: AuthUser = { id: data.userId, email, role: data.role ?? UserRole.PLAYER };
    setTokens(data);
    setUser(authUser);
    localStorage.setItem('tokens', JSON.stringify(data));
    localStorage.setItem('user', JSON.stringify(authUser));
  };

  const loginComplex = async (email: string, password: string) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/complex/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.message || 'Login failed');
    }
    const data = await res.json();
    // Decode JWT payload to get complexId and role
    const payload = JSON.parse(atob(data.accessToken.split('.')[1]));
    const authUser: AuthUser = {
      id: payload.sub,
      email: payload.email,
      role: UserRole.COMPLEX,
      complexId: payload.complexId,
    };
    setTokens(data);
    setUser(authUser);
    localStorage.setItem('tokens', JSON.stringify(data));
    localStorage.setItem('user', JSON.stringify(authUser));
  };

  const register = async (email: string, password: string, role: UserRole) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.message || 'Registration failed');
    }
    const data = await res.json();
    const authUser: AuthUser = { id: data.userId, email, role: data.role ?? role };
    setTokens(data);
    setUser(authUser);
    localStorage.setItem('tokens', JSON.stringify(data));
    localStorage.setItem('user', JSON.stringify(authUser));
  };

  const registerComplex = async (email: string, password: string, complexId: string) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/complex/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, complexId }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.message || 'Registration failed');
    }
    const data = await res.json();
    const payload = JSON.parse(atob(data.accessToken.split('.')[1]));
    const authUser: AuthUser = {
      id: payload.sub,
      email: payload.email,
      role: UserRole.COMPLEX,
      complexId: payload.complexId,
    };
    setTokens(data);
    setUser(authUser);
    localStorage.setItem('tokens', JSON.stringify(data));
    localStorage.setItem('user', JSON.stringify(authUser));
  };

  const logout = () => {
    setTokens(null);
    setUser(null);
    localStorage.removeItem('tokens');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, tokens, isLoading, login, loginComplex, register, registerComplex, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
