'use client';

import { useState, useEffect } from 'react';
import type { AccommodationResponse } from '@/types/accommodation.types';

interface TimeSlot {
  start: string;
  end: string;
  isOccupied: boolean;
  booking?: any;
}

export default function WalkInBookingPage() {
  const [establishments, setEstablishments] = useState<any[]>([]);
  const [accommodations, setAccommodations] = useState<AccommodationResponse[]>([]);
  const [selectedEstablishment, setSelectedEstablishment] = useState('');
  const [selectedAccommodation, setSelectedAccommodation] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [existingBookings, setExistingBookings] = useState<any[]>([]);
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
    const startHour = 6;
    const endHour = 23;

    for (let hour = startHour; hour < endHour; hour++) {
      const start = `${hour.toString().padStart(2, '0')}:00`;
      const end = `${(hour + 1).toString().padStart(2, '0')}:00`;

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
        throw new Error('Veuillez sélectionner un établissement et un hébergement');
      }

      if (!formData.checkInTime || !formData.checkOutTime) {
        throw new Error('Veuillez sélectionner les heures d\'arrivée et de départ');
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Échec de la création de la réservation');
      }

      setSuccess(`Réservation créée avec succès ! Code: ${data.data.bookingCode}`);
      
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

      fetchExistingBookings();
      fetchDailyRevenue();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setSubmitting(false);
    }
  };

  const timeSlots = selectedAccommodation ? generateTimeSlots() : [];

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center space-x-3 mb-2">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-luxury-dark">Client de Passage</h1>
              <p className="text-luxury-text text-sm sm:text-base">Réservations horaires rapides</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-green-700 font-medium">{success}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold text-luxury-dark mb-6 flex items-center">
                <svg className="w-5 h-5 mr-2 text-luxury-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Nouvelle Réservation
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Establishment and Accommodation */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Établissement <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedEstablishment}
                      onChange={(e) => {
                        setSelectedEstablishment(e.target.value);
                        setSelectedAccommodation('');
                      }}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">Sélectionner...</option>
                      {establishments.map((est) => (
                        <option key={est.id} value={est.id}>{est.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hébergement <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedAccommodation}
                      onChange={(e) => setSelectedAccommodation(e.target.value)}
                      required
                      disabled={!selectedEstablishment}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100"
                    >
                      <option value="">Sélectionner...</option>
                      {accommodations.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name} - {acc.pricing.basePrice.toLocaleString()} BIF
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Date and Time */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Arrivée <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      name="checkInTime"
                      value={formData.checkInTime}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Départ <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      name="checkOutTime"
                      value={formData.checkOutTime}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Client Information */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-base sm:text-lg font-semibold text-luxury-dark mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-luxury-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Informations Client
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Prénom <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nom <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Téléphone <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Numéro d'identité
                      </label>
                      <input
                        type="text"
                        name="idNumber"
                        value={formData.idNumber}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Personnes <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="numberOfGuests"
                        value={formData.numberOfGuests}
                        onChange={handleInputChange}
                        required
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes
                    </label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Demandes spéciales..."
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-luxury-cream font-semibold rounded-lg hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex items-center justify-center"
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-luxury-cream" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Création en cours...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Créer la Réservation
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Right Column - Stats & Occupancy */}
          <div className="space-y-6">
            {/* Daily Revenue */}
            <div className="bg-luxury-gold rounded-xl shadow-lg p-6 text-luxury-cream">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Revenu Journalier</h3>
                <svg className="w-8 h-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              {selectedAccommodation ? (
                <div>
                  <p className="text-4xl font-bold mb-2">{dailyRevenue.toLocaleString()} <span className="text-xl">BIF</span></p>
                  <p className="text-purple-100">{existingBookings.length} réservation(s)</p>
                </div>
              ) : (
                <p className="text-purple-100">Sélectionnez un hébergement</p>
              )}
            </div>

            {/* Hourly Occupancy */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-luxury-dark mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-luxury-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Occupation Horaire
              </h3>
              {selectedAccommodation ? (
                loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                    <p className="text-gray-500 mt-2 text-sm">Chargement...</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {timeSlots.map((slot, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          slot.isOccupied
                            ? 'bg-red-50 border-red-200'
                            : 'bg-green-50 border-green-200'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-sm text-luxury-dark">
                            {slot.start} - {slot.end}
                          </span>
                          <span
                            className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                              slot.isOccupied
                                ? 'bg-red-100 text-red-800'
                                : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {slot.isOccupied ? 'Occupé' : 'Libre'}
                          </span>
                        </div>
                        {slot.booking && (
                          <p className="text-xs text-luxury-text mt-1 flex items-center">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            {slot.booking.clientInfo.firstName} {slot.booking.clientInfo.lastName}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )
              ) : (
                <p className="text-gray-500 text-center py-8 text-sm">
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
