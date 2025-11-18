/**
 * API Client avec gestion automatique du refresh token
 */

interface TokenData {
  accessToken: string;
  refreshToken: string;
}

class ApiClient {
  private baseURL: string;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private isRefreshing = false;
  private refreshSubscribers: ((token: string) => void)[] = [];

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    // Charger les tokens depuis localStorage au démarrage
    if (typeof window !== 'undefined') {
      this.loadTokens();
    }
  }

  /**
   * Charger les tokens depuis localStorage
   */
  private loadTokens() {
    try {
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (accessToken) this.accessToken = accessToken;
      if (refreshToken) this.refreshToken = refreshToken;
    } catch (error) {
      console.error('Error loading tokens:', error);
    }
  }

  /**
   * Sauvegarder les tokens dans localStorage
   */
  private saveTokens(tokens: TokenData) {
    try {
      this.accessToken = tokens.accessToken;
      this.refreshToken = tokens.refreshToken;
      
      localStorage.setItem('accessToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
    } catch (error) {
      console.error('Error saving tokens:', error);
    }
  }

  /**
   * Supprimer les tokens
   */
  public clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  }

  /**
   * Définir les tokens (après login)
   */
  public setTokens(tokens: TokenData) {
    this.saveTokens(tokens);
  }

  /**
   * Obtenir l'access token actuel
   */
  public getAccessToken(): string | null {
    return this.accessToken;
  }

  /**
   * Ajouter un subscriber pour le refresh
   */
  private subscribeTokenRefresh(callback: (token: string) => void) {
    this.refreshSubscribers.push(callback);
  }

  /**
   * Notifier tous les subscribers
   */
  private onTokenRefreshed(token: string) {
    this.refreshSubscribers.forEach(callback => callback(token));
    this.refreshSubscribers = [];
  }

  /**
   * Rafraîchir le token
   */
  private async refreshAccessToken(): Promise<string> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch(`${this.baseURL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const data = await response.json();
      
      if (data.success && data.data.tokens) {
        this.saveTokens(data.data.tokens);
        return data.data.tokens.accessToken;
      }

      throw new Error('Invalid refresh response');
    } catch (error) {
      // Si le refresh échoue, déconnecter l'utilisateur
      this.clearTokens();
      
      // Rediriger vers la page de login
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      
      throw error;
    }
  }

  /**
   * Faire une requête avec gestion automatique du refresh
   */
  public async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`;
    
    // Ajouter le token d'authentification
    const headers = new Headers(options.headers);
    headers.set('Content-Type', 'application/json');

    if (this.accessToken) {
      headers.set('Authorization', `Bearer ${this.accessToken}`);
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Si 401, essayer de rafraîchir le token
      if (response.status === 401 && this.refreshToken) {
        // Si un refresh est déjà en cours, attendre
        if (this.isRefreshing) {
          return new Promise((resolve, reject) => {
            this.subscribeTokenRefresh(async (token: string) => {
              try {
                // Réessayer la requête avec le nouveau token
                headers.set('Authorization', `Bearer ${token}`);
                const retryResponse = await fetch(url, { ...options, headers });
                const data = await retryResponse.json();
                resolve(data);
              } catch (error) {
                reject(error);
              }
            });
          });
        }

        // Démarrer le refresh
        this.isRefreshing = true;

        try {
          const newToken = await this.refreshAccessToken();
          this.isRefreshing = false;
          this.onTokenRefreshed(newToken);

          // Réessayer la requête avec le nouveau token
          headers.set('Authorization', `Bearer ${newToken}`);
          const retryResponse = await fetch(url, { ...options, headers });
          return await retryResponse.json();
        } catch (refreshError) {
          this.isRefreshing = false;
          throw refreshError;
        }
      }

      // Gérer les autres erreurs
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        // Create a more structured error
        const error = new Error(errorData.error?.message || `HTTP ${response.status}`);
        (error as any).status = response.status;
        (error as any).code = errorData.error?.code;
        (error as any).details = errorData.error;

        throw error;
      }

      return await response.json();
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }

  /**
   * Méthodes raccourcies
   */
  public async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  public async post<T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  public async put<T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  public async patch<T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  public async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

// Instance singleton
export const apiClient = new ApiClient();

export default apiClient;
