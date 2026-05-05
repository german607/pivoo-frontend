import { useAuth } from '@/contexts/auth';
import { useRouter } from '@/navigation';

export function useApi() {
  const { tokens, logout, refreshTokens } = useAuth();
  const router = useRouter();

  const doFetch = (path: string, accessToken: string | undefined, options?: RequestInit & { baseUrl?: string }) => {
    const base = options?.baseUrl ?? process.env.NEXT_PUBLIC_API_URL;
    const { baseUrl: _, ...fetchOptions } = options ?? {};
    return fetch(`${base}${path}`, {
      ...fetchOptions,
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...fetchOptions?.headers,
      },
    });
  };

  const request = async <T,>(path: string, options?: RequestInit & { baseUrl?: string }): Promise<T> => {
    let res = await doFetch(path, tokens?.accessToken, options);

    if (res.status === 401) {
      try {
        const newTokens = await refreshTokens();
        res = await doFetch(path, newTokens.accessToken, options);
      } catch {
        logout();
        router.push('/login');
        throw new Error('Session expired');
      }
    }

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
