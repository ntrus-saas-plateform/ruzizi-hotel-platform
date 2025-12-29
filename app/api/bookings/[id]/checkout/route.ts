import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Booking from '@/models/Booking.model';
import { withEstablishmentIsolation } from '@/lib/auth/establishment-isolation.middleware';
import { EstablishmentAccessDeniedError } from '@/lib/errors/establishment-errors';

/**
 * POST /api/bookings/[id]/checkout
 * Complete booking (check-out)
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return withEstablishmentIsolation(async (req, context) => {
    try {
      await connectDB();
      
      // Find booking
      const booking = await Booking.findById(resolvedParams.id);
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

      // Check if booking can be checked out
      if (booking.status !== 'confirmed') {
        return NextResponse.json(
          { error: 'Cette réservation ne peut pas faire l\'objet d\'un check-out' },
          { status: 400 }
        );
      }

      // Update booking status to completed
      booking.status = 'completed';
      await booking.save();

      console.log('Booking completed:', booking._id);

      return NextResponse.json({
        success: true,
        message: 'Check-out effectué avec succès',
        data: booking
      });

    } catch (error: any) {
      console.error('Error completing booking:', error);
      
      if (error instanceof EstablishmentAccessDeniedError) {
        return NextResponse.json(
          { error: error.message },
          { status: 403 }
        );
      }
      
      return NextResponse.json(
        { error: 'Erreur lors du check-out' },
        { status: 500 }
      );
    }
  })(request);
}
