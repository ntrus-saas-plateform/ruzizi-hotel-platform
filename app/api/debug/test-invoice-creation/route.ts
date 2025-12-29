import { NextRequest, NextResponse } from 'next/server';
import { BookingService } from '@/services/Booking.service';

/**
 * POST /api/debug/test-invoice-creation
 * Test invoice creation for a booking
 */
export async function POST(request: NextRequest) {
  try {
    const { bookingId } = await request.json();
    
    if (!bookingId) {
      return NextResponse.json(
        { error: 'bookingId is required' },
        { status: 400 }
      );
    }

    console.log('🧪 Testing invoice creation for booking:', bookingId);
    
    // Get booking details before confirmation
    const { connectDB } = await import('@/lib/db');
    const Booking = (await import('@/models/Booking.model')).default;
    await connectDB();
    
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    console.log('📊 Booking before confirmation:', {
      id: booking._id,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      bookingCode: booking.bookingCode
    });

    // Check if invoice already exists
    const InvoiceModel = (await import('@/models/Invoice.model')).InvoiceModel;
    const existingInvoice = await InvoiceModel.findByBooking(bookingId);
    if (existingInvoice) {
      console.log('🧾 Invoice already exists:', existingInvoice.invoiceNumber);
      return NextResponse.json({
        success: true,
        message: 'Invoice already exists',
        data: {
          invoice: existingInvoice,
          booking: booking.toJSON()
        }
      });
    }

    // Confirm booking (should create invoice)
    const confirmedBooking = await BookingService.confirm(bookingId);
    
    if (!confirmedBooking) {
      return NextResponse.json(
        { error: 'Failed to confirm booking' },
        { status: 500 }
      );
    }

    // Check if invoice was created
    const newInvoice = await InvoiceModel.findByBooking(bookingId);
    
    return NextResponse.json({
      success: true,
      message: 'Test completed',
      data: {
        bookingBefore: booking.toJSON(),
        bookingAfter: confirmedBooking,
        invoiceCreated: !!newInvoice,
        invoice: newInvoice ? newInvoice.toJSON() : null
      }
    });

  } catch (error: any) {
    console.error('❌ Test failed:', error);
    return NextResponse.json(
      { 
        error: 'Test failed',
        details: error.message,
        stack: error.stack 
      },
      { status: 500 }
    );
  }
}
