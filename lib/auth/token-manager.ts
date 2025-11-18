/**
 * Token Manager - Gestion automatique des tokens JWT
 * Gère le refresh automatique des access tokens
 */

const TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes avant expiration
const TOKEN_CHECK_INTERVAL = 60 * 1000; // Vérifier toutes les minutes

export class TokenManager {
  private static instance: TokenManager;
  private refreshTimer: NodeJS.Timeout | null = null;
  private isRefreshing = false;

  private constructor() {}

  static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }

  /**
   * Démarrer la vérification automatique des tokens
   */
  startAutoRefresh(onTokenRefreshed?: (newToken: string) => void) {
    // Arrêter le timer existant s'il y en a un
    this.stopAutoRefresh();

    // Vérifier immédiatement
    this.checkAndRefreshToken(onTokenRefreshed);

    // Puis vérifier périodiquement
    this.refreshTimer = setInterval(() => {
      this.checkAndRefreshToken(onTokenRefreshed);
    }, TOKEN_CHECK_INTERVAL);
  }

  /**
   * Arrêter la vérification automatique
   */
  stopAutoRefresh() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  /**
   * Vérifier et rafraîchir le token si nécessaire
   */
  private async checkAndRefreshToken(onTokenRefreshed?: (newToken: string) => void) {
    try {
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        return;
      }

      const timeRemaining = this.getTokenTimeRemaining(token);
      
      if (timeRemaining <= 0) {
        await this.refreshToken(onTokenRefreshed);
      } else if (timeRemaining < TOKEN_REFRESH_THRESHOLD) {
        await this.refreshToken(onTokenRefreshed);
      }
    } catch (error) {
      console.error('❌ Erreur lors de la vérification du token:', error);
    }
  }

  /**
   * Rafraîchir le token
   */
  async refreshToken(onTokenRefreshed?: (newToken: string) => void): Promise<boolean> {
    // Éviter les refresh multiples simultanés
    if (this.isRefreshing) {
      return false;
    }

    this.isRefreshing = true;

    try {
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (!refreshToken) {
        this.handleRefreshFailure();
        return false;
      }

      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        this.handleRefreshFailure();
        return false;
      }

      const data = await response.json();

      if (data.success && data.data?.accessToken) {
        const newToken = data.data.accessToken;
        
        // Stocker le nouveau token
        localStorage.setItem('accessToken', newToken);
        
        // Mettre à jour le cookie
        document.cookie = `auth-token=${newToken}; path=/; max-age=${15 * 60}`;

        // Callback optionnel
        if (onTokenRefreshed) {
          onTokenRefreshed(newToken);
        }

        return true;
      } else {
        this.handleRefreshFailure();
        return false;
      }
    } catch (error) {
      console.error('❌ Erreur lors du refresh:', error);
      this.handleRefreshFailure();
      return false;
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * Gérer l'échec du refresh
   */
  private handleRefreshFailure() {
    // Nettoyer le localStorage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');

    // Arrêter l'auto-refresh
    this.stopAutoRefresh();

    // Rediriger vers la page de login
    window.location.href = '/backoffice/login';
  }

  /**
   * Obtenir le temps restant avant expiration (en millisecondes)
   */
  private getTokenTimeRemaining(token: string): number {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      
      if (!payload.exp) {
        return 0;
      }

      const expirationTime = payload.exp * 1000; // Convertir en millisecondes
      const currentTime = Date.now();
      
      return Math.max(0, expirationTime - currentTime);
    } catch (error) {
      console.error('Erreur lors du décodage du token:', error);
      return 0;
    }
  }

  /**
   * Vérifier si le token est expiré
   */
  isTokenExpired(token: string): boolean {
    return this.getTokenTimeRemaining(token) <= 0;
  }

  /**
   * Obtenir les informations du token
   */
  getTokenInfo(token: string): { exp: number; timeRemaining: number } | null {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const timeRemaining = this.getTokenTimeRemaining(token);
      
      return {
        exp: payload.exp,
        timeRemaining,
      };
    } catch (error) {
      return null;
    }
  }
}

// Export singleton instance
export const tokenManager = TokenManager.getInstance();
