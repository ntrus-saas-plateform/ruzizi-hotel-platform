/**
 * Generate a unique invoice number
 * Format: INV-YYYYMMDD-XXXX
 * Example: INV-20241111-A3F9
 */
export function generateInvoiceNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  // Generate random 4-character alphanumeric code
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomCode = '';
  for (let i = 0; i < 4; i++) {
    randomCode += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return `INV-${year}${month}${day}-${randomCode}`;
}
