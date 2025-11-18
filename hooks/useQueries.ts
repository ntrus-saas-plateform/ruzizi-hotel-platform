import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/utils/api-client';
import type { BookingResponse } from '@/types/booking.types';
import type { AccommodationResponse } from '@/types/accommodation.types';
import type { EstablishmentResponse } from '@/types/establishment.types';

// Query keys
export const queryKeys = {
  bookings: ['bookings'] as const,
  booking: (id: string) => ['bookings', id] as const,
  accommodations: ['accommodations'] as const,
  accommodation: (id: string) => ['accommodations', id] as const,
  establishments: ['establishments'] as const,
  establishment: (id: string) => ['establishments', id] as const,
};

// Bookings hooks
export function useBookings(filters?: Record<string, any>) {
  return useQuery({
    queryKey: [...queryKeys.bookings, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, String(value));
          }
        });
      }
      const response = await apiClient.get(`/api/bookings?${params}`);
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
  });
}

export function useBooking(id: string) {
  return useQuery({
    queryKey: queryKeys.booking(id),
    queryFn: async () => {
      const response = await apiClient.get(`/api/bookings/${id}`);
      return response.data;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookingData: any) => {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(bookingData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to create booking');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings });
    },
  });
}

// Accommodations hooks
export function useAccommodations(filters?: Record<string, any>) {
  return useQuery({
    queryKey: [...queryKeys.accommodations, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, String(value));
          }
        });
      }
      const response = await apiClient.get(`/api/accommodations?${params}`);
      return response.data;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: true,
  });
}

export function useAccommodation(id: string) {
  return useQuery({
    queryKey: queryKeys.accommodation(id),
    queryFn: async () => {
      const response = await apiClient.get(`/api/accommodations/${id}`);
      return response.data;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 10,
  });
}

// Establishments hooks
export function useEstablishments(filters?: Record<string, any>) {
  return useQuery({
    queryKey: [...queryKeys.establishments, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, String(value));
          }
        });
      }
      const response = await apiClient.get(`/api/establishments?${params}`);
      return response.data;
    },
    staleTime: 1000 * 60 * 15, // 15 minutes
    refetchOnWindowFocus: true,
  });
}

export function useEstablishment(id: string) {
  return useQuery({
    queryKey: queryKeys.establishment(id),
    queryFn: async () => {
      const response = await apiClient.get(`/api/establishments/${id}`);
      return response.data;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 15,
  });
}

// Delete accommodation mutation
export function useDeleteAccommodation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/accommodations/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete accommodation');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.accommodations });
    },
  });
}