import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Booking from '@/models/Booking.model';
import BookingService from '@/services/Booking.service';
import { CreateBookingSchema, BookingFilterSchema } from '@/lib/validations/booking.validation';
import {
    requireAuth,
    applyEstablishmentFilter,
    canAccessEstablishment,
    createErrorResponse,
    createSuccessResponse,
    createValidationErrorResponse
} from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
    return requireAuth(async (req, user) => {
        try {
            await connectDB();

            const { searchParams } = new URL(req.url);

            // Validate query parameters
            const validationResult = BookingFilterSchema.safeParse({
                page: parseInt(searchParams.get('page') || '1'),
                limit: parseInt(searchParams.get('limit') || '10'),
                search: searchParams.get('search') ?? undefined,
                status: searchParams.get('status') ?? undefined,
                paymentStatus: searchParams.get('paymentStatus') ?? undefined,
                bookingType: searchParams.get('bookingType') ?? undefined,
                checkInFrom: searchParams.get('checkInFrom') ?? undefined,
                checkInTo: searchParams.get('checkInTo') ?? undefined,
            });

            if (!validationResult.success) {
                return createValidationErrorResponse(validationResult.error, 'Paramètres de requête invalides');
            }

            const filters = validationResult.data;

            // Si un établissement spécifique est demandé, vérifier l'accès
            const requestedEstablishmentId = searchParams.get('establishmentId');
            if (requestedEstablishmentId) {
                if (!canAccessEstablishment(user, requestedEstablishmentId)) {
                    return createErrorResponse('FORBIDDEN', 'Accès à cet établissement refusé', 403);
                }
            }

            // Récupérer les réservations avec pagination optimisée
            const result = await BookingService.getAll(
                {
                    establishmentId: requestedEstablishmentId || user.establishmentId,
                    status: filters.status,
                    paymentStatus: filters.paymentStatus,
                    bookingType: filters.bookingType,
                    checkInFrom: filters.checkInFrom,
                    checkInTo: filters.checkInTo,
                    search: filters.search,
                },
                filters.page,
                filters.limit
            );

            return createSuccessResponse({
                data: result.data,
                pagination: result.pagination,
            });
        } catch (error: any) {
            console.error('Error fetching bookings:', error);
            return createErrorResponse('DATABASE_ERROR', error.message || 'Erreur lors de la récupération des réservations', 500);
        }
    })(request);
}

export async function POST(request: NextRequest) {
    return requireAuth(async (req, user) => {
        try {
            await connectDB();

            const body = await req.json();

            // Validate request body
            const validationResult = CreateBookingSchema.safeParse(body);
            if (!validationResult.success) {
                return createValidationErrorResponse(validationResult.error, 'Données de réservation invalides');
            }

            const validatedData = validationResult.data;

            // Vérifier que l'établissement de la réservation correspond à celui de l'utilisateur
            if (validatedData.establishmentId && !canAccessEstablishment(user, validatedData.establishmentId)) {
                return createErrorResponse('FORBIDDEN', 'Vous ne pouvez créer des réservations que pour votre établissement', 403);
            }

            // Si pas d'établissement spécifié, utiliser celui de l'utilisateur
            if (!validatedData.establishmentId && !user.establishmentId) {
                return createErrorResponse('VALIDATION_ERROR', 'Establishment ID is required', 400);
            }

            const bookingData = {
                ...validatedData,
                establishmentId: validatedData.establishmentId || user.establishmentId!,
                createdBy: user.userId,
            };

            // Créer la réservation via le service
            const booking = await BookingService.create(bookingData);

            return createSuccessResponse(booking, 'Réservation créée avec succès', 201);
        } catch (error: any) {
            console.error('Error creating booking:', error);
            return createErrorResponse('DATABASE_ERROR', error.message || 'Erreur lors de la création de la réservation', 500);
        }
    })(request);
}
