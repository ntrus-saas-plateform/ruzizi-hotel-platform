import { NextRequest, NextResponse } from 'next/server';
import { BookingService } from '@/services/Booking.service';

export const runtime = 'nodejs';

// Génération de facture PDF pour une réservation via son code
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;

  if (!code) {
    return NextResponse.json(
      { success: false, error: { code: 'MISSING_CODE', message: 'Code de réservation manquant' } },
      { status: 400 },
    );
  }

  try {
    const booking = await BookingService.getByCode(code.toUpperCase());

    if (!booking) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Réservation non trouvée' } },
        { status: 404 },
      );
    }

    // Import dynamique de pdf-lib pour la génération du PDF côté serveur
    const pdfLib = await import('pdf-lib');
    const { PDFDocument, StandardFonts } = pdfLib as any;

    // Préparation des données enrichies
    const b: any = booking as any;
    const bookingNumber = b.bookingCode || b.bookingNumber || code;
    const clientInfo = b.clientInfo || {};
    const pricingDetails = b.pricingDetails || {};
    const checkIn = new Date(b.checkIn);
    const checkOut = new Date(b.checkOut);
    const unitPrice = pricingDetails.unitPrice ?? pricingDetails.seasonalPrice ?? pricingDetails.basePrice ?? 0;
    const total = pricingDetails.total ?? 0;
    const nights = (() => {
      const diffMs = checkOut.getTime() - checkIn.getTime();
      return diffMs > 0 ? Math.ceil(diffMs / (1000 * 60 * 60 * 24)) : 1;
    })();
    const status = b.status || 'pending';
    const establishment = b.establishment || {};
    const accommodation = b.accommodation || {};

    // Création du document PDF
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();

    const margin = 50;
    let y = height - margin;
    const lineHeight = 14;

    const sanitize = (value: string) =>
      value
        .replace(/\u202F/g, ' ') // espace fine insécable
        .replace(/\u00A0/g, ' ') // espace insécable classique
        .replace(/[\u2000-\u200F]/g, ' '); // autres espaces spéciaux

    const drawText = (text: string, options: { size?: number; x?: number; y?: number } = {}) => {
      const clean = sanitize(text);
      const size = options.size ?? 10;
      const x = options.x ?? margin;
      const thisY = options.y ?? y;
      page.drawText(clean, { x, y: thisY, size, font });
      y = thisY - lineHeight;
    };

    // En-tête hôtel
    drawText('Ruzizi Hôtel', { size: 18 });
    drawText("Avenue de l'Université, Bujumbura, Burundi", { size: 10 });
    drawText('Tél : +257 69 65 75 54', { size: 10 });
    drawText('Email : contact@ruzizihotel.com', { size: 10 });

    // Infos facture (à droite)
    const rightX = width - margin - 200;
    let yRight = height - margin;
    const drawRight = (text: string, size = 10) => {
      page.drawText(sanitize(text), { x: rightX, y: yRight, size, font });
      yRight -= lineHeight;
    };

    drawRight('Facture / Invoice', 14);
    drawRight(`N° : ${bookingNumber}`);
    drawRight(`Date : ${new Date().toLocaleDateString('fr-FR')}`);
    drawRight(`Statut : ${status}`);

    // Avancer un peu pour le corps
    y -= 30;

    // Client
    drawText('Client', { size: 12 });
    drawText(`${clientInfo.firstName || ''} ${clientInfo.lastName || ''}`.trim(), { size: 10 });
    if (clientInfo.email) drawText(clientInfo.email, { size: 10 });
    if (clientInfo.phone) drawText(clientInfo.phone, { size: 10 });

    y -= 10;

    // Établissement / Hébergement
    drawText('Établissement / Hébergement', { size: 12 });
    if (establishment.name) drawText(`Établissement : ${establishment.name}`, { size: 10 });
    if (accommodation.name) drawText(`Hébergement : ${accommodation.name}`, { size: 10 });
    if (accommodation.type) drawText(`Type : ${accommodation.type}`, { size: 10 });

    y -= 10;

    // Détails du séjour
    drawText('Détails du séjour', { size: 12 });
    drawText(`Arrivée : ${checkIn.toLocaleDateString('fr-FR')}`, { size: 10 });
    drawText(`Départ : ${checkOut.toLocaleDateString('fr-FR')}`, { size: 10 });
    drawText(`Nombre de nuits : ${nights}`, { size: 10 });
    drawText(`Nombre de personnes : ${(b.numberOfGuests ?? 1).toString()}`, { size: 10 });

    y -= 10;

    // Détails de prix + TVA
    drawText('Détail du prix', { size: 12 });
    drawText(`Prix unitaire (par nuit) : ${unitPrice.toLocaleString('fr-FR')} BIF`, { size: 10 });
    drawText(`Nombre de nuits : ${nights}`, { size: 10 });

    const vatRate = 0.18; // 18% TVA
    const baseAmount = Math.round(total / (1 + vatRate));
    const vatAmount = total - baseAmount;

    drawText(`Montant HT : ${baseAmount.toLocaleString('fr-FR')} BIF`, { size: 10 });
    drawText(`TVA (18%) : ${vatAmount.toLocaleString('fr-FR')} BIF`, { size: 10 });
    drawText(`Total TTC : ${total.toLocaleString('fr-FR')} BIF`, { size: 10 });

    // Signature & conditions
    y -= 20;
    drawText('Signature & Cachet', { size: 12 });
    y -= 20;
    drawText('Signature du responsable __________________________', { size: 10 });

    y -= 20;
    const conditions = sanitize(
      "Conditions générales : Cette facture est générée à partir des informations fournies lors de la réservation. " +
        "Toute modification ou contestation doit être signalée dans les plus brefs délais au service réception.",
    );
    page.drawText(conditions, {
      x: margin,
      y: y,
      size: 8,
      font,
      maxWidth: width - margin * 2,
    });

    const pdfBytes = await pdfDoc.save();

    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="facture-${bookingNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating invoice PDF:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Erreur lors de la génération de la facture' } },
      { status: 500 },
    );
  }
}
