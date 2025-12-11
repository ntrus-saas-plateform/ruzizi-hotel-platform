import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import BookingModel from '@/models/Booking.model';
import AccommodationModel from '@/models/Accommodation.model';
import EstablishmentModel from '@/models/Establishment.model';
import { BookingFieldMapper, type FrontendBookingData, type FieldMappingError } from '@/lib/services/booking-field-mapper';
import { BookingPricingCalculator, type PricingCalculationError } from '@/lib/services/booking-pricing-calculator';
import { body } from 'framer-motion/client';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    
    // Map frontend data to model format using field mapping service
    let mappedData;
    try {
      mappedData = BookingFieldMapper.mapFrontendToModel(body as FrontendBookingData);
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'FIELD_MAPPING_ERROR') {
        const mappingError = error as FieldMappingError;
        
        // Enhanced logging for field mapping errors
        console.error('Field mapping error:', {
          error: mappingError.message,
          details: mappingError.details,
          requestBody: JSON.stringify(body, null, 2),
          timestamp: new Date().toISOString()
        });
        
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FIELD_MAPPING_ERROR',
              message: 'Les données de réservation ne sont pas dans le format attendu',
              details: mappingError.details,
            },
          },
          { status: 400 }
        );
      }
      throw error;
    }

    // Validate required fields after mapping
    const validation = BookingFieldMapper.validateRequiredFields(mappedData);
    if (!validation.isValid) {
      // Enhanced logging for validation errors
      console.error('Validation error:', {
        errors: validation.errors,
        missingFields: validation.missingFields,
        mappedData: JSON.stringify(mappedData, null, 2),
        timestamp: new Date().toISOString()
      });
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Informations de réservation incomplètes ou invalides',
            details: {
              errors: validation.errors,
              missingFields: validation.missingFields
            },
          },
        },
        { status: 400 }
      );
    }

    const {
      establishmentId,
      accommodationId,
      checkIn,
      checkOut,
      clientInfo,
      numberOfGuests,
      guests,
      specialRequests,
      arrivalTime,
      totalAmount,
      pricingDetails,
    } = mappedData;

    // Vérifier que l'établissement existe
    const establishment = await EstablishmentModel.findById(establishmentId);
    if (!establishment) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Établissement non trouvé',
          },
        },
        { status: 404 }
      );
    }

    // Vérifier que l'hébergement existe et appartient à l'établissement
    const accommodation = await AccommodationModel.findOne({
      _id: accommodationId,
      establishmentId: establishmentId
    });
    if (!accommodation) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Hébergement non trouvé dans cet établissement',
          },
        },
        { status: 404 }
      );
    }

    // Vérifier que l'hébergement est disponible
    if (accommodation.status !== 'available') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_AVAILABLE',
            message: 'Cet hébergement n\'est pas disponible actuellement',
          },
        },
        { status: 400 }
      );
    }

    // Vérifier la capacité
    if (numberOfGuests > accommodation.capacity.maxGuests) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CAPACITY_EXCEEDED',
            message: `Cet hébergement ne peut accueillir que ${accommodation.capacity.maxGuests} personnes maximum`,
          },
        },
        { status: 400 }
      );
    }

    // Vérifier les conflits de réservation
    const conflictingBooking = await BookingModel.findOne({
      accommodationId: accommodationId,
      status: { $in: ['pending', 'confirmed', 'checked_in'] },
      $or: [
        {
          checkIn: { $lte: checkOut },
          checkOut: { $gte: checkIn },
        },
      ],
    });

    if (conflictingBooking) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_AVAILABLE',
            message: "Cet hébergement n'est pas disponible pour les dates sélectionnées",
          },
        },
        { status: 400 }
      );
    }

    // Calculate pricing details if missing or incomplete using pricing calculation service
    let finalPricingDetails = pricingDetails;
    if (!pricingDetails || !pricingDetails.mode || !pricingDetails.unitPrice || !pricingDetails.total) {
      try {
        const pricingResult = BookingPricingCalculator.calculatePricingDetails({
          accommodation,
          checkIn,
          checkOut,
          numberOfGuests,
        });
        finalPricingDetails = pricingResult.pricingDetails;
      } catch (error) {
        if (error && typeof error === 'object' && 'code' in error && error.code === 'PRICING_CALCULATION_ERROR') {
          const pricingError = error as PricingCalculationError;
          
          // Enhanced logging for pricing calculation errors
          console.error('Pricing calculation error:', {
            error: pricingError.message,
            details: pricingError.details,
            accommodationId,
            establishmentId,
            checkIn: checkIn.toISOString(),
            checkOut: checkOut.toISOString(),
            numberOfGuests,
            timestamp: new Date().toISOString()
          });
          
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'PRICING_CALCULATION_ERROR',
                message: 'Impossible de calculer le prix de la réservation. Veuillez vérifier les informations de l\'hébergement.',
                details: pricingError.details,
              },
            },
            { status: 400 }
          );
        }
        throw error;
      }
    }

    // Générer un code de réservation unique avec retry logic
    // Utilise le nouveau format court et facile à retenir: RZ-MMDD-XXX
    const generateBookingCode = async (): Promise<string> => {
      const maxRetries = 3;
      let attempts = 0;
      
      while (attempts < maxRetries) {
        const date = new Date();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        
        // Generate random 3-character alphanumeric code
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let randomCode = '';
        for (let i = 0; i < 3; i++) {
          randomCode += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        const code = `RZ-${month}${day}-${randomCode}`;
        
        // Check if code already exists
        const existingBooking = await BookingModel.findOne({ bookingCode: code });
        if (!existingBooking) {
          return code;
        }
        
        attempts++;
        // Wait a bit before retry to ensure different timestamp
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      // If all retries failed, throw error to maintain data consistency
      throw new Error('Unable to generate unique booking code after multiple attempts');
    };

    // Préparer les notes détaillées
    const detailedNotes = [
      `Client: ${clientInfo.firstName} ${clientInfo.lastName}`,
      `Type: ${clientInfo.customerType || 'individual'}`,
      clientInfo.companyName ? `Entreprise: ${clientInfo.companyName}` : '',
      clientInfo.loyaltyCardNumber ? `Carte fidélité: ${clientInfo.loyaltyCardNumber}` : '',
      `Genre: ${clientInfo.gender || 'non-spécifié'}, Nationalité: ${clientInfo.nationality || 'non-spécifiée'}`,
      `Adresse: ${clientInfo.address || ''}, ${clientInfo.city || ''}, ${clientInfo.country || ''}`,
      clientInfo.preferredLanguage ? `Langue: ${clientInfo.preferredLanguage}` : '',
      arrivalTime ? `Heure d'arrivée: ${arrivalTime}` : '',
      guests && guests.length > 0 ? `Invités: ${guests.length}` : '',
      guests && guests.length > 0 ? guests.map((g: any, i: number) =>
        `Invité ${i + 1}: ${g.firstName} ${g.lastName} (${g.relationshipToMainClient || 'accompagnant'}${g.isMinor ? ', mineur' : ''})`
      ).join('; ') : '',
      clientInfo.notes ? `Notes client: ${clientInfo.notes}` : '',
      specialRequests ? `Demandes spéciales: ${specialRequests}` : '',
    ].filter(Boolean).join(' | ');

    // Créer la réservation avec la structure correcte du modèle
    let booking;
    try {
      const bookingCode = await generateBookingCode();
      
      const bookingData = {
        bookingCode,
        establishmentId: establishmentId,
        accommodationId: accommodationId,
        clientInfo: clientInfo,
        bookingType: 'online' as const,
        checkIn: checkIn,
        checkOut: checkOut,
        numberOfGuests: numberOfGuests,
        pricingDetails: finalPricingDetails,
        status: 'pending' as const,
        paymentStatus: 'unpaid' as const,
        notes: detailedNotes,
      };

      booking = await BookingModel.create(bookingData);
    } catch (error: any) {
      // Enhanced error handling for booking creation failures
      console.error('Booking creation failed:', {
        error: error.message,
        establishmentId,
        accommodationId,
        clientEmail: clientInfo.email,
        timestamp: new Date().toISOString()
      });
      
      // Check for specific database constraint violations
      if (error.code === 11000) { // MongoDB duplicate key error
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'DUPLICATE_BOOKING',
              message: 'Une réservation avec ces informations existe déjà',
              details: { duplicateField: Object.keys(error.keyPattern || {})[0] || 'unknown' }
            },
          },
          { status: 409 }
        );
      }
      
      // Check for validation errors from Mongoose
      if (error.name === 'ValidationError') {
        const validationDetails: Record<string, string> = {};
        Object.keys(error.errors || {}).forEach(field => {
          validationDetails[field] = error.errors[field].message;
        });
        
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'DATABASE_VALIDATION_ERROR',
              message: 'Les données de réservation ne respectent pas les contraintes de la base de données',
              details: validationDetails
            },
          },
          { status: 400 }
        );
      }
      
      // For any other database errors, throw to be caught by outer catch block
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: {
        id: (booking._id as any).toString(),
        bookingCode: (booking as any).bookingCode,
        status: (booking as any).status,
        totalAmount: (booking as any).pricingDetails.total,
        checkIn: (booking as any).checkIn,
        checkOut: (booking as any).checkOut,
        accommodation: {
          id: (accommodation._id as any).toString(),
          name: accommodation.name,
          type: accommodation.type
        },
        establishment: {
          id: (establishment._id as any).toString(),
          name: establishment.name,
          location: establishment.location
        },
        message: 'Réservation créée avec succès. Vous recevrez une confirmation par email.',
      },
    });
  } catch (error: any) {
    // Enhanced error logging with context
    console.error('Unexpected error in booking creation:', {
      error: error.message,
      stack: error.stack,
      requestBody: JSON.stringify(body, null, 2),
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get('user-agent'),
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
    });
    
    // Sanitize error message to avoid exposing internal details
    let userMessage = 'Erreur lors de la création de la réservation';
    let errorCode = 'INTERNAL_ERROR';
    
    // Handle specific known error types with user-friendly messages
    if (error.message?.includes('connection')) {
      userMessage = 'Problème de connexion à la base de données. Veuillez réessayer.';
      errorCode = 'DATABASE_CONNECTION_ERROR';
    } else if (error.message?.includes('timeout')) {
      userMessage = 'La requête a pris trop de temps. Veuillez réessayer.';
      errorCode = 'REQUEST_TIMEOUT';
    } else if (error.message?.includes('booking code')) {
      userMessage = 'Impossible de générer un code de réservation unique. Veuillez réessayer.';
      errorCode = 'BOOKING_CODE_GENERATION_ERROR';
    }
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: errorCode,
          message: userMessage,
          // Only include error details in development
          ...(process.env.NODE_ENV === 'development' && { 
            details: { originalError: error.message } 
          })
        },
      },
      { status: 500 }
    );
  }
}
