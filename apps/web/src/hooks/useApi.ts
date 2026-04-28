import { useAuth } from '@/contexts/auth';
import { useRouter } from '@/navigation';

export function useApi() {
  const { tokens, logout } = useAuth();
  const router = useRouter();

  const request = async <T,>(path: string, options?: RequestInit & { baseUrl?: string }): Promise<T> => {
    const base = options?.baseUrl ?? process.env.NEXT_PUBLIC_API_URL;
    const { baseUrl: _, ...fetchOptions } = options ?? {};
    const res = await fetch(`${base}${path}`, {
      ...fetchOptions,
      headers: {
        'Content-Type': 'application/json',
        ...(tokens ? { Authorization: `Bearer ${tokens.accessToken}` } : {}),
        ...fetchOptions?.headers,
      },
    });

    if (res.status === 401) {
      logout();
      router.push('/login');
      throw new Error('Session expired');
    }

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || 'Request failed');
    }

    if (res.status === 204) return undefined as T;
    return res.json();
  };

  return {
    get: <T,>(path: string, opts?: { baseUrl?: string }) =>
      request<T>(path, { method: 'GET', ...opts }),
    post: <T,>(path: string, body?: unknown, opts?: { baseUrl?: string }) =>
      request<T>(path, { method: 'POST', body: JSON.stringify(body), ...opts }),
    patch: <T,>(path: string, body?: unknown, opts?: { baseUrl?: string }) =>
      request<T>(path, { method: 'PATCH', body: JSON.stringify(body), ...opts }),
    put: <T,>(path: string, body?: unknown, opts?: { baseUrl?: string }) =>
      request<T>(path, { method: 'PUT', body: JSON.stringify(body), ...opts }),
    delete: <T,>(path: string, opts?: { baseUrl?: string }) =>
      request<T>(path, { method: 'DELETE', ...opts }),
  };
}
