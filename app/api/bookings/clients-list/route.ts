import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Booking from '@/models/Booking.model';
import { generateClientsListPDF } from '@/lib/pdf/clients-list-generator';
import { withEstablishmentIsolation } from '@/lib/auth/establishment-isolation.middleware';
import { EstablishmentAccessDeniedError } from '@/lib/errors/establishment-errors';

export async function POST(request: NextRequest) {
  return withEstablishmentIsolation(async (req, context) => {
    try {
      await connectDB();
      const body = await request.json();
      const { includeFullInfo = true, establishmentId, dateFrom, dateTo } = body;

      console.log('=== API clients-list called ===');
      console.log('includeFullInfo:', includeFullInfo);
      console.log('establishmentId:', establishmentId);
      console.log('dateFrom:', dateFrom);
      console.log('dateTo:', dateTo);

      // Build query
      const query: any = {};
      
      // For non-admin users, enforce their establishment
      if (!context.serviceContext.canAccessAll()) {
        query.establishmentId = context.establishmentId;
      } else if (establishmentId) {
        // Admins can specify an establishment
        query.establishmentId = establishmentId;
      }
      
      if (dateFrom || dateTo) {
        query.checkIn = {};
        if (dateFrom) query.checkIn.$gte = new Date(dateFrom);
        if (dateTo) query.checkIn.$lte = new Date(dateTo);
      }

      // Find active bookings (confirmed or accepted)
      const bookings = await Booking.find({
        ...query,
        status: { $in: ['confirmed', 'accepted'] }
      })
      .populate({
        path: 'accommodationId',
        model: 'Accommodation',
        select: 'name type'
      })
      .populate('establishmentId')
      .sort({ checkIn: 1 });

      // Generate PDF
      console.log('Calling generateClientsListPDF with includeFullInfo:', includeFullInfo);
      const pdfBuffer = await generateClientsListPDF(bookings, includeFullInfo);
      console.log('PDF generated, size:', pdfBuffer.length);

      // Return PDF as response
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      return new NextResponse(pdfBuffer as any, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="liste-clients-${includeFullInfo ? 'complet' : 'simple'}-${timestamp}.pdf"`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });

    } catch (error: any) {
      console.error('Error generating clients list:', error);
      
      if (error instanceof EstablishmentAccessDeniedError) {
        return NextResponse.json(
          { error: error.message },
          { status: 403 }
        );
      }
      
      return NextResponse.json(
        { error: 'Erreur lors de la génération de la liste des clients' },
        { status: 500 }
      );
    }
  })(request);
}
