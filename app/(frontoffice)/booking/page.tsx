'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import EstablishmentSelector from '@/components/booking/EstablishmentSelector';
import MainClientForm from '@/components/booking/MainClientForm';
import GuestForm from '@/components/booking/GuestForm';
import BookingSummary from '@/components/booking/BookingSummary';
import type { AccommodationResponse } from '@/types/accommodation.types';
import type { CompleteClientInfo, Gender, IDType, CustomerType } from '@/types/guest.types';

type BookingStep = 'dates' | 'establishment' | 'guests' | 'confirmation';

interface GuestInfo {
  adults: number;
  children: number;
  infants: number;
}

interface ClientInfo extends CompleteClientInfo {
  preferredLanguage: 'fr' | 'en';
}

export default function BookingPage() {
  const router = useRouter();
  const [language, setLanguage] = useState('fr');
  const [currentStep, setCurrentStep] = useState<BookingStep>('dates');
  const [loading, setLoading] = useState(false);

  // Step 1: Dates and guests
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [guests, setGuests] = useState<GuestInfo>({ adults: 1, children: 0, infants: 0 });

  // Step 2: Establishment and accommodation
   const [selectedEstablishment, setSelectedEstablishment] = useState<string | null>(null);
   const [selectedAccommodation, setSelectedAccommodation] = useState<string | null>(null);
   const [selectedAccommodationData, setSelectedAccommodationData] = useState<AccommodationResponse | null>(null);
   const [establishmentName, setEstablishmentName] = useState('');

  // Step 3: Guest details
  const [clientInfo, setClientInfo] = useState<ClientInfo>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    gender: 'M',
    dateOfBirth: new Date('1990-01-01'),
    nationality: '',
    idType: 'passport',
    idNumber: '',
    address: '',
    city: '',
    country: '',
    postalCode: '',
    preferredLanguage: 'fr',
    customerType: 'individual',
  });

  const [specialRequests, setSpecialRequests] = useState('');
  const [arrivalTime, setArrivalTime] = useState('');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') || 'fr';
    setLanguage(savedLanguage);
  }, []);

  useEffect(() => {
    if (selectedEstablishment) {
      fetch(`/api/public/establishments/${selectedEstablishment}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setEstablishmentName(data.data.name);
          }
        })
        .catch(error => console.error('Error fetching establishment:', error));
    } else {
      setEstablishmentName('');
    }
  }, [selectedEstablishment]);

  const content = {
    fr: {
      title: "Réserver votre séjour",
      subtitle: "Réservez facilement votre hébergement idéal",
      step1: "Dates et voyageurs",
      step2: "Sélection d'hébergement",
      step3: "Informations voyageurs",
      step4: "Confirmation",
      checkIn: "Date d'arrivée",
      checkOut: "Date de départ",
      adults: "Adultes",
      children: "Enfants",
      infants: "Bébés",
      next: "Suivant",
      previous: "Précédent",
      confirmBooking: "Confirmer la réservation",
      bookingInProgress: "Réservation en cours...",
      selectDates: "Veuillez sélectionner vos dates de séjour",
      selectAccommodation: "Veuillez sélectionner un hébergement",
      fillGuestInfo: "Veuillez remplir vos informations",
      specialRequests: "Demandes spéciales",
      arrivalTime: "Heure d'arrivée estimée",
      optional: "optionnel",
      totalGuests: "voyageurs au total",
      night: "nuit",
      nights: "nuits",
      processing: "Traitement en cours...",
    },
    en: {
      title: "Book your stay",
      subtitle: "Easily book your ideal accommodation",
      step1: "Dates and travelers",
      step2: "Accommodation selection",
      step3: "Traveler information",
      step4: "Confirmation",
      checkIn: "Check-in date",
      checkOut: "Check-out date",
      adults: "Adults",
      children: "Children",
      infants: "Infants",
      next: "Next",
      previous: "Previous",
      confirmBooking: "Confirm booking",
      bookingInProgress: "Booking in progress...",
      selectDates: "Please select your stay dates",
      selectAccommodation: "Please select an accommodation",
      fillGuestInfo: "Please fill in your information",
      specialRequests: "Special requests",
      arrivalTime: "Estimated arrival time",
      optional: "optional",
      totalGuests: "total travelers",
      night: "night",
      nights: "nights",
      processing: "Processing...",
    }
  };

  const t = content[language as keyof typeof content];

  const steps = [
    { key: 'dates', label: t.step1 },
    { key: 'establishment', label: t.step2 },
    { key: 'guests', label: t.step3 },
    { key: 'confirmation', label: t.step4 },
  ];

  const calculateNights = () => {
    if (!checkInDate || !checkOutDate) return 0;
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const diffTime = checkOut.getTime() - checkIn.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const calculateTotalGuests = () => {
    return guests.adults + guests.children + guests.infants;
  };

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 'dates':
        return checkInDate && checkOutDate && calculateTotalGuests() > 0;
      case 'establishment':
        return selectedEstablishment && selectedAccommodation;
      case 'guests':
        return clientInfo.firstName && clientInfo.lastName && clientInfo.email && clientInfo.phone;
      case 'confirmation':
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (!canProceedToNextStep()) return;

    const stepOrder: BookingStep[] = ['dates', 'establishment', 'guests', 'confirmation'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex < stepOrder.length - 1) {
      setCurrentStep(stepOrder[currentIndex + 1]);
    }
  };

  const handlePrevious = () => {
    const stepOrder: BookingStep[] = ['dates', 'establishment', 'guests', 'confirmation'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
    }
  };

  const handleConfirmBooking = async () => {
    setLoading(true);
    try {
      const bookingData = {
        establishmentId: selectedAccommodationData?.establishmentId,
        accommodationId: selectedAccommodation,
        checkInDate,
        checkOutDate,
        numberOfNights: calculateNights(),
        mainClient: clientInfo,
        guests: [], // Additional guests not implemented yet
        numberOfGuests: calculateTotalGuests(),
        specialRequests,
        arrivalTime,
        totalAmount: selectedAccommodationData ? selectedAccommodationData.pricing.basePrice * calculateNights() : 0,
        pricingDetails: selectedAccommodationData ? {
          basePrice: selectedAccommodationData.pricing.basePrice,
          seasonalPrice: selectedAccommodationData.pricing.seasonalPrice || selectedAccommodationData.pricing.basePrice,
          pricingMode: selectedAccommodationData.pricingMode,
          numberOfUnits: calculateNights(),
          totalAmount: selectedAccommodationData.pricing.basePrice * calculateNights()
        } : {}
      };

      const response = await fetch('/api/public/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });

      const data = await response.json();

      if (data.success) {
        // Redirect to confirmation page with booking code
        router.push(`/booking-confirmation/${data.data.bookingCode}`);
      } else {
        // Handle error
        console.error('Booking failed:', data.error);
        alert(`Erreur lors de la réservation: ${data.error.message}`);
      }
    } catch (error) {
      console.error('Booking error:', error);
      alert('Erreur lors de la réservation. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="mb-8">
      <div className="flex items-center justify-center space-x-4">
        {steps.map((step, index) => {
          const stepOrder: BookingStep[] = ['dates', 'establishment', 'guests', 'confirmation'];
          const currentIndex = stepOrder.indexOf(currentStep);
          const stepIndex = stepOrder.indexOf(step.key as BookingStep);
          const isCompleted = stepIndex < currentIndex;
          const isCurrent = step.key === currentStep;

          return (
            <div key={step.key} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                isCompleted
                  ? 'bg-green-600 border-green-600 text-white'
                  : isCurrent
                    ? 'border-amber-600 text-amber-600 bg-amber-50'
                    : 'border-gray-300 text-gray-400'
              }`}>
                {isCompleted ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span className="text-sm font-semibold">{index + 1}</span>
                )}
              </div>
              <span className={`ml-3 text-sm font-medium ${
                isCurrent ? 'text-amber-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
              }`}>
                {step.label}
              </span>
              {index < steps.length - 1 && (
                <div className={`w-12 h-0.5 mx-4 ${
                  isCompleted ? 'bg-green-600' : 'bg-gray-300'
                }`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderDatesStep = () => (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">{t.step1}</h3>

        <div className="space-y-6">
          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                {t.checkIn}
              </label>
              <input
                type="date"
                value={checkInDate}
                onChange={(e) => setCheckInDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 bg-white shadow-sm"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                {t.checkOut}
              </label>
              <input
                type="date"
                value={checkOutDate}
                onChange={(e) => setCheckOutDate(e.target.value)}
                min={checkInDate || new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 bg-white shadow-sm"
                required
              />
            </div>
          </div>

          {/* Guests */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900">{t.step3.toLowerCase()}</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  {t.adults}
                </label>
                <select
                  value={guests.adults}
                  onChange={(e) => setGuests(prev => ({ ...prev, adults: parseInt(e.target.value) }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 bg-white shadow-sm"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  {t.children} (2-12 ans)
                </label>
                <select
                  value={guests.children}
                  onChange={(e) => setGuests(prev => ({ ...prev, children: parseInt(e.target.value) }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 bg-white shadow-sm"
                >
                  {[0, 1, 2, 3, 4, 5, 6].map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  {t.infants} (0-2 ans)
                </label>
                <select
                  value={guests.infants}
                  onChange={(e) => setGuests(prev => ({ ...prev, infants: parseInt(e.target.value) }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 bg-white shadow-sm"
                >
                  {[0, 1, 2, 3, 4].map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="text-center text-gray-600">
              {calculateTotalGuests()} {t.totalGuests}
              {calculateNights() > 0 && (
                <span className="ml-2">
                  • {calculateNights()} {calculateNights() === 1 ? t.night : t.nights}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderEstablishmentStep = () => (
    <div className="max-w-7xl mx-auto">
      <EstablishmentSelector
        selectedEstablishment={selectedEstablishment}
        selectedAccommodation={selectedAccommodation}
        onEstablishmentChange={setSelectedEstablishment}
        onAccommodationChange={(id, data) => {
          setSelectedAccommodation(id);
          setSelectedAccommodationData(data);
        }}
        checkInDate={checkInDate}
        checkOutDate={checkOutDate}
        numberOfGuests={calculateTotalGuests()}
      />
    </div>
  );

  const renderGuestsStep = () => (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">{t.step3}</h3>

        <div className="space-y-8">
          <MainClientForm
            client={clientInfo}
            onChange={(client) => setClientInfo({ ...client, preferredLanguage: clientInfo.preferredLanguage })}
          />

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                {t.specialRequests} <span className="text-gray-500">({t.optional})</span>
              </label>
              <textarea
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                rows={4}
                placeholder="Demandes spéciales, allergies, préférences..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 bg-white shadow-sm resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                {t.arrivalTime} <span className="text-gray-500">({t.optional})</span>
              </label>
              <input
                type="time"
                value={arrivalTime}
                onChange={(e) => setArrivalTime(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 bg-white shadow-sm"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderConfirmationStep = () => (
    <div className="max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">{t.step4}</h3>

            <div className="space-y-6">
              {/* Booking Summary */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-100">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Récapitulatif de la réservation</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Dates:</span>
                    <span className="font-medium">
                      {new Date(checkInDate).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US')} - {new Date(checkOutDate).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Hébergement:</span>
                    <span className="font-medium">{selectedAccommodationData?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Établissement:</span>
                    <span className="font-medium">{establishmentName || selectedAccommodationData?.establishmentId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Voyageurs:</span>
                    <span className="font-medium">{calculateTotalGuests()} personnes</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Client:</span>
                    <span className="font-medium">{clientInfo.firstName} {clientInfo.lastName}</span>
                  </div>
                </div>
              </div>

              {/* Terms and Conditions */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Conditions de réservation</h4>
                <div className="space-y-3 text-sm text-gray-700">
                  <p>• L'annulation gratuite est possible jusqu'à 24h avant l'arrivée.</p>
                  <p>• Le paiement sera effectué à l'arrivée à l'établissement.</p>
                  <p>• Une pièce d'identité valide est requise lors de l'arrivée.</p>
                  <p>• L'établissement se réserve le droit de modifier les prix.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-6">
            {selectedAccommodationData && (
              <BookingSummary
                accommodation={selectedAccommodationData}
                checkInDate={checkInDate}
                checkOutDate={checkOutDate}
                numberOfNights={calculateNights()}
                numberOfGuests={calculateTotalGuests()}
                mainClient={clientInfo}
                totalAmount={selectedAccommodationData.pricing.basePrice * calculateNights()}
                specialRequests={specialRequests}
                arrivalTime={arrivalTime}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-amber-50 pt-32 pb-16">
      {/* Hero Section */}
      <section className="py-12 bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 text-white relative overflow-hidden mb-8">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full mb-6 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold mb-4">{t.title}</h1>
          <p className="text-xl text-amber-100 max-w-2xl mx-auto">{t.subtitle}</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {renderStepIndicator()}

        {/* Step Content */}
        <div className="mb-8">
          {currentStep === 'dates' && renderDatesStep()}
          {currentStep === 'establishment' && renderEstablishmentStep()}
          {currentStep === 'guests' && renderGuestsStep()}
          {currentStep === 'confirmation' && renderConfirmationStep()}
        </div>

        {/* Navigation */}
        <div className="flex justify-center space-x-4">
          {currentStep !== 'dates' && (
            <button
              onClick={handlePrevious}
              className="px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:border-amber-500 hover:text-amber-600 transition-all duration-200 font-medium"
            >
              {t.previous}
            </button>
          )}

          {currentStep !== 'confirmation' ? (
            <button
              onClick={handleNext}
              disabled={!canProceedToNextStep()}
              className="px-8 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-xl hover:from-amber-700 hover:to-amber-800 disabled:from-gray-400 disabled:via-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl font-medium disabled:transform-none transform hover:scale-105"
            >
              {t.next}
            </button>
          ) : (
            <button
              onClick={handleConfirmBooking}
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:via-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl font-medium disabled:transform-none transform hover:scale-105 flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>{loading ? t.bookingInProgress : t.confirmBooking}</span>
                </>
              ) : (
                <span>{t.confirmBooking}</span>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
