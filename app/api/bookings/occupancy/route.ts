import { NextRequest, NextResponse } from 'next/server';
import { BookingModel } from '@/models/Booking.model';
import { AccommodationModel } from '@/models/Accommodation.model';
import { connectDB } from '@/lib/db';
import { toObjectId } from '@/lib/db/utils';
import { withEstablishmentIsolation } from '@/lib/auth/establishment-isolation.middleware';
import { EstablishmentAccessDeniedError } from '@/lib/errors/establishment-errors';

/**
 * GET /api/bookings/occupancy
 * Get occupancy rate statistics
 */
export async function GET(request: NextRequest) {
  return withEstablishmentIsolation(async (req, context) => {
    try {
      const { searchParams } = new URL(req.url);
      const establishmentId = searchParams.get('establishmentId');
      const startDateStr = searchParams.get('startDate');
      const endDateStr = searchParams.get('endDate');

      if (!startDateStr || !endDateStr) {
        return NextResponse.json(
          { error: 'Start and end dates are required' },
          { status: 400 }
        );
      }

      const startDate = new Date(startDateStr);
      const endDate = new Date(endDateStr);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid date format' },
          { status: 400 }
        );
      }

      await connectDB();

      // Build query
      const query: any = {};
      if (establishmentId) {
        // For non-admin users, validate they can access the requested establishment
        if (!context.serviceContext.canAccessAll() && establishmentId !== context.establishmentId) {
          return NextResponse.json(
            { error: 'Accès à cet établissement refusé' },
            { status: 403 }
          );
        }
        query.establishmentId = toObjectId(establishmentId);
      } else if (!context.serviceContext.canAccessAll()) {
        // Non-admin users can only see their own establishment
        if (context.establishmentId) {
          query.establishmentId = toObjectId(context.establishmentId);
        } else {
          return NextResponse.json(
            { error: 'ID établissement manquant' },
            { status: 400 }
          );
        }
      }

      // Get total accommodations
      const totalAccommodations = await AccommodationModel.countDocuments(query);

      // Get bookings in the date range
      const bookingQuery: any = {
        ...query,
        status: { $in: ['confirmed', 'completed'] },
        $or: [
          { checkIn: { $gte: startDate, $lte: endDate } },
          { checkOut: { $gte: startDate, $lte: endDate } },
          { checkIn: { $lte: startDate }, checkOut: { $gte: endDate } },
        ],
      };

      const bookings = await BookingModel.find(bookingQuery);

      // Calculate occupancy rate
      const totalDays = Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      const totalPossibleNights = totalAccommodations * totalDays;

      let totalOccupiedNights = 0;
      for (const booking of bookings) {
        const bookingStart = new Date(booking.checkIn);
        const bookingEnd = new Date(booking.checkOut);

        // Calculate overlap with the date range
        const overlapStart = bookingStart > startDate ? bookingStart : startDate;
        const overlapEnd = bookingEnd < endDate ? bookingEnd : endDate;

        const nights = Math.ceil(
          (overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24)
        );

        totalOccupiedNights += Math.max(0, nights);
      }

      const occupancyRate =
        totalPossibleNights > 0 ? (totalOccupiedNights / totalPossibleNights) * 100 : 0;

      // Get occupancy by accommodation type
      const accommodationTypes = await AccommodationModel.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 },
          },
        },
      ]);

      const occupancyByType = await Promise.all(
        accommodationTypes.map(async (typeGroup) => {
          const typeQuery = { ...query, type: typeGroup._id };
          const typeAccommodations = await AccommodationModel.find(typeQuery);
          const typeAccommodationIds = typeAccommodations.map((acc) => acc._id);

          const typeBookings = await BookingModel.find({
            accommodationId: { $in: typeAccommodationIds },
            status: { $in: ['confirmed', 'completed'] },
            $or: [
              { checkIn: { $gte: startDate, $lte: endDate } },
              { checkOut: { $gte: startDate, $lte: endDate } },
              { checkIn: { $lte: startDate }, checkOut: { $gte: endDate } },
            ],
          });

          let typeOccupiedNights = 0;
          for (const booking of typeBookings) {
            const bookingStart = new Date(booking.checkIn);
            const bookingEnd = new Date(booking.checkOut);

            const overlapStart = bookingStart > startDate ? bookingStart : startDate;
            const overlapEnd = bookingEnd < endDate ? bookingEnd : endDate;

            const nights = Math.ceil(
              (overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24)
            );

            typeOccupiedNights += Math.max(0, nights);
          }

          const typePossibleNights = typeGroup.count * totalDays;
          const typeOccupancyRate =
            typePossibleNights > 0 ? (typeOccupiedNights / typePossibleNights) * 100 : 0;

          return {
            type: typeGroup._id,
            count: typeGroup.count,
            occupancyRate: Math.round(typeOccupancyRate * 100) / 100,
          };
        })
      );

      return NextResponse.json({
        success: true,
        data: {
          totalAccommodations,
          totalDays,
          totalPossibleNights,
          totalOccupiedNights,
          occupancyRate: Math.round(occupancyRate * 100) / 100,
          occupancyByType,
          startDate: startDateStr,
          endDate: endDateStr,
        }
      });

    } catch (error: any) {
      console.error('Error calculating occupancy:', error);
      
      if (error instanceof EstablishmentAccessDeniedError) {
        return NextResponse.json(
          { error: error.message },
          { status: 403 }
        );
      }
      
      return NextResponse.json(
        { error: 'Erreur lors du calcul du taux d\'occupation' },
        { status: 500 }
      );
    }
  })(request);
}
