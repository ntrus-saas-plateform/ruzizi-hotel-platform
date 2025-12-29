import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Booking from '@/models/Booking.model';
import BookingService from '@/services/Booking.service';
import { CreateBookingSchema, BookingFilterSchema } from '@/lib/validations/booking.validation';
import {
    createErrorResponse,
    createSuccessResponse,
    createValidationErrorResponse
} from '@/lib/auth/middleware';
import { withEstablishmentIsolation, validateResourceAccess } from '@/lib/auth/establishment-isolation.middleware';
import { EstablishmentAccessDeniedError, CrossEstablishmentRelationshipError } from '@/lib/errors/establishment-errors';

export async function GET(request: NextRequest) {
    return withEstablishmentIsolation(async (req, context) => {
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

            // For admins, allow optional establishment filtering via query param
            const requestedEstablishmentId = searchParams.get('establishmentId') ?? undefined;
            if (requestedEstablishmentId && !context.serviceContext.canAccessAll()) {
                // Non-admin users cannot request a different establishment
                if (requestedEstablishmentId !== context.establishmentId) {
                    return createErrorResponse('ESTABLISHMENT_ACCESS_DENIED', 'Accès à cet établissement refusé', 403);
                }
            }

            // Récupérer les réservations avec pagination optimisée
            // The service context will automatically filter by establishment for non-admins
            const result = await BookingService.getAll(
                {
                    establishmentId: requestedEstablishmentId,
                    status: filters.status,
                    paymentStatus: filters.paymentStatus,
                    bookingType: filters.bookingType,
                    checkInFrom: filters.checkInFrom,
                    checkInTo: filters.checkInTo,
                    search: filters.search,
                },
                filters.page,
                filters.limit,
                context.serviceContext
            );

            return createSuccessResponse({
                data: result.data,
                pagination: result.pagination,
            });
        } catch (error: any) {
            console.error('Error fetching bookings:', error);
            
            if (error instanceof EstablishmentAccessDeniedError) {
                return createErrorResponse('ESTABLISHMENT_ACCESS_DENIED', error.message, 403);
            }
            
            return createErrorResponse('DATABASE_ERROR', error.message || 'Erreur lors de la récupération des réservations', 500);
        }
    })(request);
}

export async function POST(request: NextRequest) {
    return withEstablishmentIsolation(async (req, context) => {
        try {
            await connectDB();

            const body = await req.json();

            // Validate request body
            const validationResult = CreateBookingSchema.safeParse(body);
            if (!validationResult.success) {
                return createValidationErrorResponse(validationResult.error, 'Données de réservation invalides');
            }

            const validatedData = validationResult.data;

            // For non-admin users, enforce their establishment
            // For admin users, require an establishmentId to be specified
            let establishmentId: string;
            
            if (context.serviceContext.canAccessAll()) {
                // Admins must specify an establishment
                if (!validatedData.establishmentId) {
                    return createErrorResponse('VALIDATION_ERROR', 'Establishment ID is required', 400);
                }
                establishmentId = validatedData.establishmentId;
            } else {
                // Non-admins: automatically use their establishment, ignore any provided value
                establishmentId = context.establishmentId!;
            }

            const bookingData = {
                ...validatedData,
                establishmentId,
                createdBy: context.userId,
            };

            // Créer la réservation via le service
            // The service will validate relationships (e.g., accommodation belongs to same establishment)
            const booking = await BookingService.create(bookingData, context.serviceContext);

            return createSuccessResponse(booking, 'Réservation créée avec succès', 201);
        } catch (error: any) {
            console.error('Error creating booking:', error.message);
            console.error('Full error details:', error);
            
            if (error instanceof EstablishmentAccessDeniedError) {
                return createErrorResponse('ESTABLISHMENT_ACCESS_DENIED', error.message, 403);
            }
            
            if (error instanceof CrossEstablishmentRelationshipError) {
                return createErrorResponse('CROSS_ESTABLISHMENT_RELATIONSHIP', error.message, 403);
            }
            
            // Return the actual error message for better debugging
            return createErrorResponse('BOOKING_CREATION_FAILED', error.message || 'Erreur lors de la création de la réservation', 500);
        }
    })(request);
}
