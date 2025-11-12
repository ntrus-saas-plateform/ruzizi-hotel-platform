import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import BookingModel from '@/models/Booking.model';
import AccommodationModel from '@/models/Accommodation.model';
import EstablishmentModel from '@/models/Establishment.model';

/**
 * GET /api/public/bookings/by-code?code=BOOKING_CODE&email=EMAIL
 * Récupère une réservation par son code et email (pour la sécurité)
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const bookingCode = searchParams.get('code');
    const email = searchParams.get('email');

    if (!bookingCode || !email) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_PARAMETERS',
            message: 'Code de réservation et email requis',
          },
        },
        { status: 400 }
      );
    }

    // Rechercher la réservation par code et email
    const booking = await BookingModel.findOne({
      bookingCode: bookingCode.toUpperCase(),
      'clientInfo.email': email.toLowerCase()
    })
      .populate('accommodationId', 'name type capacity amenities images')
      .populate('establishmentId', 'name location contact')
      .lean();

    if (!booking) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Aucune réservation trouvée avec ce code et cette adresse email',
          },
        },
        { status: 404 }
      );
    }

    // Calculer le nombre de nuits
    const checkInDate = new Date(booking.checkIn);
    const checkOutDate = new Date(booking.checkOut);
    const numberOfNights = Math.ceil(
      (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Compter les invités - pour le modèle actuel, on assume que tous sont des adultes
    const guestCounts = {
      adults: booking.numberOfGuests || 1,
      children: 0,
      total: booking.numberOfGuests || 1
    };

    // Formater les données pour la réponse
    const formattedBooking = {
      id: booking._id.toString(),
      bookingCode: booking.bookingCode,
      bookingNumber: booking.bookingCode, // Alias pour compatibilité
      checkInDate: booking.checkIn,
      checkOutDate: booking.checkOut,
      numberOfNights,
      numberOfGuests: booking.numberOfGuests,
      arrivalTime: '', // Pas dans le modèle actuel
      specialRequests: '', // Pas dans le modèle actuel
      guests: guestCounts,
      guestList: [], // Pas dans le modèle actuel
      mainGuest: {
        firstName: booking.clientInfo?.firstName || '',
        lastName: booking.clientInfo?.lastName || '',
        email: booking.clientInfo?.email || '',
        phone: booking.clientInfo?.phone || '',
        idNumber: booking.clientInfo?.idNumber || '',
      },
      pricing: {
        totalPrice: booking.pricingDetails?.total || 0,
        currency: 'BIF',
        basePrice: booking.pricingDetails?.unitPrice || 0,
        seasonalPrice: booking.pricingDetails?.unitPrice || 0,
        pricingMode: booking.pricingDetails?.mode || 'nightly',
        numberOfUnits: booking.pricingDetails?.quantity || numberOfNights
      },
      totalAmount: booking.pricingDetails?.total || 0,
      status: booking.status,
      paymentStatus: booking.paymentStatus || 'unpaid',
      accommodation: booking.accommodationId ? {
        id: (booking.accommodationId as any)._id?.toString(),
        name: (booking.accommodationId as any).name,
        type: (booking.accommodationId as any).type,
        capacity: (booking.accommodationId as any).capacity,
        amenities: (booking.accommodationId as any).amenities || [],
        images: (booking.accommodationId as any).images || []
      } : null,
      establishment: booking.establishmentId ? {
        id: (booking.establishmentId as any)._id?.toString(),
        name: (booking.establishmentId as any).name,
        location: (booking.establishmentId as any).location,
        contact: (booking.establishmentId as any).contact
      } : null,
      notes: booking.notes || '',
      source: 'website', // Pas dans le modèle actuel
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt
    };

    return NextResponse.json({
      success: true,
      data: formattedBooking,
    });

  } catch (error: any) {
    console.error('Error fetching booking by code:', error);
    
    // Gestion des erreurs spécifiques
    if (error.name === 'CastError') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_CODE',
            message: 'Code de réservation invalide',
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Erreur lors de la recherche de la réservation',
        },
      },
      { status: 500 }
    );
  }
}