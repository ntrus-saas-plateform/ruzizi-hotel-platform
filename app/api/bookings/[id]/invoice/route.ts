import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Booking from '@/models/Booking.model';
import { generateBookingInvoicePDF } from '@/lib/pdf/booking-invoice-generator';
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

      // Find booking with proper population
      const booking = await Booking.findById(id)
        .populate({
          path: 'accommodationId',
          model: 'Accommodation'
        })
        .populate('establishmentId');
      
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

      // Debug: Log the booking structure to understand the data
      console.log('Booking data for PDF:', JSON.stringify(booking, null, 2));
      console.log('AccommodationId type:', typeof booking.accommodationId);
      console.log('AccommodationId value:', booking.accommodationId);

      // Generate PDF invoice
      const pdfBuffer = await generateBookingInvoicePDF(booking);

      // Return PDF as response
      return new NextResponse(pdfBuffer as any, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="facture-reservation-${booking._id}.pdf"`,
        },
      });

    } catch (error: any) {
      console.error('Error generating invoice:', error);
      
      if (error instanceof EstablishmentAccessDeniedError) {
        return NextResponse.json(
          { error: error.message },
          { status: 403 }
        );
      }
      
      return NextResponse.json(
        { error: 'Erreur lors de la génération de la facture' },
        { status: 500 }
      );
    }
  })(request);
}
