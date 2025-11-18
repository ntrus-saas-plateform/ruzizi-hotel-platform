import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { isValidObjectId } from '@/lib/db/utils';
import BookingService from '@/services/Booking.service';
import { UpdateBookingSchema } from '@/lib/validations/booking.validation';
import {
    requireAuth,
    canAccessEstablishment,
    createErrorResponse,
    createSuccessResponse,
    createValidationErrorResponse
} from '@/lib/auth/middleware';

export async function GET(
   request: NextRequest,
   { params }: { params: Promise<{ id: string }> }
 ) {
   const resolvedParams = await params;
   return requireAuth(async (req, user) => {
     try {
       await connectDB();

       // Validate booking ID
       if (!isValidObjectId(resolvedParams.id)) {
         return createErrorResponse('VALIDATION_ERROR', 'ID de réservation invalide', 400);
       }

       const booking = await BookingService.getById(resolvedParams.id);

      if (!booking) {
        return createErrorResponse('NOT_FOUND', 'Réservation non trouvée', 404);
      }

      // Vérifier l'accès à l'établissement
      if (!canAccessEstablishment(user, booking.establishmentId)) {
        return createErrorResponse('FORBIDDEN', 'Accès à cette réservation refusé', 403);
      }

      return createSuccessResponse(booking);
    } catch (error: any) {
      console.error('Error fetching booking:', error);
      return createErrorResponse('DATABASE_ERROR', error.message || 'Erreur lors de la récupération de la réservation', 500);
    }
  })(request);
}

export async function PUT(
   request: NextRequest,
   { params }: { params: Promise<{ id: string }> }
 ) {
   const resolvedParams = await params;
   return requireAuth(async (req, user) => {
     try {
       await connectDB();

       // Validate booking ID
       if (!isValidObjectId(resolvedParams.id)) {
         return createErrorResponse('VALIDATION_ERROR', 'ID de réservation invalide', 400);
       }

       const booking = await BookingService.getById(resolvedParams.id);

      if (!booking) {
        return createErrorResponse('NOT_FOUND', 'Réservation non trouvée', 404);
      }

      // Vérifier l'accès à l'établissement
      if (!canAccessEstablishment(user, booking.establishmentId)) {
        return createErrorResponse('FORBIDDEN', 'Accès à cette réservation refusé', 403);
      }

      const body = await req.json();

      // Validate request body
      const validationResult = UpdateBookingSchema.safeParse(body);
      if (!validationResult.success) {
        return createValidationErrorResponse(validationResult.error, 'Données de mise à jour invalides');
      }

      const validatedData = validationResult.data;

      // Mettre à jour la réservation
      const updatedBooking = await BookingService.update(resolvedParams.id, validatedData);

      return createSuccessResponse(updatedBooking, 'Réservation mise à jour avec succès');
    } catch (error: any) {
      console.error('Error updating booking:', error);
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
   return requireAuth(async (req, user) => {
     try {
       await connectDB();

       // Validate booking ID
       if (!isValidObjectId(resolvedParams.id)) {
         return createErrorResponse('VALIDATION_ERROR', 'ID de réservation invalide', 400);
       }

       const booking = await BookingService.getById(resolvedParams.id);

      if (!booking) {
        return createErrorResponse('NOT_FOUND', 'Réservation non trouvée', 404);
      }

      // Vérifier l'accès à l'établissement
      if (!canAccessEstablishment(user, booking.establishmentId)) {
        return createErrorResponse('FORBIDDEN', 'Accès à cette réservation refusé', 403);
      }

      // Seuls les super_admin peuvent supprimer des réservations
      if (user.role !== 'super_admin') {
        return createErrorResponse('FORBIDDEN', 'Seuls les administrateurs peuvent supprimer des réservations', 403);
      }

      // TODO: Implement delete in BookingService if needed
      // For now, just cancel the booking
      const cancelledBooking = await BookingService.cancel(resolvedParams.id);

      return createSuccessResponse(cancelledBooking, 'Réservation annulée avec succès');
    } catch (error: any) {
      console.error('Error deleting booking:', error);
      return createErrorResponse('DATABASE_ERROR', error.message || 'Erreur lors de la suppression de la réservation', 500);
    }
  })(request);
}