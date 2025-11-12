'use client';

import { useState, useEffect } from 'react';
import type { AccommodationResponse } from '@/types/accommodation.types';
import type { BookingResponse } from '@/types/booking.types';

interface TimeSlot {
  start: string;
  end: string;
  isOccupied: boolean;
  booking?: BookingResponse;
}

export default function WalkInBookingPage() {
  const [establishments, setEstablishments] = useState<any[]>([]);
  const [accommodations, setAccommodations] = useState<AccommodationResponse[]>([]);
  const [selectedEstablishment, setSelectedEstablishment] = useState('');
  const [selectedAccommodation, setSelectedAccommodation] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [existingBookings, setExistingBookings] = useState<BookingResponse[]>([]);
  const [dailyRevenue, setDailyRevenue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form data
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    idNumber: '',
    checkInTime: '',
    checkOutTime: '',
    numberOfGuests: 1,
    notes: '',
  });

  useEffect(() => {
    fetchEstablishments();
  }, []);

  useEffect(() => {
    if (selectedEstablishment) {
      fetchAccommodations();
    }
  }, [selectedEstablishment]);

  useEffect(() => {
    if (selectedAccommodation && selectedDate) {
      fetchExistingBookings();
      fetchDailyRevenue();
    }
  }, [selectedAccommodation, selectedDate]);

  const fetchEstablishments = async () => {
    try {
      const response = await fetch('/api/establishments');
      const data = await response.json();
      if (data.success) {
        setEstablishments(data.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch establishments:', err);
    }
  };

  const fetchAccommodations = async () => {
    try {
      const response = await fetch(
        `/api/accommodations?establishmentId=${selectedEstablishment}&status=available`
      );
      const data = await response.json();
      if (data.success) {
        setAccommodations(data.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch accommodations:', err);
    }
  };

  const fetchExistingBookings = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/bookings/walkin/by-date?accommodationId=${selectedAccommodation}&date=${selectedDate}`
      );
      const data = await response.json();
      if (data.success) {
        setExistingBookings(data.data.bookings || []);
      }
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDailyRevenue = async () => {
    try {
      const response = await fetch(
        `/api/bookings/walkin/daily-revenue?accommodationId=${selectedAccommodation}&date=${selectedDate}`
      );
      const data = await response.json();
      if (data.success) {
        setDailyRevenue(data.data.revenue || 0);
      }
    } catch (err) {
      console.error('Failed to fetch revenue:', err);
    }
  };

  const generateTimeSlots = (): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const startHour = 6; // 6 AM
    const endHour = 23; // 11 PM

    for (let hour = startHour; hour < endHour; hour++) {
      const start = `${hour.toString().padStart(2, '0')}:00`;
      const end = `${(hour + 1).toString().padStart(2, '0')}:00`;

      // Check if this time slot is occupied
      const isOccupied = existingBookings.some((booking) => {
        const bookingStart = new Date(booking.checkIn);
        const bookingEnd = new Date(booking.checkOut);
        const slotStart = new Date(`${selectedDate}T${start}`);
        const slotEnd = new Date(`${selectedDate}T${end}`);

        return (
          (slotStart >= bookingStart && slotStart < bookingEnd) ||
          (slotEnd > bookingStart && slotEnd <= bookingEnd) ||
          (slotStart <= bookingStart && slotEnd >= bookingEnd)
        );
      });

      const booking = existingBookings.find((b) => {
        const bookingStart = new Date(b.checkIn);
        const slotStart = new Date(`${selectedDate}T${start}`);
        return bookingStart.getHours() === slotStart.getHours();
      });

      slots.push({ start, end, isOccupied, booking });
    }

    return slots;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'numberOfGuests' ? parseInt(value) || 1 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      if (!selectedEstablishment || !selectedAccommodation) {
        throw new Error('Please select establishment and accommodation');
      }

      if (!formData.checkInTime || !formData.checkOutTime) {
        throw new Error('Please select check-in and check-out times');
      }

      const checkIn = new Date(`${selectedDate}T${formData.checkInTime}`);
      const checkOut = new Date(`${selectedDate}T${formData.checkOutTime}`);

      const bookingData = {
        establishmentId: selectedEstablishment,
        accommodationId: selectedAccommodation,
        clientInfo: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          idNumber: formData.idNumber || undefined,
        },
        checkIn,
        checkOut,
        numberOfGuests: formData.numberOfGuests,
        notes: formData.notes || undefined,
      };

      const response = await fetch('/api/bookings/walkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to create booking');
      }

      setSuccess(`Réservation créée avec succès ! Code: ${data.data.bookingCode}`);
      
      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        idNumber: '',
        checkInTime: '',
        checkOutTime: '',
        numberOfGuests: 1,
        notes: '',
      });

      // Refresh bookings and revenue
      fetchExistingBookings();
      fetchDailyRevenue();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const timeSlots = selectedAccommodation ? generateTimeSlots() : [];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Réservations Client de Passage</h1>
          <p className="text-gray-600 mt-2">
            Gérer les réservations horaires pour les clients de passage
          </p>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Nouvelle Réservation de Passage
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Establishment and Accommodation Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Établissement *
                    </label>
                    <select
                      value={selectedEstablishment}
                      onChange={(e) => {
                        setSelectedEstablishment(e.target.value);
                        setSelectedAccommodation('');
                      }}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Sélectionner un établissement</option>
                      {establishments.map((est) => (
                        <option key={est.id} value={est.id}>
                          {est.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hébergement *
                    </label>
                    <select
                      value={selectedAccommodation}
                      onChange={(e) => setSelectedAccommodation(e.target.value)}
                      required
                      disabled={!selectedEstablishment}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    >
                      <option value="">Sélectionner un hébergement</option>
                      {accommodations.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name} - {acc.pricing.basePrice.toLocaleString()} BIF/jour
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Date Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Time Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Heure d'arrivée *
                    </label>
                    <input
                      type="time"
                      name="checkInTime"
                      value={formData.checkInTime}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Heure de départ *
                    </label>
                    <input
                      type="time"
                      name="checkOutTime"
                      value={formData.checkOutTime}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Client Information */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Informations Client
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Prénom *
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nom *
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Téléphone *
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Numéro d'identité
                      </label>
                      <input
                        type="text"
                        name="idNumber"
                        value={formData.idNumber}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre de personnes *
                      </label>
                      <input
                        type="number"
                        name="numberOfGuests"
                        value={formData.numberOfGuests}
                        onChange={handleInputChange}
                        required
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes (optionnel)
                    </label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Demandes spéciales..."
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full px-4 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Création en cours...' : 'Créer la réservation'}
                </button>
              </form>
            </div>
          </div>

          {/* Right Column - Occupancy & Revenue */}
          <div className="space-y-6">
            {/* Daily Revenue Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenu Journalier</h3>
              {selectedAccommodation ? (
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-600">
                    {dailyRevenue.toLocaleString()} BIF
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    {existingBookings.length} réservation(s)
                  </p>
                </div>
              ) : (
                <p className="text-gray-500 text-center">
                  Sélectionnez un hébergement pour voir le revenu
                </p>
              )}
            </div>

            {/* Hourly Occupancy */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Occupation Horaire
              </h3>
              {selectedAccommodation ? (
                loading ? (
                  <p className="text-gray-500 text-center">Chargement...</p>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {timeSlots.map((slot, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-md border ${
                          slot.isOccupied
                            ? 'bg-red-50 border-red-200'
                            : 'bg-green-50 border-green-200'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-sm">
                            {slot.start} - {slot.end}
                          </span>
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              slot.isOccupied
                                ? 'bg-red-100 text-red-800'
                                : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {slot.isOccupied ? 'Occupé' : 'Libre'}
                          </span>
                        </div>
                        {slot.booking && (
                          <p className="text-xs text-gray-600 mt-1">
                            {slot.booking.clientInfo.firstName} {slot.booking.clientInfo.lastName}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )
              ) : (
                <p className="text-gray-500 text-center">
                  Sélectionnez un hébergement pour voir l'occupation
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
