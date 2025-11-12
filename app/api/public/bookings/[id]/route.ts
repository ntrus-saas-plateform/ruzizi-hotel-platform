import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import { BookingModel } from '@/models/Booking.model';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  try {
    await dbConnect();

    const booking = await BookingModel.findById(resolvedParams.id)
      .populate('accommodationId', 'name type')
      .populate('establishmentId', 'name location');

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

    // Formater les données pour la réponse
    const formattedBooking = {
      id: booking._id,
      bookingCode: booking.bookingCode,
      bookingNumber: booking.bookingCode, // Alias pour compatibilité
      checkInDate: booking.checkIn,
      checkOutDate: booking.checkOut,
      numberOfNights: Math.ceil(
        (new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) /
          (1000 * 60 * 60 * 24)
      ),
      guests: {
        adults: booking.numberOfGuests,
        children: 0,
        total: booking.numberOfGuests,
      },
      mainGuest: booking.clientInfo,
      pricing: {
        totalPrice: booking.pricingDetails.total,
        currency: 'BIF',
      },
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      accommodation: booking.accommodationId,
      establishment: booking.establishmentId,
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
