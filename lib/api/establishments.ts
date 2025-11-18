import { apiClient } from './client';

export interface CreateEstablishmentData {
  name: string;
  description?: string;
  address: {
    street: string;
    city: string;
    province: string;
    country: string;
    postalCode?: string;
  };
  contact: {
    phone: string;
    email: string;
    website?: string;
  };
  pricingMode: 'per_night' | 'per_hour';
  managerId?: string;
  settings?: {
    currency?: string;
    timezone?: string;
    language?: string;
  };
}

export interface Establishment extends CreateEstablishmentData {
  id: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EstablishmentFilters {
  city?: string;
  pricingMode?: string;
  isActive?: boolean;
  managerId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

/**
 * API pour la gestion des établissements
 */
export const establishmentsApi = {
  /**
   * Créer un nouvel établissement
   */
  async create(data: CreateEstablishmentData): Promise<Establishment> {
    const response = await apiClient.post<any>('/api/establishments', data);
    
    if (response.success) {
      return response.data;
    }
    
    throw new Error(response.error?.message || 'Failed to create establishment');
  },

  /**
   * Obtenir tous les établissements
   */
  async getAll(filters?: EstablishmentFilters): Promise<{
    establishments: Establishment[];
    total: number;
    page: number;
    limit: number;
  }> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    const response = await apiClient.get<any>(
      `/api/establishments?${params.toString()}`
    );
    
    if (response.success) {
      return response.data;
    }
    
    throw new Error(response.error?.message || 'Failed to fetch establishments');
  },

  /**
   * Obtenir un établissement par ID
   */
  async getById(id: string): Promise<Establishment> {
    const response = await apiClient.get<any>(`/api/establishments/${id}`);
    
    if (response.success) {
      return response.data;
    }
    
    throw new Error(response.error?.message || 'Failed to fetch establishment');
  },

  /**
   * Mettre à jour un établissement
   */
  async update(id: string, data: Partial<CreateEstablishmentData>): Promise<Establishment> {
    const response = await apiClient.put<any>(`/api/establishments/${id}`, data);
    
    if (response.success) {
      return response.data;
    }
    
    throw new Error(response.error?.message || 'Failed to update establishment');
  },

  /**
   * Supprimer un établissement
   */
  async delete(id: string): Promise<void> {
    const response = await apiClient.delete<any>(`/api/establishments/${id}`);
    
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to delete establishment');
    }
  },

  /**
   * Activer/Désactiver un établissement
   */
  async toggleActive(id: string, isActive: boolean): Promise<Establishment> {
    const response = await apiClient.patch<any>(
      `/api/establishments/${id}`,
      { isActive }
    );
    
    if (response.success) {
      return response.data;
    }
    
    throw new Error(response.error?.message || 'Failed to toggle establishment status');
  },
};

export default establishmentsApi;
