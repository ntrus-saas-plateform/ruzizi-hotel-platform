/**
 * Generate a unique employee number
 * Format: EMP-YYYY-XXXX
 * Example: EMP-2024-0001
 * 
 * Note: This function generates a base number. The actual uniqueness
 * is ensured by the Employee model's pre-save hook which checks for duplicates.
 */
export function generateEmployeeNumber(year: number = new Date().getFullYear()): string {
  // Generate a random 4-digit number as base
  // The Employee model will ensure uniqueness by checking existing numbers
  const randomNum = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  return `EMP-${year}-${randomNum}`;
}

/**
 * Generate the next incremental employee number for a given year
 * This is used by the Employee model to ensure truly incremental numbers
 */
export async function generateIncrementalEmployeeNumber(
  year: number = new Date().getFullYear(),
  findLastEmployeeNumber: (year: number) => Promise<string | null>
): Promise<string> {
  try {
    // Find the last employee number for this year
    const lastEmployeeNumber = await findLastEmployeeNumber(year);
    
    let nextNumber = 1;
    
    if (lastEmployeeNumber) {
      // Extract the number part from format EMP-YYYY-XXXX
      const match = lastEmployeeNumber.match(/EMP-\d{4}-(\d{4})/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }
    
    // Format as 4-digit number with leading zeros
    const formattedNumber = nextNumber.toString().padStart(4, '0');
    return `EMP-${year}-${formattedNumber}`;
  } catch (error) {
    console.error('Error generating incremental employee number:', error);
    // Fallback to random generation
    return generateEmployeeNumber(year);
  }
}
