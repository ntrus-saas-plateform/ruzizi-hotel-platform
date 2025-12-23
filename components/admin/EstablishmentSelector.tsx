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

  // Use props directly
  const actualUserRole = userRole;
  const actualUserEstablishmentId = userEstablishmentId;

  // Determine if user is admin (can access all establishments)
  const isAdmin = actualUserRole === 'root' || actualUserRole === 'super_admin';
  
  // Auto-disable for non-admin users
  const isDisabled = disabled || !isAdmin;

  useEffect(() => {
    fetchEstablishments();
  }, [actualUserRole, actualUserEstablishmentId]);

  useEffect(() => {
    // Auto-select user's establishment for non-admin users
    if (!isAdmin && actualUserEstablishmentId && !value) {
      onChange(actualUserEstablishmentId);
    }
  }, [isAdmin, actualUserEstablishmentId, value, onChange]);

  const fetchEstablishments = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/establishments', {
        credentials: 'include', // Include cookies for authentication
      });
      
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
      
      // Apply role-based filtering
      if (isAdmin) {
        // Admins see ALL establishments
        console.log('👑 Admin user - showing all establishments:', establishmentsList.length);
        setEstablishments(establishmentsList);
        setError(null);
      } else if (actualUserEstablishmentId) {
        // Non-admin users only see their assigned establishment
        console.log('👤 Non-admin user - looking for establishment:', actualUserEstablishmentId);
        console.log('📋 Available establishments:', establishmentsList.map(est => ({ id: est.id, name: est.name })));
        
        // Try to find the establishment with detailed logging
        console.log('🔍 Searching for establishment with ID:', actualUserEstablishmentId);
        console.log('🔍 Establishment IDs in list:', establishmentsList.map(est => est.id));
        
        const userEstablishment = establishmentsList.find(
          (est: EstablishmentResponse) => {
            console.log(`🔍 Comparing "${est.id}" === "${actualUserEstablishmentId}":`, est.id === actualUserEstablishmentId);
            return est.id === actualUserEstablishmentId;
          }
        );
        
        console.log('🎯 Found user establishment:', userEstablishment);
        
        if (userEstablishment) {
          console.log('✅ Setting user establishment:', userEstablishment.name);
          setEstablishments([userEstablishment]);
          setError(null);
        } else {
          // If user's establishment not found in the list, show empty
          console.log('❌ User establishment not found in list');
          setEstablishments([]);
          setError('Votre établissement assigné n\'a pas été trouvé');
        }
      } else {
        // Non-admin user without establishment assignment
        console.log('❌ Non-admin user without establishment assignment');
        setEstablishments([]);
        setError('Aucun établissement assigné à votre compte');
      }
    } catch (err) {
      console.error('Error fetching establishments:', err);
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