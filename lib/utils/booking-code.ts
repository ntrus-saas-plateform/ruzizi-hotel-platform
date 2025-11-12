/**
 * Generate a unique booking code
 * Format: RH-YYYYMMDD-XXXX
 * Example: RH-20241111-A3F9
 */
export function generateBookingCode(): string {
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

  return `RH-${year}${month}${day}-${randomCode}`;
}

/**
 * Validate booking code format
 */
export function isValidBookingCode(code: string): boolean {
  const pattern = /^RH-\d{8}-[A-Z0-9]{4}$/;
  return pattern.test(code);
}

/**
 * Extract date from booking code
 */
export function extractDateFromBookingCode(code: string): Date | null {
  if (!isValidBookingCode(code)) {
    return null;
  }

  const datePart = code.split('-')[1];
  const year = parseInt(datePart.substring(0, 4));
  const month = parseInt(datePart.substring(4, 6)) - 1;
  const day = parseInt(datePart.substring(6, 8));

  return new Date(year, month, day);
}
