import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { BookingModel } from '@/models/Booking.model';
import { AccommodationModel } from '@/models/Accommodation.model';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const {
      accommodationId,
      checkInDate,
      checkOutDate,
      numberOfNights,
      mainClient,
      guests,
      numberOfGuests,
      specialRequests,
      arrivalTime,
    } = body;

    // Validation
    if (!accommodationId || !checkInDate || !checkOutDate || !mainClient) {
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

    // Vérifier que l'hébergement existe
    const accommodation = await AccommodationModel.findById(accommodationId);
    if (!accommodation) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Hébergement non trouvé',
          },
        },
        { status: 404 }
      );
    }

    // Vérifier la disponibilité
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);

    const conflictingBooking = await BookingModel.findOne({
      accommodationId: accommodationId,
      status: { $in: ['pending', 'confirmed'] },
      $or: [
        {
          checkIn: { $lte: checkOut },
          checkOut: { $gte: checkIn },
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

    // Calculer le prix total
    const basePrice = accommodation.pricing.basePrice;
    const subtotal = basePrice * numberOfNights;
    const total = subtotal;

    // Préparer les notes détaillées
    const detailedNotes = [
      `Client: ${mainClient.firstName} ${mainClient.lastName}`,
      `Type: ${mainClient.customerType}`,
      mainClient.companyName ? `Entreprise: ${mainClient.companyName}` : '',
      mainClient.loyaltyCardNumber ? `Carte fidélité: ${mainClient.loyaltyCardNumber}` : '',
      `Genre: ${mainClient.gender}, Nationalité: ${mainClient.nationality}`,
      `Adresse: ${mainClient.address}, ${mainClient.city}, ${mainClient.country}`,
      mainClient.preferredLanguage ? `Langue: ${mainClient.preferredLanguage}` : '',
      arrivalTime ? `Heure d'arrivée: ${arrivalTime}` : '',
      guests && guests.length > 0 ? `Invités: ${guests.length}` : '',
      guests && guests.length > 0 ? guests.map((g: any, i: number) =>
        `Invité ${i + 1}: ${g.firstName} ${g.lastName} (${g.relationshipToMainClient}${g.isMinor ? ', mineur' : ''})`
      ).join('; ') : '',
      mainClient.notes ? `Notes client: ${mainClient.notes}` : '',
      specialRequests ? `Demandes spéciales: ${specialRequests}` : '',
    ].filter(Boolean).join(' | ');

    // Créer la réservation avec la structure correcte du modèle
    const booking = await BookingModel.create({
      establishmentId: accommodation.establishmentId,
      accommodationId: accommodationId,
      clientInfo: {
        firstName: mainClient.firstName,
        lastName: mainClient.lastName,
        email: mainClient.email,
        phone: mainClient.phone,
        idNumber: mainClient.idNumber,
      },
      bookingType: 'online',
      checkIn: checkIn,
      checkOut: checkOut,
      numberOfGuests: numberOfGuests || 1,
      pricingDetails: {
        mode: 'nightly',
        unitPrice: basePrice,
        quantity: numberOfNights,
        subtotal: subtotal,
        discount: 0,
        tax: 0,
        total: total,
      },
      status: 'pending',
      paymentStatus: 'unpaid',
      notes: detailedNotes,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: booking._id,
        bookingCode: booking.bookingCode,
        status: booking.status,
        totalPrice: booking.pricingDetails.total,
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
