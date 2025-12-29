import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Booking from '@/models/Booking.model';
import { withEstablishmentIsolation } from '@/lib/auth/establishment-isolation.middleware';
import { EstablishmentAccessDeniedError } from '@/lib/errors/establishment-errors';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withEstablishmentIsolation(async (req, context) => {
    try {
      await connectDB();
      const { id } = await params;

      // Find booking and check establishment access
      const booking = await Booking.findById(id);
      if (!booking) {
        return NextResponse.json(
          { error: 'Réservation non trouvée' },
          { status: 404 }
        );
      }

      // Check if user can access this booking's establishment
      if (!context.serviceContext.canAccessAll() && 
          booking.establishmentId.toString() !== context.establishmentId) {
        return NextResponse.json(
          { error: 'Accès à cet établissement refusé' },
          { status: 403 }
        );
      }

      // Check if booking can be accepted
      if (booking.status !== 'pending') {
        return NextResponse.json(
          { error: 'Cette réservation ne peut pas être acceptée' },
          { status: 400 }
        );
      }

      // Update booking status to accepted
      booking.status = 'accepted';
      await booking.save();

      // TODO: Send email notification to client
      console.log('Booking accepted:', booking._id);

      return NextResponse.json({
        success: true,
        message: 'Réservation acceptée avec succès',
        data: booking
      });

    } catch (error: any) {
      console.error('Error accepting booking:', error);
      
      if (error instanceof EstablishmentAccessDeniedError) {
        return NextResponse.json(
          { error: error.message },
          { status: 403 }
        );
      }
      
      return NextResponse.json(
        { error: 'Erreur lors de l\'acceptation de la réservation' },
        { status: 500 }
      );
    }
  })(request);
}
