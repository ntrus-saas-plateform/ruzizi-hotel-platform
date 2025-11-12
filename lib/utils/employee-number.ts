/**
 * Generate a unique employee number
 * Format: EMP-YYYY-XXXX
 * Example: EMP-2024-0001
 */
export function generateEmployeeNumber(year: number = new Date().getFullYear()): string {
  const randomNum = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  return `EMP-${year}-${randomNum}`;
}
