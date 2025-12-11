'use client';

import { useState, useEffect } from 'react';
import { UserRole } from '@/types/user.types';
import { EstablishmentResponse } from '@/types/establishment.types';

interface EstablishmentSelectorProps {
  value?: string;
  onChange: (establishmentId: string) => void;
  disabled?: boolean;
  required?: boolean;
  userRole?: UserRole;
  userEstablishmentId?: string;
  className?: string;
  label?: string;
}

export default function EstablishmentSelector({
  value,
  onChange,
  disabled = false,
  required = false,
  userRole,
  userEstablishmentId,
  className = '',
  label = 'Établissement'
}: EstablishmentSelectorProps) {
  const [establishments, setEstablishments] = useState<EstablishmentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actualUserRole, setActualUserRole] = useState<UserRole | undefined>(userRole);



  // Fetch user role from API if not provided
  useEffect(() => {
    if (!userRole) {
      fetch('/api/auth/me')
        .then(res => res.json())
        .then(data => {
          if (data.success && data.user) {
            console.log('🔄 Fetched user role from API:', data.user.role);
            setActualUserRole(data.user.role);
          }
        })
        .catch(err => {
          console.error('Failed to fetch user role:', err);
        });
    } else {
      setActualUserRole(userRole);
    }
  }, [userRole]);

  // Determine if user is admin (can access all establishments)
  const isAdmin = actualUserRole === 'root' || actualUserRole === 'super_admin';
  
  // Auto-disable for non-admin users
  const isDisabled = disabled || !isAdmin;

  useEffect(() => {
    fetchEstablishments();
  }, [actualUserRole]); // Re-fetch when user role is determined

  useEffect(() => {
    // Auto-select user's establishment for non-admin users
    if (!isAdmin && userEstablishmentId && !value) {
      onChange(userEstablishmentId);
    }
  }, [isAdmin, userEstablishmentId, value, onChange]);

  const fetchEstablishments = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/establishments');
      
      if (!response.ok) {
        throw new Error('Failed to fetch establishments');
      }

      const data = await response.json();
      
      // Ensure we have a valid data structure
      if (!data.success) {
        throw new Error(data.error?.message || 'API returned error');
      }
      
      // Handle paginated response structure: { data: { data: [...], pagination: {...} } }
      let establishmentsList = [];
      
      if (data.data && typeof data.data === 'object') {
        // If data.data has a 'data' property (paginated response)
        if (Array.isArray(data.data.data)) {
          establishmentsList = data.data.data;
        }
        // If data.data is directly an array
        else if (Array.isArray(data.data)) {
          establishmentsList = data.data;
        }
        // If data.data is an object but not the expected structure
        else {
          console.warn('Unexpected data structure from establishments API:', data.data);
          establishmentsList = [];
        }
      }
      
      // Final safety check
      if (!Array.isArray(establishmentsList)) {
        console.error('Establishments data is not an array:', establishmentsList);
        establishmentsList = [];
      }
      
      // Apply role-based filtering based on actualUserRole
      const currentIsAdmin = actualUserRole === 'root' || actualUserRole === 'super_admin';
      
      if (currentIsAdmin) {
        // Admins see ALL establishments

        setEstablishments(establishmentsList);
        setError(null); // Clear any previous errors
      } else if (userEstablishmentId) {
        // Non-admin users only see their assigned establishment
        const userEstablishment = establishmentsList.find(
          (est: EstablishmentResponse) => est.id === userEstablishmentId
        );
        if (userEstablishment) {
          setEstablishments([userEstablishment]);
          setError(null);
        } else {
          // If user's establishment not found in the list, show empty
          setEstablishments([]);
          setError('Votre établissement assigné n\'a pas été trouvé');
        }
      } else {
        // Non-admin user without establishment assignment
        setEstablishments([]);
        setError('Aucun établissement assigné à votre compte');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load establishments');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className={className}>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
        {!isAdmin && (
          <span className="text-xs text-gray-500 ml-2">(Pré-sélectionné)</span>
        )}
      </label>

      {error && (
        <div className="mb-2 p-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
          {error}
        </div>
      )}

      <select
        value={value || ''}
        onChange={handleChange}
        disabled={isDisabled || loading}
        required={required}
        className={`
          w-full px-3 py-2 border border-gray-300 rounded-lg 
          focus:ring-2 focus:ring-luxury-gold focus:border-luxury-gold
          disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-500
          ${isDisabled ? 'bg-gray-100' : 'bg-white'}
        `}
      >
        <option value="">
          {loading ? 'Chargement...' : 'Sélectionner un établissement'}
        </option>
        
        {Array.isArray(establishments) && establishments.map((establishment) => (
          <option key={establishment.id} value={establishment.id}>
            {establishment.name} - {establishment.location.city}
          </option>
        ))}
      </select>

      {!isAdmin && (
        <p className="text-xs text-gray-500 mt-1">
          Votre accès est limité à votre établissement assigné.
        </p>
      )}

      {isAdmin && establishments.length > 0 && (
        <p className="text-xs text-gray-500 mt-1">
          En tant qu'administrateur, vous avez accès à tous les établissements ({establishments.length} disponibles).
        </p>
      )}

      {isAdmin && establishments.length === 0 && !loading && (
        <p className="text-xs text-amber-600 mt-1">
          Aucun établissement trouvé dans le système.
        </p>
      )}
    </div>
  );
}