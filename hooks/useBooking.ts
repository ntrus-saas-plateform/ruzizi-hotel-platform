'use client';

import { useState } from 'react';
import type { CompleteClientInfo, GuestInfo } from '@/types/guest.types';
import type { AccommodationResponse } from '@/types/accommodation.types';

interface BookingData {
  establishmentId: string;
  accommodationId: string;
  checkInDate: string;
  checkOutDate: string;
  numberOfNights: number;
  arrivalTime: string;
  numberOfGuests: number;
  mainClient: CompleteClientInfo;
  guests: GuestInfo[];
  specialRequests: string;
  totalAmount: number;
  pricingDetails: {
    basePrice: number;
    seasonalPrice: number;
    pricingMode: string;
    numberOfUnits: number;
    totalAmount: number;
  };
}

interface UseBookingReturn {
  loading: boolean;
  error: string | null;
  success: boolean;
  createBooking: (data: BookingData) => Promise<any>;
  clearError: () => void;
  clearSuccess: () => void;
}

export function useBooking(): UseBookingReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const createBooking = async (data: BookingData) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/public/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          establishmentId: data.establishmentId,
          accommodationId: data.accommodationId,
          checkInDate: data.checkInDate,
          checkOutDate: data.checkOutDate,
          numberOfNights: data.numberOfNights,
          arrivalTime: data.arrivalTime,
          numberOfGuests: data.numberOfGuests,
          mainClient: data.mainClient,
          guests: data.guests,
          specialRequests: data.specialRequests,
          totalAmount: data.totalAmount,
          pricingDetails: data.pricingDetails,
          status: 'pending'
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || 'Erreur lors de la réservation');
      }

      setSuccess(true);
      return result.data;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);
  const clearSuccess = () => setSuccess(false);

  return {
    loading,
    error,
    success,
    createBooking,
    clearError,
    clearSuccess,
  };
}

// Hook pour rechercher une réservation
interface UseBookingSearchReturn {
  loading: boolean;
  error: string | null;
  booking: any | null;
  searchBooking: (code: string, email: string) => Promise<void>;
  clearResults: () => void;
}

export function useBookingSearch(): UseBookingSearchReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [booking, setBooking] = useState<any | null>(null);

  const searchBooking = async (code: string, email: string) => {
    setLoading(true);
    setError(null);
    setBooking(null);

    try {
      const response = await fetch(
        `/api/public/bookings/by-code?code=${encodeURIComponent(code)}&email=${encodeURIComponent(email)}`
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || 'Erreur lors de la recherche');
      }

      setBooking(result.data);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setBooking(null);
    setError(null);
  };

  return {
    loading,
    error,
    booking,
    searchBooking,
    clearResults,
  };
}