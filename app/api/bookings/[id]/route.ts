import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { isValidObjectId } from '@/lib/db/utils';
import BookingService from '@/services/Booking.service';
import { UpdateBookingSchema } from '@/lib/validations/booking.validation';
import {
    createErrorResponse,
    createSuccessResponse,
    createValidationErrorResponse
} from '@/lib/auth/middleware';
import { withEstablishmentIsolation, validateResourceAccess } from '@/lib/auth/establishment-isolation.middleware';
import { EstablishmentAccessDeniedError, CrossEstablishmentRelationshipError } from '@/lib/errors/establishment-errors';

export async function GET(
   request: NextRequest,
   { params }: { params: Promise<{ id: string }> }
 ) {
   const resolvedParams = await params;
   return withEstablishmentIsolation(async (req, context) => {
     try {
       await connectDB();

       // Validate booking ID
       if (!isValidObjectId(resolvedParams.id)) {
         return createErrorResponse('VALIDATION_ERROR', 'ID de réservation invalide', 400);
       }

       // Get booking with establishment context
       const booking = await BookingService.getById(resolvedParams.id, context.serviceContext);

      if (!booking) {
        return createErrorResponse('NOT_FOUND', 'Réservation non trouvée', 404);
      }

      // Validate access to the booking's establishment
      const accessError = validateResourceAccess(context, booking.establishmentId, 'réservation');
      if (accessError) {
        return accessError;
      }

      return createSuccessResponse(booking);
    } catch (error: any) {
      console.error('Error fetching booking:', error);
      
      if (error instanceof EstablishmentAccessDeniedError) {
        return createErrorResponse('ESTABLISHMENT_ACCESS_DENIED', error.message, 403);
      }
      
      return createErrorResponse('DATABASE_ERROR', error.message || 'Erreur lors de la récupération de la réservation', 500);
    }
  })(request);
}

export async function PUT(
   request: NextRequest,
   { params }: { params: Promise<{ id: string }> }
 ) {
   const resolvedParams = await params;
   return withEstablishmentIsolation(async (req, context) => {
     try {
       await connectDB();

       // Validate booking ID
       if (!isValidObjectId(resolvedParams.id)) {
         return createErrorResponse('VALIDATION_ERROR', 'ID de réservation invalide', 400);
       }

       // Get booking with establishment context
       const booking = await BookingService.getById(resolvedParams.id, context.serviceContext);

      if (!booking) {
        return createErrorResponse('NOT_FOUND', 'Réservation non trouvée', 404);
      }

      // Validate access to the booking's establishment
      const accessError = validateResourceAccess(context, booking.establishmentId, 'réservation');
      if (accessError) {
        return accessError;
      }

      const body = await req.json();

      // Validate request body
      const validationResult = UpdateBookingSchema.safeParse(body);
      if (!validationResult.success) {
        return createValidationErrorResponse(validationResult.error, 'Données de mise à jour invalides');
      }

      const validatedData = validationResult.data;

      // Mettre à jour la réservation
      const updatedBooking = await BookingService.update(resolvedParams.id, validatedData, context.serviceContext);

      return createSuccessResponse(updatedBooking, 'Réservation mise à jour avec succès');
    } catch (error: any) {
      console.error('Error updating booking:', error);
      
      if (error instanceof EstablishmentAccessDeniedError) {
        return createErrorResponse('ESTABLISHMENT_ACCESS_DENIED', error.message, 403);
      }
      
      if (error instanceof CrossEstablishmentRelationshipError) {
        return createErrorResponse('CROSS_ESTABLISHMENT_RELATIONSHIP', error.message, 400);
      }
      
      if (error.message === 'Accommodation is not available for the selected dates') {
        return createErrorResponse('VALIDATION_ERROR', 'L\'hébergement n\'est pas disponible pour les dates sélectionnées', 400);
      }
      
      return createErrorResponse('DATABASE_ERROR', error.message || 'Erreur lors de la mise à jour de la réservation', 500);
    }
  })(request);
}

export async function DELETE(
   request: NextRequest,
   { params }: { params: Promise<{ id: string }> }
 ) {
   const resolvedParams = await params;
   return withEstablishmentIsolation(async (req, context) => {
     try {
       await connectDB();

       // Validate booking ID
       if (!isValidObjectId(resolvedParams.id)) {
         return createErrorResponse('VALIDATION_ERROR', 'ID de réservation invalide', 400);
       }

       // Get booking with establishment context
       const booking = await BookingService.getById(resolvedParams.id, context.serviceContext);

      if (!booking) {
        return createErrorResponse('NOT_FOUND', 'Réservation non trouvée', 404);
      }

      // Validate access to the booking's establishment
      const accessError = validateResourceAccess(context, booking.establishmentId, 'réservation');
      if (accessError) {
        return accessError;
      }

      // Seuls les super_admin peuvent supprimer des réservations
      if (context.role !== 'super_admin') {
        return createErrorResponse('FORBIDDEN', 'Seuls les administrateurs peuvent supprimer des réservations', 403);
      }

      // TODO: Implement delete in BookingService if needed
      // For now, just cancel the booking
      const cancelledBooking = await BookingService.cancel(resolvedParams.id, context.serviceContext);

      return createSuccessResponse(cancelledBooking, 'Réservation annulée avec succès');
    } catch (error: any) {
      console.error('Error deleting booking:', error);
      
      if (error instanceof EstablishmentAccessDeniedError) {
        return createErrorResponse('ESTABLISHMENT_ACCESS_DENIED', error.message, 403);
      }
      
      return createErrorResponse('DATABASE_ERROR', error.message || 'Erreur lors de la suppression de la réservation', 500);
    }
  })(request);
}