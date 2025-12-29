import { NextRequest, NextResponse } from 'next/server';
import { BookingService } from '@/services/Booking.service';
import { withEstablishmentIsolation } from '@/lib/auth/establishment-isolation.middleware';
import { EstablishmentAccessDeniedError } from '@/lib/errors/establishment-errors';

/**
 * POST /api/bookings/[id]/confirm
 * Confirm booking
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return withEstablishmentIsolation(async (req, context) => {
    try {
      console.log('🔄 Starting confirmation for booking:', resolvedParams.id);
      
      // Use BookingService to confirm booking (includes payment status update)
      const booking = await BookingService.confirm(resolvedParams.id);
      
      if (!booking) {
        console.log('❌ Booking not found or cannot be confirmed:', resolvedParams.id);
        return NextResponse.json(
          { error: 'Réservation non trouvée ou ne peut pas être confirmée' },
          { status: 404 }
        );
      }

      // Check if user can access this booking's establishment
      if (!context.serviceContext.canAccessAll() && 
          booking.establishmentId.toString() !== context.establishmentId) {
        console.log('❌ Access denied for establishment:', booking.establishmentId);
        return NextResponse.json(
          { error: 'Accès à cet établissement refusé' },
          { status: 403 }
        );
      }

      console.log('✅ Booking confirmed successfully:', booking.id);
      console.log('📊 Booking details:', {
        id: booking.id,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        bookingCode: booking.bookingCode
      });

      // Check if invoice was created
      try {
        const InvoiceModel = require('@/models/Invoice.model').InvoiceModel;
        const existingInvoice = await InvoiceModel.findByBooking(booking.id);
        if (existingInvoice) {
          console.log('🧾 Invoice found:', existingInvoice.invoiceNumber);
        } else {
          console.log('⚠️ No invoice found for booking:', booking.id);
        }
      } catch (invoiceCheckError) {
        console.log('❌ Error checking invoice:', invoiceCheckError);
      }

      return NextResponse.json({
        success: true,
        message: 'Réservation confirmée avec succès',
        data: booking
      });

    } catch (error: any) {
      console.error('Error confirming booking:', error);
      
      if (error instanceof EstablishmentAccessDeniedError) {
        return NextResponse.json(
          { error: error.message },
          { status: 403 }
        );
      }
      
      return NextResponse.json(
        { error: 'Erreur lors de la confirmation de la réservation' },
        { status: 500 }
      );
    }
  })(request);
}
