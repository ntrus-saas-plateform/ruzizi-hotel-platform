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

  // Determine if user is admin (can access all establishments)
  const isAdmin = userRole === 'root' || userRole === 'super_admin';
  
  // Auto-disable for non-admin users
  const isDisabled = disabled || !isAdmin;

  useEffect(() => {
    fetchEstablishments();
  }, []);

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
      const establishmentsList = data.data || [];
      
      setEstablishments(establishmentsList);

      // If user is not admin and has establishment, filter to only their establishment
      if (!isAdmin && userEstablishmentId) {
        const userEstablishment = establishmentsList.find(
          (est: EstablishmentResponse) => est.id === userEstablishmentId
        );
        if (userEstablishment) {
          setEstablishments([userEstablishment]);
        }
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
        
        {establishments.map((establishment) => (
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
          En tant qu'administrateur, vous pouvez sélectionner n'importe quel établissement.
        </p>
      )}
    </div>
  );
}