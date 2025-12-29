import { Buffer } from 'buffer';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export async function generateBookingInvoicePDF(booking: any): Promise<Buffer> {
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();

    // Add a blank page
    let page = pdfDoc.addPage([595, 842]); // A4 size in points

    // Get the font
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Set up dimensions
    const { width, height } = page.getSize();
    const margin = 50;
    let yPosition = height - margin;

    // Helper function to clean text and draw it
    const drawText = (text: string, x: number, y: number, fontType: any = font, size: number = 12, currentPage: any = page) => {
        // Replace problematic characters with regular spaces
        const cleanText = text.replace(/[\u202F\u00A0]/g, ' ');
        // Remove accented characters
        const textWithoutAccents = cleanText.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        currentPage.drawText(textWithoutAccents, { x, y, font: fontType, size, color: rgb(0, 0, 0) });
    };

    // Helper function to add new page if needed
    const checkPageBreak = (requiredSpace: number = 50) => {
        if (yPosition < margin + requiredSpace) {
            page = pdfDoc.addPage([595, 842]);
            yPosition = height - margin;
            return true;
        }
        return false;
    };

    // Header - Company Info
    drawText('Ruzizi Hotel Platform', margin, yPosition, boldFont, 18, page);
    yPosition -= 25;
    drawText('Facture de Reservation', margin, yPosition, font, 14, page);
    yPosition -= 40;

    // Invoice details
    drawText(`Numero de facture: INV-${booking._id}`, margin, yPosition, font, 12, page);
    yPosition -= 20;
    drawText(`Date: ${new Date().toLocaleDateString('fr-FR')}`, margin, yPosition, font, 12, page);
    yPosition -= 20;
    drawText(`Numero de reservation: ${booking._id}`, margin, yPosition, font, 12, page);
    yPosition -= 40;

    // Client Information
    checkPageBreak(80);
    drawText('Informations du Client', margin, yPosition, boldFont, 14, page);
    yPosition -= 20;
    drawText(`Nom: ${booking.clientInfo.firstName} ${booking.clientInfo.lastName}`, margin, yPosition, font, 12, page);
    yPosition -= 15;
    drawText(`Email: ${booking.clientInfo.email}`, margin, yPosition, font, 12, page);
    yPosition -= 15;
    drawText(`Telephone: ${booking.clientInfo.phone}`, margin, yPosition, font, 12, page);
    yPosition -= 40;

    // Booking Details
    checkPageBreak(120);
    drawText('Details de la Reservation', margin, yPosition, boldFont, 14, page);
    yPosition -= 20;
    
    // Display accommodation details properly with better error handling
    let accommodation: any = {};
    let accommodationName = 'N/A';
    let accommodationType = 'N/A';
    
    try {
        // Try to get accommodation data from different possible sources
        if (booking.accommodationId && typeof booking.accommodationId === 'object') {
            accommodation = booking.accommodationId;
            accommodationName = (accommodation as any).name || 'N/A';
            accommodationType = (accommodation as any).type || 'N/A';
        } else if (booking.accommodation && typeof booking.accommodation === 'object') {
            accommodation = booking.accommodation;
            accommodationName = (accommodation as any).name || 'N/A';
            accommodationType = (accommodation as any).type || 'N/A';
        } else {
            // Fallback: just show the ID if we can't get the populated data
            accommodationName = booking.accommodationId?.toString() || 'N/A';
            accommodationType = 'Type non specifie';
        }
    } catch (error) {
        console.error('Error processing accommodation data:', error);
        accommodationName = 'Erreur de donnees';
        accommodationType = 'N/A';
    }
    
    drawText(`Hebergement: ${accommodationName} (${accommodationType})`, margin, yPosition, font, 12, page);
    yPosition -= 15;
    drawText(`Date d'arrivee: ${new Date(booking.checkIn).toLocaleDateString('fr-FR')}`, margin, yPosition, font, 12, page);
    yPosition -= 15;
    drawText(`Date de depart: ${new Date(booking.checkOut).toLocaleDateString('fr-FR')}`, margin, yPosition, font, 12, page);
    yPosition -= 15;
    drawText(`Nombre de clients: ${booking.numberOfGuests}`, margin, yPosition, font, 12, page);
    yPosition -= 15;
    
    // Add capacity information if available
    if ((accommodation as any).capacity) {
        const capacity = (accommodation as any).capacity;
        drawText(`Capacite: ${capacity.maxGuests || 'N/A'} clients max, ${capacity.bedrooms || 'N/A'} chambre(s), ${capacity.bathrooms || 'N/A'} salle(s) de bain`, margin, yPosition, font, 12, page);
        yPosition -= 15;
    }
    
    drawText(`Statut: ${booking.status}`, margin, yPosition, font, 12, page);
    yPosition -= 15;
    drawText(`Statut de paiement: ${booking.paymentStatus}`, margin, yPosition, font, 12, page);
    yPosition -= 15;
    
    // Add amenities if available
    if ((accommodation as any).amenities && (accommodation as any).amenities.length > 0) {
        drawText(`Equipements: ${(accommodation as any).amenities.join(', ')}`, margin, yPosition, font, 12, page);
        yPosition -= 40;
    } else {
        yPosition -= 25;
    }

    // Pricing Details
    checkPageBreak(150);
    drawText('Details de Tarification', margin, yPosition, boldFont, 14, page);
    yPosition -= 20;

    const pricing = booking.pricingDetails;
    drawText(`Mode de tarification: ${pricing.mode}`, margin, yPosition, font, 12, page);
    yPosition -= 15;
    drawText(`Prix unitaire: ${pricing.unitPrice.toLocaleString()} BIF`, margin, yPosition, font, 12, page);
    yPosition -= 15;
    drawText(`Quantite: ${pricing.quantity}`, margin, yPosition, font, 12, page);
    yPosition -= 15;
    drawText(`Sous-total: ${pricing.subtotal.toLocaleString()} BIF`, margin, yPosition, font, 12, page);

    if (pricing.discount) {
        yPosition -= 15;
        drawText(`Remise: ${pricing.discount.toLocaleString()} BIF`, margin, yPosition, font, 12, page);
    }

    if (pricing.tax) {
        yPosition -= 15;
        drawText(`Taxe: ${pricing.tax.toLocaleString()} BIF`, margin, yPosition, font, 12, page);
    }

    yPosition -= 15;
    drawText(`Total: ${pricing.total.toLocaleString()} BIF`, margin, yPosition, boldFont, 14, page);
    yPosition -= 40;

    // Payment Information
    checkPageBreak(80);
    drawText('Informations de Paiement', margin, yPosition, boldFont, 14, page);
    yPosition -= 20;
    drawText('Veuillez effectuer le paiement pour confirmer votre reservation.', margin, yPosition, font, 12, page);
    yPosition -= 15;
    drawText('Une fois le paiement recu, votre reservation sera confirmee.', margin, yPosition, font, 12, page);
    yPosition -= 40;

    // Footer
    checkPageBreak(50);
    drawText('Merci de choisir Ruzizi Hotel Platform!', margin, yPosition, font, 12, page);
    yPosition -= 15;
    drawText('Pour toute question, contactez-nous a: contact@ruzizihotel.com', margin, yPosition, font, 10, page);

    // Serialize the PDFDocument to bytes
    const pdfBytes = await pdfDoc.save();

    return Buffer.from(pdfBytes);
}
