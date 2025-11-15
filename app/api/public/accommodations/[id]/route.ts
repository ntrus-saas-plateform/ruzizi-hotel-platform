import { NextRequest, NextResponse } from 'next/server';
import { AccommodationModel } from '@/models/Accommodation.model';
import { connectDB } from '@/lib/db';

/**
 * GET /api/public/accommodations/[id]
 * Get accommodation details by ID (public access)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const accommodation = await AccommodationModel.findById(params.id)
      .populate('establishmentId', 'name location contacts')
      .lean();

    if (!accommodation) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Accommodation not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: accommodation,
    });
  } catch (error) {
    console.error('Error fetching accommodation:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to fetch accommodation',
        },
      },
      { status: 500 }
    );
  }
}
