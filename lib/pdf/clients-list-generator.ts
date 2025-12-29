import { Buffer } from 'buffer';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export async function generateClientsListPDF(bookings: any[], includeFullInfo: boolean = true): Promise<Buffer> {
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
  
  // Header
  drawText('Ruzizi Hotel Platform', margin, yPosition, boldFont, 18, page);
  yPosition -= 25;
  drawText(includeFullInfo ? 'Liste des Clients (Informations Completes)' : 'Liste des Clients (Simple)', margin, yPosition, font, 14, page);
  yPosition -= 20;
  drawText(`Date: ${new Date().toLocaleDateString('fr-FR')}`, margin, yPosition, font, 12, page);
  yPosition -= 20;
  drawText(`Total des clients: ${bookings.length}`, margin, yPosition, font, 12, page);
  yPosition -= 40;
  
  // Table headers
  if (includeFullInfo) {
    // Full info table - All client and reservation details
    drawText('N° Reservation', margin, yPosition, boldFont, 9, page);
    drawText('Nom Complet', margin + 70, yPosition, boldFont, 9, page);
    drawText('Email', margin + 160, yPosition, boldFont, 9, page);
    drawText('Telephone', margin + 280, yPosition, boldFont, 9, page);
    drawText('Date Arrivee', margin + 360, yPosition, boldFont, 9, page);
    drawText('Date Depart', margin + 440, yPosition, boldFont, 9, page);
    yPosition -= 12;
    
    // Second row of headers for more details
    drawText('Hebergement', margin, yPosition, boldFont, 8, page);
    drawText('Nb Clients', margin + 120, yPosition, boldFont, 8, page);
    drawText('Statut', margin + 180, yPosition, boldFont, 8, page);
    drawText('Type', margin + 240, yPosition, boldFont, 8, page);
    yPosition -= 12;
    
    // Draw line
    page.drawLine({
      start: { x: margin, y: yPosition },
      end: { x: width - margin, y: yPosition },
      thickness: 1,
      color: rgb(0, 0, 0),
    });
    yPosition -= 8;
    
    // Client data with full reservation details
    bookings.forEach((booking, index) => {
      checkPageBreak(30);
      
      // First row - Client basic info + dates
      drawText(booking._id.toString().slice(-8), margin, yPosition, font, 8, page);
      drawText(`${booking.clientInfo.firstName} ${booking.clientInfo.lastName}`, margin + 70, yPosition, font, 8, page);
      drawText(booking.clientInfo.email || 'N/A', margin + 160, yPosition, font, 7, page);
      drawText(booking.clientInfo.phone || 'N/A', margin + 280, yPosition, font, 8, page);
      drawText(new Date(booking.checkIn).toLocaleDateString('fr-FR'), margin + 360, yPosition, font, 8, page);
      drawText(new Date(booking.checkOut).toLocaleDateString('fr-FR'), margin + 440, yPosition, font, 8, page);
      yPosition -= 10;
      
      // Second row - Reservation details
      drawText(booking.accommodationId?.name || booking.accommodationId?.toString().slice(-8) || 'N/A', margin, yPosition, font, 7, page);
      drawText(booking.numberOfGuests?.toString() || '1', margin + 120, yPosition, font, 8, page);
      drawText(booking.status || 'N/A', margin + 180, yPosition, font, 8, page);
      drawText(booking.bookingType || 'online', margin + 240, yPosition, font, 8, page);
      yPosition -= 12;
    });
  } else {
    // Simple info table - Just basic client contact info
    drawText('N° Reservation', margin, yPosition, boldFont, 10, page);
    drawText('Nom Complet', margin + 80, yPosition, boldFont, 10, page);
    drawText('Email', margin + 200, yPosition, boldFont, 10, page);
    drawText('Telephone', margin + 350, yPosition, boldFont, 10, page);
    yPosition -= 15;
    
    // Draw line
    page.drawLine({
      start: { x: margin, y: yPosition },
      end: { x: width - margin, y: yPosition },
      thickness: 1,
      color: rgb(0, 0, 0),
    });
    yPosition -= 10;
    
    // Client data - simple version
    bookings.forEach((booking, index) => {
      checkPageBreak(20);
      
      drawText(booking._id.toString().slice(-8), margin, yPosition, font, 9, page);
      drawText(`${booking.clientInfo.firstName} ${booking.clientInfo.lastName}`, margin + 80, yPosition, font, 9, page);
      drawText(booking.clientInfo.email || 'N/A', margin + 200, yPosition, font, 8, page);
      drawText(booking.clientInfo.phone || 'N/A', margin + 350, yPosition, font, 9, page);
      yPosition -= 12;
    });
  }
  
  // Footer
  checkPageBreak(30);
  drawText('Genere par Ruzizi Hotel Platform', margin, yPosition, font, 10, page);
  
  // Serialize the PDFDocument to bytes
  const pdfBytes = await pdfDoc.save();
  
  return Buffer.from(pdfBytes);
}
