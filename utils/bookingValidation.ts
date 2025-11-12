import type { CompleteClientInfo, GuestInfo } from '@/types/guest.types';
import type { AccommodationResponse } from '@/types/accommodation.types';

export interface BookingValidationErrors {
  establishment?: string;
  accommodation?: string;
  dates?: string;
  guests?: string;
  mainClient?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    idNumber?: string;
  };
  guestList?: Array<{
    firstName?: string;
    lastName?: string;
    relationshipToMainClient?: string;
  }>;
}

export interface BookingValidationData {
  selectedEstablishment: string | null;
  selectedAccommodation: string | null;
  selectedAccommodationData: AccommodationResponse | null;
  checkInDate: string;
  checkOutDate: string;
  numberOfNights: number;
  numberOfGuests: number;
  mainClient: CompleteClientInfo;
  guests: GuestInfo[];
}

export function validateBookingStep1(data: BookingValidationData): BookingValidationErrors {
  const errors: BookingValidationErrors = {};

  // Validation de l'établissement
  if (!data.selectedEstablishment) {
    errors.establishment = 'Veuillez sélectionner un établissement';
  }

  // Validation de l'hébergement
  if (!data.selectedAccommodation) {
    errors.accommodation = 'Veuillez sélectionner un hébergement';
  }

  // Validation des dates
  if (!data.checkInDate || !data.checkOutDate) {
    errors.dates = 'Veuillez sélectionner les dates d\'arrivée et de départ';
  } else {
    const checkIn = new Date(data.checkInDate);
    const checkOut = new Date(data.checkOutDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (checkIn < today) {
      errors.dates = 'La date d\'arrivée ne peut pas être dans le passé';
    } else if (checkIn >= checkOut) {
      errors.dates = 'La date de départ doit être postérieure à la date d\'arrivée';
    } else if (data.numberOfNights <= 0) {
      errors.dates = 'La durée du séjour doit être d\'au moins une nuit';
    }
  }

  // Validation de la capacité
  if (data.selectedAccommodationData && data.numberOfGuests > data.selectedAccommodationData.capacity.maxGuests) {
    errors.guests = `Cet hébergement ne peut accueillir que ${data.selectedAccommodationData.capacity.maxGuests} personnes maximum`;
  }

  return errors;
}

export function validateBookingStep2(data: BookingValidationData): BookingValidationErrors {
  const errors: BookingValidationErrors = {};

  // Validation du client principal
  const mainClientErrors: BookingValidationErrors['mainClient'] = {};

  if (!data.mainClient.firstName?.trim()) {
    mainClientErrors.firstName = 'Le prénom est requis';
  }

  if (!data.mainClient.lastName?.trim()) {
    mainClientErrors.lastName = 'Le nom de famille est requis';
  }

  if (!data.mainClient.email?.trim()) {
    mainClientErrors.email = 'L\'adresse email est requise';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.mainClient.email)) {
    mainClientErrors.email = 'L\'adresse email n\'est pas valide';
  }

  if (!data.mainClient.phone?.trim()) {
    mainClientErrors.phone = 'Le numéro de téléphone est requis';
  } else if (!/^[\+]?[0-9\s\-\(\)]{8,}$/.test(data.mainClient.phone)) {
    mainClientErrors.phone = 'Le numéro de téléphone n\'est pas valide';
  }

  if (!data.mainClient.idNumber?.trim()) {
    mainClientErrors.idNumber = 'Le numéro de pièce d\'identité est requis';
  }

  if (Object.keys(mainClientErrors).length > 0) {
    errors.mainClient = mainClientErrors;
  }

  // Validation des invités
  if (data.guests.length > 0) {
    const guestErrors: BookingValidationErrors['guestList'] = [];

    data.guests.forEach((guest, index) => {
      const guestError: any = {};

      if (!guest.firstName?.trim()) {
        guestError.firstName = 'Le prénom est requis';
      }

      if (!guest.lastName?.trim()) {
        guestError.lastName = 'Le nom de famille est requis';
      }

      if (!guest.relationshipToMainClient?.trim()) {
        guestError.relationshipToMainClient = 'La relation avec le client principal est requise';
      }

      if (Object.keys(guestError).length > 0) {
        guestErrors[index] = guestError;
      }
    });

    if (guestErrors.length > 0) {
      errors.guestList = guestErrors;
    }
  }

  // Vérifier que le nombre total d'invités correspond
  const totalGuests = 1 + data.guests.length; // 1 pour le client principal + invités
  if (totalGuests !== data.numberOfGuests) {
    errors.guests = `Le nombre d'invités (${data.guests.length}) ne correspond pas au nombre total sélectionné (${data.numberOfGuests - 1} invités attendus)`;
  }

  return errors;
}

export function validateCompleteBooking(data: BookingValidationData): BookingValidationErrors {
  const step1Errors = validateBookingStep1(data);
  const step2Errors = validateBookingStep2(data);

  return {
    ...step1Errors,
    ...step2Errors
  };
}

export function hasValidationErrors(errors: BookingValidationErrors): boolean {
  return Object.keys(errors).length > 0;
}

export function getFirstValidationError(errors: BookingValidationErrors): string | null {
  if (errors.establishment) return errors.establishment;
  if (errors.accommodation) return errors.accommodation;
  if (errors.dates) return errors.dates;
  if (errors.guests) return errors.guests;
  
  if (errors.mainClient) {
    const mainClientErrors = errors.mainClient;
    if (mainClientErrors.firstName) return mainClientErrors.firstName;
    if (mainClientErrors.lastName) return mainClientErrors.lastName;
    if (mainClientErrors.email) return mainClientErrors.email;
    if (mainClientErrors.phone) return mainClientErrors.phone;
    if (mainClientErrors.idNumber) return mainClientErrors.idNumber;
  }

  if (errors.guestList && errors.guestList.length > 0) {
    const firstGuestError = errors.guestList.find(error => error && Object.keys(error).length > 0);
    if (firstGuestError) {
      const errorKey = Object.keys(firstGuestError)[0];
      return `Invité: ${firstGuestError[errorKey as keyof typeof firstGuestError]}`;
    }
  }

  return null;
}

// Utilitaires pour formater les données
export function formatBookingDataForAPI(data: BookingValidationData) {
  return {
    establishmentId: data.selectedEstablishment!,
    accommodationId: data.selectedAccommodation!,
    checkInDate: data.checkInDate,
    checkOutDate: data.checkOutDate,
    numberOfNights: data.numberOfNights,
    numberOfGuests: data.numberOfGuests,
    mainClient: {
      ...data.mainClient,
      email: data.mainClient.email.toLowerCase().trim(),
      phone: data.mainClient.phone.trim(),
      firstName: data.mainClient.firstName.trim(),
      lastName: data.mainClient.lastName.trim(),
    },
    guests: data.guests.map(guest => ({
      ...guest,
      firstName: guest.firstName.trim(),
      lastName: guest.lastName.trim(),
      relationshipToMainClient: guest.relationshipToMainClient?.trim() || 'accompagnant'
    })),
    pricingDetails: {
      basePrice: data.selectedAccommodationData!.pricing.basePrice,
      seasonalPrice: data.selectedAccommodationData!.pricing.seasonalPrice || data.selectedAccommodationData!.pricing.basePrice,
      pricingMode: data.selectedAccommodationData!.pricingMode,
      numberOfUnits: data.numberOfNights,
      totalAmount: (data.selectedAccommodationData!.pricing.seasonalPrice || data.selectedAccommodationData!.pricing.basePrice) * data.numberOfNights
    }
  };
}