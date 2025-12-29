'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { EstablishmentResponse } from '@/types/establishment.types';
import { unifiedTokenManager } from '@/lib/auth/unified-token-manager';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useRenderMonitor } from '@/lib/performance/render-monitor';
import { CompactErrorDisplay } from '@/components/ui/ErrorDisplay';
import { apiClient, ApiResponse } from '@/lib/api/client';

// Cache for establishment data to avoid repeated API calls
interface EstablishmentCache {
  data: EstablishmentResponse[];
  timestamp: number;
  userRole: string;
  userId: string;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
let establishmentCache: EstablishmentCache | null = null;

interface EstablishmentSelectorProps {
  value?: string;
  onChange: (establishmentId: string) => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  label?: string;
}

export default function EstablishmentSelector({
  value,
  onChange,
  disabled = false,
  required = false,
  className = '',
  label = 'Établissement'
}: EstablishmentSelectorProps) {
  // Monitor render performance in development
  useRenderMonitor('EstablishmentSelector');

  const { user, isLoading: authLoading } = useAuth();
  const [establishments, setEstablishments] = useState<EstablishmentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const { error, handleError, clearError, retry, canRetry, isRetrying } = useErrorHandler({
    onRetry: () => fetchEstablishments()
  });

  // Memoize loading state to prevent unnecessary re-renders
  const isLoading = useMemo(() => !!(loading || authLoading), [loading, authLoading]);

  // Memoize user role and admin status to prevent unnecessary re-renders
  const isAdmin = useMemo(() => {
    if (!user) return false;
    const userRole = user.role;
    const adminStatus = userRole === 'root' || userRole === 'super_admin' || userRole === 'admin';
    console.log('🔐 User role check:', {
      userRole,
      email: user.email,
      isAdmin: adminStatus,
      establishmentId: user.establishmentId
    });
    return adminStatus;
  }, [user]);

  // Memoize disabled state to prevent unnecessary re-renders
  const isDisabled = useMemo(() => {
    // For admins, never disable unless explicitly disabled via props
    if (isAdmin) return !!disabled;
    // For non-admins, disable if they have an assigned establishment
    return !!disabled || (!isAdmin && user && !!user.establishmentId);
  }, [disabled, isAdmin, user]);

  // Check if cached data is valid for current user
  const isCacheValid = useCallback(() => {
    if (!establishmentCache || !user) return false;
    
    const now = Date.now();
    const isExpired = (now - establishmentCache.timestamp) > CACHE_DURATION;
    const isSameUser = establishmentCache.userId === user.id && establishmentCache.userRole === user.role;
    
    return !isExpired && isSameUser;
  }, [user]);

  // Optimized fetch function with caching
  const fetchEstablishments = useCallback(async () => {
    try {
      setLoading(true);
      clearError();

      // Check cache first
      if (isCacheValid() && establishmentCache) {
        console.log('📦 Using cached establishment data');
        setEstablishments(establishmentCache.data);
        setLoading(false);
        return;
      }

      // Get token from UnifiedTokenManager instead of direct localStorage access
      const token = unifiedTokenManager.getAccessToken();
      if (!token) {
        throw new Error('Token d\'authentification manquant');
      }

      // Validate token before making API call
      if (!unifiedTokenManager.isTokenValid(token)) {
        throw new Error('Token d\'authentification invalide');
      }

      // Check if token is expired and attempt refresh if needed
      if (unifiedTokenManager.isTokenExpired(token)) {
        console.log('Token expired, attempting refresh...');
        const refreshedToken = await unifiedTokenManager.refreshTokenIfNeeded();
        if (!refreshedToken) {
          throw new Error('Impossible de renouveler le token d\'authentification');
        }
      }

      // Get the current (possibly refreshed) token
      const currentToken = unifiedTokenManager.getAccessToken();
      if (!currentToken) {
        throw new Error('Token d\'authentification manquant après tentative de renouvellement');
      }

      console.log('🌐 Fetching establishment data from API');
      const response = await apiClient.get('/api/establishments') as ApiResponse<{ data: EstablishmentResponse[]; pagination: any }>;

      if (!response.success) {
        throw new Error(response.error?.message || 'API returned error');
      }

      // API returns: { success: true, data: { data: [...], pagination: {...} } }
      const establishmentsList = response.data?.data || [];

      // Update cache
      if (user) {
        establishmentCache = {
          data: establishmentsList,
          timestamp: Date.now(),
          userRole: user.role,
          userId: user.id
        };
        console.log('📦 Cached establishment data for user', user.id);
      }

      // The API already filters based on user role, so we just set what it returns
      setEstablishments(establishmentsList);

    } catch (err) {
      console.error('Error fetching establishments:', err);
      
      // Use enhanced error handling
      handleError(err, 'fetch_establishments');
    } finally {
      setLoading(false);
    }
  }, [user, isCacheValid, clearError, handleError]);

  useEffect(() => {
    // Only fetch establishments when auth is loaded
    if (!authLoading && user) {
      fetchEstablishments();
    }
  }, [user?.role, user?.establishmentId, authLoading, fetchEstablishments]);

  // Optimized auto-selection effect with dependency optimization
  useEffect(() => {
    // Auto-select user's establishment for non-admin users who have one assigned
    // Only when auth is loaded and user data is available
    if (!authLoading && !isAdmin && user?.establishmentId && (!value || value === '')) {
      console.log('🏢 Auto-selecting establishment for non-admin user:', user.establishmentId);
      onChange(user.establishmentId);
    }
    
    // For admins (root, super_admin), don't auto-select - let them choose
    // For non-admins without establishmentId, also don't auto-select
  }, [authLoading, isAdmin, user?.establishmentId, value, onChange]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value);
  }, [onChange]);

  return (
    <div className={className}>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
        {!isAdmin && user?.establishmentId && (
          <span className="text-xs text-gray-500 ml-2">(Assigné automatiquement)</span>
        )}
        {!isAdmin && !user?.establishmentId && (
          <span className="text-xs text-blue-600 ml-2">(Sélection requise)</span>
        )}
      </label>

      {/* Enhanced error display */}
      {error && (
        <div className="mb-2">
          <CompactErrorDisplay
            error={error}
            onRetry={canRetry ? retry : undefined}
            onDismiss={clearError}
            isRetrying={isRetrying}
          />
        </div>
      )}

      <select
        value={value || ''}
        onChange={handleChange}
        disabled={isDisabled || isLoading}
        required={required}
        className={`
          w-full px-3 py-2 border border-gray-300 rounded-lg 
          focus:ring-2 focus:ring-luxury-gold focus:border-luxury-gold
          disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-500
          ${isDisabled ? 'bg-gray-100' : 'bg-white'}
        `}
      >
        <option value="">
          {isLoading ? 'Chargement...' : establishments.length === 0 ? 'Aucun établissement disponible' : 'Sélectionner un établissement'}
        </option>
        
        {Array.isArray(establishments) && establishments.map((establishment) => (
          <option key={establishment.id} value={establishment.id}>
            {establishment.name} - {establishment.location.city}
          </option>
        ))}
      </select>

      {!isAdmin && user?.establishmentId && (
        <p className="text-xs text-gray-500 mt-1">
          Votre accès est limité à votre établissement assigné.
        </p>
      )}

      {!isAdmin && !user?.establishmentId && (
        <p className="text-xs text-blue-600 mt-1">
          Sélectionnez un établissement pour cet utilisateur.
        </p>
      )}

      {isAdmin && establishments.length > 0 && (
        <p className="text-xs text-gray-500 mt-1">
          En tant qu'administrateur, vous pouvez sélectionner parmi tous les établissements ({establishments.length} disponibles).
        </p>
      )}

      {isAdmin && establishments.length === 0 && !isLoading && (
        <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800 mb-2">
            Aucun établissement trouvé dans le système.
          </p>
          <a
            href="/admin/establishments/create"
            className="inline-flex items-center px-3 py-1 bg-luxury-gold text-luxury-cream text-sm rounded-md hover:bg-luxury-dark transition-colors"
          >
            Créer le premier établissement →
          </a>
        </div>
      )}

      {!isAdmin && establishments.length === 0 && !isLoading && !user?.establishmentId && (
        <p className="text-xs text-amber-600 mt-1">
          Aucun établissement disponible. Contactez un administrateur pour créer des établissements.
        </p>
      )}
    </div>
  );
}