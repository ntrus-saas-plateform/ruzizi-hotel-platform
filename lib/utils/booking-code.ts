/**
 * Generate a unique booking code
 * Format: RZ-MMDD-XXX (plus court et facile à retenir)
 * Example: RZ-1211-A3F
 */
export function generateBookingCode(): string {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  // Generate random 3-character alphanumeric code (plus court)
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomCode = '';
  for (let i = 0; i < 3; i++) {
    randomCode += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return `RZ-${month}${day}-${randomCode}`;
}

/**
 * Validate booking code format
 */
export function isValidBookingCode(code: string): boolean {
  const pattern = /^RZ-\d{4}-[A-Z0-9]{3}$/;
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
  const currentYear = new Date().getFullYear();
  const month = parseInt(datePart.substring(0, 2)) - 1;
  const day = parseInt(datePart.substring(2, 4));

  // Validate month and day ranges
  if (month < 0 || month > 11) {
    return null; // Invalid month
  }
  
  if (day < 1 || day > 31) {
    return null; // Invalid day
  }

  const date = new Date(currentYear, month, day);
  
  // Check if the date is valid (handles cases like February 30th)
  if (date.getMonth() !== month || date.getDate() !== day) {
    return null;
  }

  return date;
}
