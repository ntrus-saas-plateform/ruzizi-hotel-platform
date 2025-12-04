'use client';

import { useState, useEffect, Suspense, lazy, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// Lazy load components for better performance
const EstablishmentSelector = lazy(() => import('@/components/booking/EstablishmentSelector'));
const MainClientForm = lazy(() => import('@/components/booking/MainClientForm'));
const GuestForm = lazy(() => import('@/components/booking/GuestForm'));
const BookingSummary = lazy(() => import('@/components/booking/BookingSummary'));

import type { AccommodationResponse } from '@/types/accommodation.types';
import type { CompleteClientInfo, Gender, IDType, CustomerType } from '@/types/guest.types';

type BookingStep = 'dates' | 'establishment' | 'guests' | 'payment' | 'confirmation';

interface GuestInfo {
  adults: number;
  children: number;
  infants: number;
}

interface ClientInfo extends CompleteClientInfo {
  preferredLanguage: 'fr' | 'en';
}

function BookingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [language, setLanguage] = useState('fr');
  const [currentStep, setCurrentStep] = useState<BookingStep>('dates');
  const [loading, setLoading] = useState(false);
  const [processingUrlParams, setProcessingUrlParams] = useState(false);

  // Step 1: Dates and guests
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [guests, setGuests] = useState<GuestInfo>({ adults: 1, children: 0, infants: 0 });

  // Step 2: Establishment and accommodation
  const [selectedEstablishment, setSelectedEstablishment] = useState<string | null>(null);
  const [selectedAccommodation, setSelectedAccommodation] = useState<string | null>(null);
  const [selectedAccommodationData, setSelectedAccommodationData] =
    useState<AccommodationResponse | null>(null);
  const [establishmentName, setEstablishmentName] = useState('');

  // Step 3: Guest details
  const [additionalGuests, setAdditionalGuests] = useState<any[]>([]);
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

  // Step 4: Payment details
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [billingAddress, setBillingAddress] = useState('');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as 'fr' | 'en' | null;
    if (savedLanguage) {
      setLanguage(savedLanguage);
    }
  }, []);

  // Memoized function to calculate total guests
  const calculateTotalGuests = useCallback(() => {
    return guests.adults + guests.children + guests.infants;
  }, [guests.adults, guests.children, guests.infants]);

  // Handle URL parameters for pre-selection
  useEffect(() => {
    const establishmentId = searchParams.get('establishment');
    const accommodationId = searchParams.get('accommodation');

    const handleUrlParameters = async () => {
      setProcessingUrlParams(true);

      try {
        // If we have both establishment and accommodation IDs
        if (establishmentId && accommodationId) {
          setSelectedEstablishment(establishmentId);
          setSelectedAccommodation(accommodationId);
          
          try {
            // Fetch accommodation data
            const accommodationResponse = await fetch(`/api/public/accommodations/${accommodationId}`);
            const accommodationData = await accommodationResponse.json();
            
            if (accommodationData.success) {
              setSelectedAccommodationData(accommodationData.data);
              
              // Verify the accommodation belongs to the specified establishment
              if (accommodationData.data.establishmentId === establishmentId) {
                // Move to establishment step if dates and guests are set
                if (checkInDate && checkOutDate && calculateTotalGuests() > 0) {
                  setCurrentStep('establishment');
                }
              } else {
                console.warn('Accommodation does not belong to the specified establishment');
                // Optionally clear the establishment ID or show an error
              }
            }
          } catch (error) {
            console.error('Error fetching accommodation:', error);
          }
        } 
        // If we only have establishment ID
        else if (establishmentId) {
          setSelectedEstablishment(establishmentId);
          // If we have dates and guests, move to establishment step
          if (checkInDate && checkOutDate && calculateTotalGuests() > 0) {
            setCurrentStep('establishment');
          }
        }
        // If we only have accommodation ID
        else if (accommodationId) {
          try {
            const accommodationResponse = await fetch(`/api/public/accommodations/${accommodationId}`);
            const accommodationData = await accommodationResponse.json();
            
            if (accommodationData.success) {
              setSelectedAccommodationData(accommodationData.data);
              setSelectedEstablishment(accommodationData.data.establishmentId);
              setSelectedAccommodation(accommodationId);
              
              // Move to establishment step if dates and guests are set
              if (checkInDate && checkOutDate && calculateTotalGuests() > 0) {
                setCurrentStep('establishment');
              }
            }
          } catch (error) {
            console.error('Error fetching accommodation:', error);
          }
        }
      } finally {
        setProcessingUrlParams(false);
      }
    };

    handleUrlParameters();
  }, [searchParams, checkInDate, checkOutDate, calculateTotalGuests]);

  useEffect(() => {
    if (selectedEstablishment) {
      let isMounted = true;
      
      fetch(`/api/public/establishments/${selectedEstablishment}`)
        .then((res) => res.json())
        .then((data) => {
          if (isMounted && data.success) {
            setEstablishmentName(data.data.name);
          }
        })
        .catch((error) => console.error('Error fetching establishment:', error));

      return () => {
        isMounted = false;
      };
    } else {
      setEstablishmentName('');
    }
  }, [selectedEstablishment]);

  const content = {
    fr: {
      title: 'Réserver votre séjour',
      subtitle: 'Réservez facilement votre hébergement idéal',
      step1: 'Dates et voyageurs',
      step2: "Sélection d'hébergement",
      step3: 'Informations voyageurs',
      step4: 'Paiement',
      step5: 'Confirmation',
      checkIn: "Date d'arrivée",
      checkOut: 'Date de départ',
      adults: 'Adultes',
      children: 'Enfants',
      infants: 'Bébés',
      next: 'Suivant',
      previous: 'Précédent',
      confirmBooking: 'Confirmer la réservation',
      bookingInProgress: 'Réservation en cours...',
      selectDates: 'Veuillez sélectionner vos dates de séjour',
      selectAccommodation: 'Veuillez sélectionner un hébergement',
      fillGuestInfo: 'Veuillez remplir vos informations',
      specialRequests: 'Demandes spéciales',
      arrivalTime: "Heure d'arrivée estimée",
      optional: 'optionnel',
      totalGuests: 'voyageurs au total',
      night: 'nuit',
      nights: 'nuits',
      processing: 'Traitement en cours...',
      loadingAccommodations: 'Chargement des hébergements...',
    },
    en: {
      title: 'Book your stay',
      subtitle: 'Easily book your ideal accommodation',
      step1: 'Dates and travelers',
      step2: 'Accommodation selection',
      step3: 'Traveler information',
      step4: 'Payment',
      step5: 'Confirmation',
      checkIn: 'Check-in date',
      checkOut: 'Check-out date',
      adults: 'Adults',
      children: 'Children',
      infants: 'Infants',
      next: 'Next',
      previous: 'Previous',
      confirmBooking: 'Confirm booking',
      bookingInProgress: 'Booking in progress...',
      selectDates: 'Please select your stay dates',
      selectAccommodation: 'Please select an accommodation',
      fillGuestInfo: 'Please fill in your information',
      specialRequests: 'Special requests',
      arrivalTime: 'Estimated arrival time',
      optional: 'optional',
      totalGuests: 'total travelers',
      night: 'night',
      nights: 'nights',
      processing: 'Processing...',
      loadingAccommodations: 'Loading accommodations...',
    },
  };

  const t = content[language as keyof typeof content];

  const steps = [
    { key: 'dates', label: t.step1 },
    { key: 'establishment', label: t.step2 },
    { key: 'guests', label: t.step3 },
    { key: 'payment', label: t.step4 },
    { key: 'confirmation', label: t.step5 },
  ];

  const calculateNights = () => {
    if (!checkInDate || !checkOutDate) return 0;
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const diffTime = checkOut.getTime() - checkIn.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 'dates':
        return checkInDate && checkOutDate && calculateTotalGuests() > 0;
      case 'establishment':
        return selectedEstablishment && selectedAccommodation && selectedAccommodationData;
      case 'guests':
        return clientInfo.firstName && clientInfo.lastName && clientInfo.email && clientInfo.phone;
      case 'payment':
        return (
          paymentMethod &&
          (paymentMethod !== 'card' || (cardNumber && cardExpiry && cardCvv && cardName))
        );
      case 'confirmation':
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (!canProceedToNextStep()) return;

    const stepOrder: BookingStep[] = [
      'dates',
      'establishment',
      'guests',
      'payment',
      'confirmation',
    ];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex < stepOrder.length - 1) {
      setCurrentStep(stepOrder[currentIndex + 1]);
    }
  };

  const handlePrevious = () => {
    const stepOrder: BookingStep[] = [
      'dates',
      'establishment',
      'guests',
      'payment',
      'confirmation',
    ];
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
        guests: additionalGuests,
        numberOfGuests: calculateTotalGuests(),
        specialRequests,
        arrivalTime,
        paymentMethod,
        paymentDetails:
          paymentMethod === 'card'
            ? {
                cardNumber: cardNumber.slice(-4), // Only last 4 digits for security
                cardName,
                cardExpiry,
                billingAddress,
              }
            : undefined,
        totalAmount: selectedAccommodationData
          ? selectedAccommodationData.pricing.basePrice * calculateNights()
          : 0,
        pricingDetails: selectedAccommodationData
          ? {
              basePrice: selectedAccommodationData.pricing.basePrice,
              seasonalPrice:
                selectedAccommodationData.pricing.seasonalPrice ||
                selectedAccommodationData.pricing.basePrice,
              pricingMode: selectedAccommodationData.pricingMode,
              numberOfUnits: calculateNights(),
              totalAmount: selectedAccommodationData.pricing.basePrice * calculateNights(),
            }
          : {},
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
      <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
        {steps.map((step, index) => {
          const stepOrder: BookingStep[] = [
            'dates',
            'establishment',
            'guests',
            'payment',
            'confirmation',
          ];
          const currentIndex = stepOrder.indexOf(currentStep);
          const stepIndex = stepOrder.indexOf(step.key as BookingStep);
          const isCompleted = stepIndex < currentIndex;
          const isCurrent = step.key === currentStep;

          return (
            <div key={step.key} className="flex flex-col sm:flex-row items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                  isCompleted
                    ? 'bg-green-700 border-green-700 text-luxury-cream'
                    : isCurrent
                      ? 'border-luxury-gold text-luxury-gold bg-luxury-cream'
                      : 'border-[hsl(var(--color-luxury-text))]/50 text-[hsl(var(--color-luxury-text))]/60'
                }`}
              >
                {isCompleted ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <span className="text-sm font-semibold">{index + 1}</span>
                )}
              </div>
              <span
                className={`mt-2 sm:mt-0 sm:ml-3 text-sm font-medium text-center sm:text-left ${
                  isCurrent
                    ? 'text-luxury-gold'
                    : isCompleted
                      ? 'text-green-700'
                      : 'text-[hsl(var(--color-luxury-text))]/60'
                }`}
              >
                {step.label}
              </span>
              {index < steps.length - 1 && (
                <div
                  className={`w-0.5 h-8 sm:w-12 sm:h-0.5 mx-4 sm:mx-4 ${
                    isCompleted ? 'bg-green-600' : 'bg-[hsl(var(--color-luxury-text))]/50'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderDatesStep = () => (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white backdrop-blur-sm rounded-2xl shadow-card-luxury border border-[hsl(var(--color-luxury-gold))]/20 p-8">
        <h3 className="text-2xl font-bold text-luxury-dark mb-6 text-center">{t.step1}</h3>

        <div className="space-y-6">
          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-luxury-text">{t.checkIn}</label>
              <input
                type="date"
                value={checkInDate}
                onChange={(e) => setCheckInDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[hsl(var(--color-luxury-gold))]/90 focus:border-[hsl(var(--color-luxury-gold))]/90 transition-all duration-200 bg-white shadow-sm"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-luxury-text">{t.checkOut}</label>
              <input
                type="date"
                value={checkOutDate}
                onChange={(e) => setCheckOutDate(e.target.value)}
                min={checkInDate || new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[hsl(var(--color-luxury-gold))]/90 focus:border-[hsl(var(--color-luxury-gold))]/90 transition-all duration-200 bg-white shadow-sm"
                required
              />
            </div>
          </div>

          {/* Guests */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-luxury-dark">{t.step3.toLowerCase()}</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-luxury-text">{t.adults}</label>
                <select
                  value={guests.adults}
                  onChange={(e) =>
                    setGuests((prev) => ({ ...prev, adults: parseInt(e.target.value) }))
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[hsl(var(--color-luxury-gold))]/90 focus:border-[hsl(var(--color-luxury-gold))]/90 transition-all duration-200 bg-white shadow-sm"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <option key={num} value={num}>
                      {num}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-luxury-text">
                  {t.children} (2-12 ans)
                </label>
                <select
                  value={guests.children}
                  onChange={(e) =>
                    setGuests((prev) => ({ ...prev, children: parseInt(e.target.value) }))
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[hsl(var(--color-luxury-gold))]/90 focus:border-[hsl(var(--color-luxury-gold))]/90 transition-all duration-200 bg-white shadow-sm"
                >
                  {[0, 1, 2, 3, 4, 5, 6].map((num) => (
                    <option key={num} value={num}>
                      {num}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-luxury-text">
                  {t.infants} (0-2 ans)
                </label>
                <select
                  value={guests.infants}
                  onChange={(e) =>
                    setGuests((prev) => ({ ...prev, infants: parseInt(e.target.value) }))
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[hsl(var(--color-luxury-gold))]/90 focus:border-[hsl(var(--color-luxury-gold))]/90 transition-all duration-200 bg-white shadow-sm"
                >
                  {[0, 1, 2, 3, 4].map((num) => (
                    <option key={num} value={num}>
                      {num}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="text-center text-luxury-text">
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

  const renderEstablishmentStep = () => {
    if (processingUrlParams) {
      return (
        <div className="max-w-7xl mx-auto flex justify-center items-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-luxury-gold mx-auto mb-4"></div>
            <span className="text-luxury-text">{t.loadingAccommodations}</span>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-7xl mx-auto">
        <Suspense
          fallback={
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-luxury-gold"></div>
            </div>
          }
        >
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
        </Suspense>
      </div>
    );
  };

  const renderGuestsStep = () => (
    <div className="max-w-7xl mx-auto">
      <div className="">
        <h3 className="text-2xl font-bold text-luxury-dark mb-6 text-center">{t.step3}</h3>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <Suspense
            fallback={
              <div className="lg:col-span-3 flex justify-center items-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-luxury-gold"></div>
              </div>
            }
          >
            <MainClientForm
              client={clientInfo}
              onChange={(client) =>
                setClientInfo({ ...client, preferredLanguage: clientInfo.preferredLanguage })
              }
            />
          </Suspense>
          {/* Additional Guests */}
          <div className="lg:col-span-2">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-lg font-semibold text-luxury-dark">Invités supplémentaires</h4>
                <button
                  type="button"
                  onClick={() =>
                    setAdditionalGuests([
                      ...additionalGuests,
                      {
                        firstName: '',
                        lastName: '',
                        gender: 'M',
                        dateOfBirth: new Date('1990-01-01'),
                        nationality: '',
                        idType: 'passport',
                        idNumber: '',
                        relationshipToMainClient: '',
                        isMinor: false,
                      },
                    ])
                  }
                  className="px-4 py-2 bg-luxury-gold text-luxury-cream rounded-lg transition-colors"
                >
                  + Ajouter un invité
                </button>
              </div>

              {additionalGuests.map((guest, index) => (
                <Suspense
                  key={index}
                  fallback={<div className="animate-pulse h-32 bg-gray-200 rounded"></div>}
                >
                  <GuestForm
                    guest={guest}
                    index={index}
                    onChange={(updatedGuest) => {
                      const newGuests = [...additionalGuests];
                      newGuests[index] = updatedGuest;
                      setAdditionalGuests(newGuests);
                    }}
                    onRemove={() => {
                      setAdditionalGuests(additionalGuests.filter((_, i) => i !== index));
                    }}
                  />
                </Suspense>
              ))}
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-luxury-text">
                  {t.specialRequests} <span className="text-gray-500">({t.optional})</span>
                </label>
                <textarea
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  rows={4}
                  placeholder="Demandes spéciales, allergies, préférences..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[hsl(var(--color-luxury-gold))]/90 focus:border-[hsl(var(--color-luxury-gold))]/90 transition-all duration-200 bg-white shadow-sm resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-luxury-text">
                  {t.arrivalTime} <span className="text-gray-500">({t.optional})</span>
                </label>
                <input
                  type="time"
                  value={arrivalTime}
                  onChange={(e) => setArrivalTime(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[hsl(var(--color-luxury-gold))]/90 focus:border-[hsl(var(--color-luxury-gold))]/90 transition-all duration-200 bg-white shadow-sm"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPaymentStep = () => (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white backdrop-blur-sm rounded-2xl shadow-card-luxury border border-white/20 p-8">
        <h3 className="text-2xl font-bold text-luxury-dark mb-6 text-center">{t.step4}</h3>

        <div className="space-y-6">
          {/* Payment Method */}
          <div className="space-y-4">
            <label className="block text-sm font-semibold text-luxury-text">
              Méthode de paiement <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label
                className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${paymentMethod === 'card' ? 'border-luxury-gold bg-luxury-cream' : 'border-gray-300 hover:border-amber-300'}`}
              >
                <input
                  type="radio"
                  value="card"
                  checked={paymentMethod === 'card'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="sr-only"
                />
                <div className="flex items-center space-x-3">
                  <svg
                    className="w-6 h-6 text-luxury-text"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                    />
                  </svg>
                  <span className="font-medium">Carte de crédit</span>
                </div>
              </label>
              <label
                className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${paymentMethod === 'paypal' ? 'border-luxury-gold bg-luxury-cream' : 'border-gray-300 hover:border-amber-300'}`}
              >
                <input
                  type="radio"
                  value="paypal"
                  checked={paymentMethod === 'paypal'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="sr-only"
                />
                <div className="flex items-center space-x-3">
                  <svg className="w-6 h-6 text-luxury-gold" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M7.076 21.337H2.47a.641.641 0 01-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.622 1.562 1.035.992 1.449 2.467 1.149 4.162a6.508 6.508 0 01-2.919 4.746c1.043.411 1.953.971 2.577 1.724 1.214 1.46 1.657 3.559.829 5.51C19.712 21.247 16.086 22 12.345 22H7.076c-.472 0-.924-.344-.948-.812l-.003-.001z" />
                  </svg>
                  <span className="font-medium">PayPal</span>
                </div>
              </label>
              <label
                className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${paymentMethod === 'cash' ? 'border-luxury-gold bg-luxury-cream' : 'border-gray-300 hover:border-amber-300'}`}
              >
                <input
                  type="radio"
                  value="cash"
                  checked={paymentMethod === 'cash'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="sr-only"
                />
                <div className="flex items-center space-x-3">
                  <svg
                    className="w-6 h-6 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="font-medium">Espèces à l'arrivée</span>
                </div>
              </label>
            </div>
          </div>

          {/* Card Details */}
          {paymentMethod === 'card' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-luxury-text">
                    Numéro de carte <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16))}
                    placeholder="1234 5678 9012 3456"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[hsl(var(--color-luxury-gold))]/90 focus:border-[hsl(var(--color-luxury-gold))]/90 transition-all duration-200 bg-white shadow-sm"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-luxury-text">
                    Nom sur la carte <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="JOHN DOE"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[hsl(var(--color-luxury-gold))]/90 focus:border-[hsl(var(--color-luxury-gold))]/90 transition-all duration-200 bg-white shadow-sm"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-luxury-text">
                    Date d'expiration <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={cardExpiry}
                    onChange={(e) =>
                      setCardExpiry(
                        e.target.value
                          .replace(/\D/g, '')
                          .slice(0, 4)
                          .replace(/(\d{2})(\d{2})/, '$1/$2')
                      )
                    }
                    placeholder="MM/YY"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[hsl(var(--color-luxury-gold))]/90 focus:border-[hsl(var(--color-luxury-gold))]/90 transition-all duration-200 bg-white shadow-sm"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-luxury-text">
                    CVV <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="123"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[hsl(var(--color-luxury-gold))]/90 focus:border-[hsl(var(--color-luxury-gold))]/90 transition-all duration-200 bg-white shadow-sm"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-luxury-text">
                  Adresse de facturation
                </label>
                <input
                  type="text"
                  value={billingAddress}
                  onChange={(e) => setBillingAddress(e.target.value)}
                  placeholder="Adresse complète"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[hsl(var(--color-luxury-gold))]/90 focus:border-[hsl(var(--color-luxury-gold))]/90 transition-all duration-200 bg-white shadow-sm"
                />
              </div>
            </div>
          )}

          {/* Security Notice */}
          <div className="bg-luxury-cream border border-[hsl(var(--color-luxury-gold))]/20 rounded-xl p-6">
            <div className="flex items-start space-x-3">
              <svg
                className="w-6 h-6 text-luxury-gold flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <div>
                <h4 className="text-sm font-semibold text-luxury-dark mb-1">Paiement sécurisé</h4>
                <p className="text-sm text-luxury-text">
                  Vos informations de paiement sont chiffrées et sécurisées. Nous n'enregistrons pas
                  les détails de votre carte.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderConfirmationStep = () => (
    <div className="max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <div className="">
            <h3 className="text-2xl font-bold text-luxury-dark mb-6">{t.step5}</h3>

            <div className="space-y-6">
              {/* Booking Summary */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-100">
                <h4 className="text-lg font-semibold text-luxury-dark mb-4">
                  Récapitulatif de la réservation
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-luxury-text">Dates:</span>
                    <span className="font-medium">
                      {new Date(checkInDate).toLocaleDateString(
                        language === 'fr' ? 'fr-FR' : 'en-US'
                      )}{' '}
                      -{' '}
                      {new Date(checkOutDate).toLocaleDateString(
                        language === 'fr' ? 'fr-FR' : 'en-US'
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-luxury-text">Hébergement:</span>
                    <span className="font-medium">{selectedAccommodationData?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-luxury-text">Établissement:</span>
                    <span className="font-medium">
                      {establishmentName || selectedAccommodationData?.establishmentId}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-luxury-text">Voyageurs:</span>
                    <span className="font-medium">{calculateTotalGuests()} personnes</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-luxury-text">Client:</span>
                    <span className="font-medium">
                      {clientInfo.firstName} {clientInfo.lastName}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
                <h4 className="text-lg font-semibold text-luxury-dark mb-4 flex items-center">
                  <svg
                    className="w-5 h-5 mr-2 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                    />
                  </svg>
                  Informations de paiement
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-luxury-text">Méthode:</span>
                    <span className="font-medium">
                      {paymentMethod === 'card'
                        ? 'Carte de crédit'
                        : paymentMethod === 'paypal'
                          ? 'PayPal'
                          : "Espèces à l'arrivée"}
                    </span>
                  </div>
                  {paymentMethod === 'card' && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-luxury-text">Carte:</span>
                        <span className="font-medium">**** **** **** {cardNumber.slice(-4)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-luxury-text">Titulaire:</span>
                        <span className="font-medium">{cardName}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Special Requests */}
              {specialRequests && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
                  <h4 className="text-lg font-semibold text-luxury-dark mb-4 flex items-center">
                    <svg
                      className="w-5 h-5 mr-2 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                      />
                    </svg>
                    Demandes spéciales
                  </h4>
                  <p className="text-luxury-text whitespace-pre-wrap">{specialRequests}</p>
                </div>
              )}

              {/* Terms and Conditions */}
              <div className="bg-luxury-cream rounded-xl p-6">
                <h4 className="text-lg font-semibold text-luxury-dark mb-4">
                  Conditions de réservation
                </h4>
                <div className="space-y-3 text-sm text-luxury-text">
                  <p>• L'annulation gratuite est possible jusqu'à 24h avant l'arrivée.</p>
                  <p>• Le paiement sera effectué à l'arrivée à l'établissement.</p>
                  <p>• Une pièce d'identité valide est requise lors de l'arrivée.</p>
                  <p>• L'établissement se réserve le droit de modifier les prix.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="lg:sticky lg:top-6">
            {selectedAccommodationData && (
              <Suspense
                fallback={
                  <div className="bg-white rounded-xl p-6 shadow-lg">
                    <div className="animate-pulse space-y-4">
                      <div className="h-4 bg-[hsl(var(--color-luxury-text))]/5 rounded w-3/4"></div>
                      <div className="h-4 bg-[hsl(var(--color-luxury-text))]/5 rounded w-1/2"></div>
                      <div className="h-4 bg-[hsl(var(--color-luxury-text))]/5 rounded w-2/3"></div>
                    </div>
                  </div>
                }
              >
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
              </Suspense>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pt-48 pb-20">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold bg-luxury-dark bg-clip-text text-transparent mb-4">
          {t.title}
        </h2>
        <p className="text-xl text-luxury-text">{t.subtitle}</p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {renderStepIndicator()}

        {/* Step Content */}
        <div className="mb-8">
          {currentStep === 'dates' && renderDatesStep()}
          {currentStep === 'establishment' && renderEstablishmentStep()}
          {currentStep === 'guests' && renderGuestsStep()}
          {currentStep === 'payment' && renderPaymentStep()}
          {currentStep === 'confirmation' && renderConfirmationStep()}
        </div>

        {/* Navigation */}
        <div className="flex justify-center space-x-4">
          {currentStep !== 'dates' && (
            <button
              onClick={handlePrevious}
              className="px-8 py-3 border-2 border-[hsl(var(--color-luxury-text))]/20 text-luxury-text rounded-xl hover:border-[hsl(var(--color-luxury-gold))] hover:text-[hsl(var(--color-luxury-gold))] transition-all duration-200 font-medium"
            >
              {t.previous}
            </button>
          )}

          {currentStep !== 'confirmation' ? (
            <button
              onClick={handleNext}
              disabled={!canProceedToNextStep()}
              className="px-8 py-3 bg-gradient-luxury text-luxury-cream rounded-xl hover:from-amber-700 hover:to-amber-800 disabled:from-gray-400 disabled:via-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl font-medium disabled:transform-none transform hover:scale-105"
            >
              {t.next}
            </button>
          ) : (
            <button
              onClick={handleConfirmBooking}
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 text-luxury-cream rounded-xl hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:via-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl font-medium disabled:transform-none transform hover:scale-105 flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <svg
                    className="w-5 h-5 animate-spin"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
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

export default function BookingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-amber-50 pt-32 pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin mx-auto"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 bg-luxury-gold rounded-full animate-pulse"></div>
                  </div>
                </div>
                <p className="mt-4 text-luxury-text">Chargement...</p>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <BookingPageContent />
    </Suspense>
  );
}