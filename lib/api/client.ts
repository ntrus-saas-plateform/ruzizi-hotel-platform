/**
 * API Client with automatic authentication
 */

interface FetchOptions extends RequestInit {
    skipAuth?: boolean;
}

/**
 * Authenticated fetch wrapper
 * Automatically adds authentication token to requests
 */
export async function fetchWithAuth(url: string, options: FetchOptions = {}): Promise<Response> {
    const { skipAuth = false, headers = {}, ...restOptions } = options;

    // Get token from localStorage or cookies
    let token: string | null = null;

    if (typeof window !== 'undefined' && !skipAuth) {
        // Try localStorage first
        token = localStorage.getItem('accessToken');

        // If not in localStorage, try cookies
        if (!token) {
            const cookies = document.cookie.split(';');
            const authCookie = cookies.find(c => c.trim().startsWith('auth-token='));
            if (authCookie) {
                token = authCookie.split('=')[1];
            }
        }
    }

    // Build headers
    const authHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    // Merge existing headers
    if (headers) {
        if (headers instanceof Headers) {
            headers.forEach((value, key) => {
                authHeaders[key] = value;
            });
        } else if (typeof headers === 'object' && !Array.isArray(headers)) {
            Object.entries(headers).forEach(([key, value]) => {
                if (typeof value === 'string') {
                    authHeaders[key] = value;
                }
            });
        }
    }

    // Add authorization header if token exists
    if (token && !skipAuth) {
        authHeaders['Authorization'] = `Bearer ${token}`;
    }

    // Make the request
    const response = await fetch(url, {
        ...restOptions,
        headers: authHeaders,
    });

    // Handle 401 Unauthorized - token might be expired
    if (response.status === 401 && !skipAuth) {
        console.warn('⚠️ 401 Unauthorized - Token might be expired');

        // Try to refresh token
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
            try {
                const refreshResponse = await fetch('/api/auth/refresh', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refreshToken }),
                });

                if (refreshResponse.ok) {
                    const data = await refreshResponse.json();

                    // Store new tokens
                    localStorage.setItem('accessToken', data.data.accessToken);
                    localStorage.setItem('refreshToken', data.data.refreshToken);
                    document.cookie = `auth-token=${data.data.accessToken}; path=/; max-age=${15 * 60}`;

                    // Retry original request with new token
                    authHeaders['Authorization'] = `Bearer ${data.data.accessToken}`;
                    return fetch(url, {
                        ...restOptions,
                        headers: authHeaders,
                    });
                }
            } catch (error) {
                console.error('Failed to refresh token:', error);
            }
        }

        // If refresh failed, redirect to login
        if (typeof window !== 'undefined') {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            window.location.href = '/backoffice/login';
        }
    }

    return response;
}

/**
 * GET request with authentication
 */
export async function apiGet<T = any>(url: string, options?: FetchOptions): Promise<T> {
    const response = await fetchWithAuth(url, { ...options, method: 'GET' });
    return response.json();
}

/**
 * POST request with authentication
 */
export async function apiPost<T = any>(url: string, data?: any, options?: FetchOptions): Promise<T> {
    const response = await fetchWithAuth(url, {
        ...options,
        method: 'POST',
        body: data ? JSON.stringify(data) : undefined,
    });
    return response.json();
}

/**
 * PUT request with authentication
 */
export async function apiPut<T = any>(url: string, data?: any, options?: FetchOptions): Promise<T> {
    const response = await fetchWithAuth(url, {
        ...options,
        method: 'PUT',
        body: data ? JSON.stringify(data) : undefined,
    });
    return response.json();
}

/**
 * PATCH request with authentication
 */
export async function apiPatch<T = any>(url: string, data?: any, options?: FetchOptions): Promise<T> {
    const response = await fetchWithAuth(url, {
        ...options,
        method: 'PATCH',
        body: data ? JSON.stringify(data) : undefined,
    });
    return response.json();
}

/**
 * DELETE request with authentication
 */
export async function apiDelete<T = any>(url: string, options?: FetchOptions): Promise<T> {
    const response = await fetchWithAuth(url, { ...options, method: 'DELETE' });
    return response.json();
}
