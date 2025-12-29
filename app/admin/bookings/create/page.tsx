'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateBooking, useAccommodations } from '@/hooks/useQueries';
import { useAuth } from '@/lib/auth/AuthContext';
import EstablishmentSelector from '@/components/admin/EstablishmentSelector';
import type { AccommodationResponse } from '@/types/accommodation.types';
import type { EstablishmentResponse } from '@/types/establishment.types';

export default function CreateBookingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedEstablishment, setSelectedEstablishment] = useState('');
  const [selectedAccommodation, setSelectedAccommodation] = useState<AccommodationResponse | null>(
    null
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Auto-select establishment for non-admin users
  useEffect(() => {
    if (user && user.role !== 'root' && user.role !== 'super_admin' && user.role !== 'admin' && user.establishmentId) {
      console.log('🏢 Auto-selecting establishment for booking creation:', user.establishmentId);
      setSelectedEstablishment(user.establishmentId);
    }
  }, [user]);

  // React Query hooks
  const { data: accommodationsData, isLoading: loading } = useAccommodations(
    selectedEstablishment ? { establishmentId: selectedEstablishment, status: 'available' } : undefined
  );

  const accommodations = accommodationsData?.data || [];

  const createBookingMutation = useCreateBooking();

  // Form data
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    idNumber: '',
    checkIn: '',
    checkOut: '',
    numberOfGuests: 1,
    notes: '',
    bookingType: 'onsite', // 'onsite' pour réservation normale, 'walkin' pour walk-in
  });



  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'numberOfGuests' ? parseInt(value) || 1 : value,
    }));
  };

  const handleAccommodationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const accommodationId = e.target.value;
    const accommodation = accommodations.find((acc: AccommodationResponse) => acc.id === accommodationId);
    setSelectedAccommodation(accommodation || null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Client-side validation for establishment
    if (!selectedEstablishment) {
      setError('Veuillez sélectionner un établissement');
      return;
    }

    if (!selectedAccommodation) {
      setError('Veuillez sélectionner un hébergement');
      return;
    }

    // Validate establishment permissions for non-admin users
    if (user && user.role !== 'root' && user.role !== 'super_admin' && user.role !== 'admin') {
      if (selectedEstablishment !== user.establishmentId) {
        setError('Vous ne pouvez créer des réservations que pour votre établissement assigné');
        return;
      }
    }

    const bookingData = {
      establishmentId: selectedEstablishment,
      accommodationId: selectedAccommodation.id,
      clientInfo: {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        idNumber: formData.idNumber || undefined,
      },
      bookingType: formData.bookingType, // Utiliser le type choisi dans le formulaire
      checkIn: new Date(formData.checkIn),
      checkOut: new Date(formData.checkOut),
      numberOfGuests: formData.numberOfGuests,
      notes: formData.notes || undefined,
    };

    try {
      await createBookingMutation.mutateAsync(bookingData);
      router.push('/admin/bookings');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/bookings')}
            className="text-luxury-gold  mb-2"
          >
            ← Retour aux réservations
          </button>
          <h1 className="text-3xl font-bold text-luxury-dark">Nouvelle Réservation</h1>
          <p className="text-luxury-text mt-2">Créer une réservation (normale ou walk-in)</p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Establishment and Accommodation Selection */}
                <div>
                  <h2 className="text-lg font-semibold text-luxury-dark mb-4">
                    Sélection de l'hébergement
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <EstablishmentSelector
                      value={selectedEstablishment}
                      onChange={(establishmentId) => {
                        setSelectedEstablishment(establishmentId);
                        setSelectedAccommodation(null);
                      }}
                      required
                      label="Établissement"
                    />

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Hébergement *
                      </label>
                      <select
                        value={selectedAccommodation?.id || ''}
                        onChange={handleAccommodationChange}
                        required
                        disabled={!selectedEstablishment || loading}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                      >
                        <option value="">Sélectionner un hébergement</option>
                         {accommodations.map((acc: AccommodationResponse, index: number) => (
                           <option key={acc.id + '-' + index} value={acc.id}>
                             {acc.name} - {acc.pricing.basePrice.toLocaleString()} BIF
                           </option>
                         ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Booking Type Selection */}
                <div className="mt-4">
                  <h2 className="text-lg font-semibold text-luxury-dark mb-4">
                    Type de réservation
                  </h2>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type de réservation *
                    </label>
                    <select
                      name="bookingType"
                      value={formData.bookingType}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="onsite">Réservation normale</option>
                      <option value="walkin">Walk-in (même jour)</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Walk-in: pour les réservations du même jour uniquement
                    </p>
                  </div>
                </div>

                {/* Dates */}
                <div>
                  <h2 className="text-lg font-semibold text-luxury-dark mb-4">Dates du séjour</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date d'arrivée *
                      </label>
                      <input
                        type="date"
                        name="checkIn"
                        value={formData.checkIn}
                        onChange={handleInputChange}
                        required
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date de départ *
                      </label>
                      <input
                        type="date"
                        name="checkOut"
                        value={formData.checkOut}
                        onChange={handleInputChange}
                        required
                        min={formData.checkIn || new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Client Information */}
                <div>
                  <h2 className="text-lg font-semibold text-luxury-dark mb-4">
                    Informations Client
                  </h2>
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
                        max={selectedAccommodation?.capacity.maxGuests || 10}
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
                      placeholder="Demandes spéciales, préférences..."
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={createBookingMutation.isPending}
                  className="w-full px-4 py-3 bg-luxury-gold text-luxury-cream font-medium rounded-md  disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createBookingMutation.isPending ? 'Création en cours...' : 'Créer la réservation'}
                </button>
              </form>
            </div>
          </div>

          {/* Accommodation Info */}
          <div>
            {selectedAccommodation ? (
              <div className="bg-white rounded-lg shadow p-6 sticky top-6">
                <h2 className="text-lg font-semibold text-luxury-dark mb-4">Hébergement sélectionné</h2>

                {selectedAccommodation.images[0] && (
                  <img
                    src={selectedAccommodation.images[0]}
                    alt={selectedAccommodation.name}
                    className="w-full h-40 object-cover rounded-lg mb-4"
                  />
                )}

                <h3 className="font-semibold text-luxury-dark">{selectedAccommodation.name}</h3>
                <p className="text-sm text-luxury-text mb-4">
                  {selectedAccommodation.type === 'standard_room'
                    ? 'Chambre Standard'
                    : selectedAccommodation.type === 'suite'
                      ? 'Suite'
                      : selectedAccommodation.type === 'house'
                        ? 'Maison'
                        : 'Appartement'}
                </p>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-luxury-text">Prix</span>
                    <span className="font-semibold">
                      {selectedAccommodation.pricing.basePrice.toLocaleString()} BIF
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-luxury-text">Capacité</span>
                    <span className="font-semibold">
                      {selectedAccommodation.capacity.maxGuests} personnes
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-luxury-text">Chambres</span>
                    <span className="font-semibold">{selectedAccommodation.capacity.bedrooms}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-luxury-text">Salles de bain</span>
                    <span className="font-semibold">{selectedAccommodation.capacity.bathrooms}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-500 text-center">
                  Sélectionnez un hébergement pour voir les détails
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
