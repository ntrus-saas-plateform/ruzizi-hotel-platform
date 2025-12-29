import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { InvoiceModel } from '@/models/Invoice.model';
import Booking from '@/models/Booking.model';

/**
 * GET /api/debug/invoices
 * List all invoices with booking details
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get('bookingId');
    const establishmentId = searchParams.get('establishmentId');
    
    let filter: any = {};
    
    if (bookingId) {
      filter.bookingId = bookingId;
    }
    
    if (establishmentId) {
      filter.establishmentId = establishmentId;
    }
    
    console.log('🔍 Searching invoices with filter:', filter);
    
    const invoices = await InvoiceModel.find(filter)
      .populate('booking', 'bookingCode status paymentStatus clientInfo')
      .populate('establishment', 'name')
      .sort({ createdAt: -1 })
      .limit(20);
    
    // Also get recent bookings for comparison
    const recentBookings = await Booking.find()
      .select('bookingCode status paymentStatus createdAt')
      .sort({ createdAt: -1 })
      .limit(10);
    
    return NextResponse.json({
      success: true,
      data: {
        invoices: invoices.map((inv: any) => inv.toJSON()),
        recentBookings: recentBookings.map((b: any) => b.toJSON()),
        filter,
        count: invoices.length
      }
    });
    
  } catch (error: any) {
    console.error('❌ Error fetching invoices:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch invoices',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
