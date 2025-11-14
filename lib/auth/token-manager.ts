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

    console.log('🔄 Auto-refresh des tokens démarré');
  }

  /**
   * Arrêter la vérification automatique
   */
  stopAutoRefresh() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
      console.log('⏹️ Auto-refresh des tokens arrêté');
    }
  }

  /**
   * Vérifier et rafraîchir le token si nécessaire
   */
  private async checkAndRefreshToken(onTokenRefreshed?: (newToken: string) => void) {
    try {
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        console.log('⚠️ Pas de token à vérifier');
        return;
      }

      const timeRemaining = this.getTokenTimeRemaining(token);
      
      if (timeRemaining <= 0) {
        console.log('❌ Token expiré, refresh nécessaire');
        await this.refreshToken(onTokenRefreshed);
      } else if (timeRemaining < TOKEN_REFRESH_THRESHOLD) {
        console.log(`⏰ Token expire dans ${Math.floor(timeRemaining / 1000)}s, refresh préventif`);
        await this.refreshToken(onTokenRefreshed);
      } else {
        console.log(`✅ Token valide pour encore ${Math.floor(timeRemaining / 1000)}s`);
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
      console.log('⏳ Refresh déjà en cours...');
      return false;
    }

    this.isRefreshing = true;

    try {
      console.log('🔄 Tentative de refresh du token...');

      const refreshToken = localStorage.getItem('refreshToken');
      
      if (!refreshToken) {
        console.log('❌ Pas de refresh token disponible');
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
        console.log('❌ Échec du refresh:', response.status);
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

        console.log('✅ Token rafraîchi avec succès');

        // Callback optionnel
        if (onTokenRefreshed) {
          onTokenRefreshed(newToken);
        }

        return true;
      } else {
        console.log('❌ Réponse invalide du serveur');
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
    console.log('🚪 Redirection vers la page de login...');
    
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
