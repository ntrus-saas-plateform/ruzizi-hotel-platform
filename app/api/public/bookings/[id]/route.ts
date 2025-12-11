import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import BookingModel from '@/models/Booking.model';
import AccommodationModel from '@/models/Accommodation.model';
import EstablishmentModel from '@/models/Establishment.model';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  try {
    await connectDB();

    // Validation de l'ID
    if (!resolvedParams.id || resolvedParams.id === 'undefined' || resolvedParams.id.length !== 24) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_ID',
            message: 'ID de réservation invalide',
          },
        },
        { status: 400 }
      );
    }

    // Vérification que l'ID est un ObjectId valide
    if (!/^[0-9a-fA-F]{24}$/.test(resolvedParams.id)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_ID',
            message: 'Format d\'ID invalide',
          },
        },
        { status: 400 }
      );
    }

    const booking = await BookingModel.findById(resolvedParams.id)
      .populate('accommodationId', 'name type capacity amenities images')
      .populate('establishmentId', 'name location contact')
      .lean();

    if (!booking) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Réservation non trouvée',
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
    console.error('Error fetching booking:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Erreur lors de la récupération de la réservation',
        },
      },
      { status: 500 }
    );
  }
}
