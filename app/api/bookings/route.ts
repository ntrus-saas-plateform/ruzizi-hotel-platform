import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Booking from '@/models/Booking.model';
import { 
    requireAuth, 
    applyEstablishmentFilter, 
    canAccessEstablishment,
    createErrorResponse,
    createSuccessResponse 
} from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
    return requireAuth(async (req, user) => {
        try {
            await connectDB();

            const { searchParams } = new URL(req.url);
            const page = parseInt(searchParams.get('page') || '1');
            const limit = parseInt(searchParams.get('limit') || '10');
            const skip = (page - 1) * limit;

            // Filtres de base
            let filters: any = {};

            const search = searchParams.get('search');
            if (search) {
                filters.$or = [
                    { bookingCode: { $regex: search, $options: 'i' } },
                    { 'clientInfo.firstName': { $regex: search, $options: 'i' } },
                    { 'clientInfo.lastName': { $regex: search, $options: 'i' } },
                    { 'clientInfo.email': { $regex: search, $options: 'i' } },
                ];
            }

            const status = searchParams.get('status');
            if (status) filters.status = status;

            const paymentStatus = searchParams.get('paymentStatus');
            if (paymentStatus) filters.paymentStatus = paymentStatus;

            const bookingType = searchParams.get('bookingType');
            if (bookingType) filters.bookingType = bookingType;

            // Si un établissement spécifique est demandé, vérifier l'accès
            const requestedEstablishmentId = searchParams.get('establishmentId');
            if (requestedEstablishmentId) {
                if (!canAccessEstablishment(user, requestedEstablishmentId)) {
                    return createErrorResponse('FORBIDDEN', 'Accès à cet établissement refusé', 403);
                }
                filters.establishmentId = requestedEstablishmentId;
            }

            // Appliquer le filtre d'établissement automatique
            filters = applyEstablishmentFilter(user, filters);

            const checkInFrom = searchParams.get('checkInFrom');
            const checkInTo = searchParams.get('checkInTo');
            if (checkInFrom || checkInTo) {
                filters.checkIn = {};
                if (checkInFrom) filters.checkIn.$gte = new Date(checkInFrom);
                if (checkInTo) filters.checkIn.$lte = new Date(checkInTo);
            }

            // Récupérer les réservations
            const [bookings, total] = await Promise.all([
                Booking.find(filters)
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .populate('establishmentId', 'name')
                    .populate('accommodationId', 'name type')
                    .lean(),
                Booking.countDocuments(filters),
            ]);

            return createSuccessResponse({
                data: bookings,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            });
        } catch (error: any) {
            console.error('Error fetching bookings:', error);
            return createErrorResponse('FETCH_ERROR', error.message || 'Erreur lors de la récupération des réservations', 500);
        }
    })(request);
}

export async function POST(request: NextRequest) {
    return requireAuth(async (req, user) => {
        try {
            await connectDB();

            const body = await req.json();

            // Vérifier que l'établissement de la réservation correspond à celui de l'utilisateur
            if (body.establishmentId && !canAccessEstablishment(user, body.establishmentId)) {
                return createErrorResponse('FORBIDDEN', 'Vous ne pouvez créer des réservations que pour votre établissement', 403);
            }

            // Si pas d'établissement spécifié, utiliser celui de l'utilisateur
            if (!body.establishmentId && user.establishmentId) {
                body.establishmentId = user.establishmentId;
            }

            // Créer la réservation
            const booking = await Booking.create({
                ...body,
                createdBy: user.userId,
            });

            return createSuccessResponse(booking, 'Réservation créée avec succès', 201);
        } catch (error: any) {
            console.error('Error creating booking:', error);
            return createErrorResponse('CREATE_ERROR', error.message || 'Erreur lors de la création de la réservation', 500);
        }
    })(request);
}
