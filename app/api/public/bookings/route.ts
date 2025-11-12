import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import BookingModel from '@/models/Booking.model';
import AccommodationModel from '@/models/Accommodation.model';
import EstablishmentModel from '@/models/Establishment.model';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const {
      establishmentId,
      accommodationId,
      checkInDate,
      checkOutDate,
      numberOfNights,
      mainClient,
      guests,
      numberOfGuests,
      specialRequests,
      arrivalTime,
      totalAmount,
      pricingDetails,
    } = body;

    // Validation
    if (!establishmentId || !accommodationId || !checkInDate || !checkOutDate || !mainClient) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Informations de réservation incomplètes',
          },
        },
        { status: 400 }
      );
    }

    // Vérifier que l'établissement existe
    const establishment = await EstablishmentModel.findById(establishmentId);
    if (!establishment) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Établissement non trouvé',
          },
        },
        { status: 404 }
      );
    }

    // Vérifier que l'hébergement existe et appartient à l'établissement
    const accommodation = await AccommodationModel.findOne({
      _id: accommodationId,
      establishmentId: establishmentId
    });
    if (!accommodation) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Hébergement non trouvé dans cet établissement',
          },
        },
        { status: 404 }
      );
    }

    // Vérifier que l'hébergement est disponible
    if (accommodation.status !== 'available') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_AVAILABLE',
            message: 'Cet hébergement n\'est pas disponible actuellement',
          },
        },
        { status: 400 }
      );
    }

    // Vérifier la disponibilité pour les dates
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);

    // Vérifier que les dates sont valides
    if (checkIn >= checkOut) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_DATES',
            message: 'La date de départ doit être postérieure à la date d\'arrivée',
          },
        },
        { status: 400 }
      );
    }

    // Vérifier que la date d'arrivée n'est pas dans le passé
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (checkIn < today) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_DATES',
            message: 'La date d\'arrivée ne peut pas être dans le passé',
          },
        },
        { status: 400 }
      );
    }

    // Vérifier la capacité
    if (numberOfGuests > accommodation.capacity.maxGuests) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CAPACITY_EXCEEDED',
            message: `Cet hébergement ne peut accueillir que ${accommodation.capacity.maxGuests} personnes maximum`,
          },
        },
        { status: 400 }
      );
    }

    // Vérifier les conflits de réservation
    const conflictingBooking = await BookingModel.findOne({
      accommodationId: accommodationId,
      status: { $in: ['pending', 'confirmed', 'checked_in'] },
      $or: [
        {
          checkInDate: { $lte: checkOut },
          checkOutDate: { $gte: checkIn },
        },
      ],
    });

    if (conflictingBooking) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_AVAILABLE',
            message: "Cet hébergement n'est pas disponible pour les dates sélectionnées",
          },
        },
        { status: 400 }
      );
    }

    // Générer un code de réservation unique
    const generateBookingCode = () => {
      const prefix = establishment.name.substring(0, 3).toUpperCase();
      const timestamp = Date.now().toString().slice(-6);
      const random = Math.random().toString(36).substring(2, 5).toUpperCase();
      return `${prefix}${timestamp}${random}`;
    };

    // Préparer les notes détaillées
    const detailedNotes = [
      `Client: ${mainClient.firstName} ${mainClient.lastName}`,
      `Type: ${mainClient.customerType || 'individual'}`,
      mainClient.companyName ? `Entreprise: ${mainClient.companyName}` : '',
      mainClient.loyaltyCardNumber ? `Carte fidélité: ${mainClient.loyaltyCardNumber}` : '',
      `Genre: ${mainClient.gender || 'non-spécifié'}, Nationalité: ${mainClient.nationality || 'non-spécifiée'}`,
      `Adresse: ${mainClient.address || ''}, ${mainClient.city || ''}, ${mainClient.country || ''}`,
      mainClient.preferredLanguage ? `Langue: ${mainClient.preferredLanguage}` : '',
      arrivalTime ? `Heure d'arrivée: ${arrivalTime}` : '',
      guests && guests.length > 0 ? `Invités: ${guests.length}` : '',
      guests && guests.length > 0 ? guests.map((g: any, i: number) =>
        `Invité ${i + 1}: ${g.firstName} ${g.lastName} (${g.relationshipToMainClient || 'accompagnant'}${g.isMinor ? ', mineur' : ''})`
      ).join('; ') : '',
      mainClient.notes ? `Notes client: ${mainClient.notes}` : '',
      specialRequests ? `Demandes spéciales: ${specialRequests}` : '',
    ].filter(Boolean).join(' | ');

    // Créer la réservation avec la structure correcte du modèle
    const bookingData = {
      bookingCode: generateBookingCode(),
      establishmentId: establishmentId,
      accommodationId: accommodationId,
      clientInfo: {
        firstName: mainClient.firstName,
        lastName: mainClient.lastName,
        email: mainClient.email,
        phone: mainClient.phone,
        idNumber: mainClient.idNumber || '',
        address: mainClient.address || '',
        city: mainClient.city || '',
        country: mainClient.country || '',
        nationality: mainClient.nationality || '',
        gender: mainClient.gender || 'other',
        dateOfBirth: mainClient.dateOfBirth || null,
        customerType: mainClient.customerType || 'individual',
        companyName: mainClient.companyName || '',
        loyaltyCardNumber: mainClient.loyaltyCardNumber || '',
        preferredLanguage: mainClient.preferredLanguage || 'fr',
        notes: mainClient.notes || ''
      },
      bookingType: 'online',
      checkInDate: checkIn,
      checkOutDate: checkOut,
      numberOfGuests: numberOfGuests || 1,
      arrivalTime: arrivalTime || '',
      guests: guests || [],
      specialRequests: specialRequests || '',
      pricingDetails: pricingDetails || {
        basePrice: accommodation.pricing.basePrice,
        seasonalPrice: accommodation.pricing.seasonalPrice || accommodation.pricing.basePrice,
        pricingMode: accommodation.pricingMode,
        numberOfUnits: numberOfNights,
        totalAmount: totalAmount || (accommodation.pricing.basePrice * numberOfNights)
      },
      totalAmount: totalAmount || (accommodation.pricing.basePrice * numberOfNights),
      status: 'pending',
      paymentStatus: 'unpaid',
      notes: detailedNotes,
      source: 'website',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const booking = await BookingModel.create(bookingData);

    return NextResponse.json({
      success: true,
      data: {
        id: booking._id.toString(),
        bookingCode: booking.bookingCode,
        status: booking.status,
        totalAmount: booking.totalAmount,
        checkInDate: booking.checkInDate,
        checkOutDate: booking.checkOutDate,
        accommodation: {
          id: accommodation._id.toString(),
          name: accommodation.name,
          type: accommodation.type
        },
        establishment: {
          id: establishment._id.toString(),
          name: establishment.name,
          location: establishment.location
        },
        message: 'Réservation créée avec succès. Vous recevrez une confirmation par email.',
      },
    });
  } catch (error: any) {
    console.error('Error creating booking:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Erreur lors de la création de la réservation',
        },
      },
      { status: 500 }
    );
  }
}
