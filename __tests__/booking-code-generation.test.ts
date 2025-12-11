import { generateBookingCode, isValidBookingCode, extractDateFromBookingCode } from '@/lib/utils/booking-code';

describe('Booking Code Generation Tests', () => {
  describe('generateBookingCode', () => {
    test('should generate booking code with correct format', () => {
      const code = generateBookingCode();
      
      // Should match the new format: RZ-MMDD-XXX
      expect(code).toMatch(/^RZ-\d{4}-[A-Z0-9]{3}$/);
      
      // Should start with RZ-
      expect(code.startsWith('RZ-')).toBe(true);
      
      // Should have correct length (11 characters total: RZ-MMDD-XXX)
      expect(code.length).toBe(11);
    });

    test('should generate unique codes on multiple calls', () => {
      const codes = new Set();
      
      // Generate 10 codes and check that most are unique
      // With 3 characters (36^3 = 46,656 combinations), duplicates are rare but possible
      for (let i = 0; i < 10; i++) {
        const code = generateBookingCode();
        codes.add(code);
      }
      
      // Should have at least 8 unique codes out of 10 (allowing for rare duplicates)
      expect(codes.size).toBeGreaterThanOrEqual(8);
    });

    test('should include current month and day in code', () => {
      const code = generateBookingCode();
      const today = new Date();
      const expectedMonth = String(today.getMonth() + 1).padStart(2, '0');
      const expectedDay = String(today.getDate()).padStart(2, '0');
      const expectedDatePart = `${expectedMonth}${expectedDay}`;
      
      expect(code).toContain(expectedDatePart);
    });

    test('should have 3-character random suffix', () => {
      const code = generateBookingCode();
      const parts = code.split('-');
      
      expect(parts).toHaveLength(3);
      expect(parts[0]).toBe('RZ');
      expect(parts[1]).toHaveLength(4); // MMDD
      expect(parts[2]).toHaveLength(3); // XXX
      expect(parts[2]).toMatch(/^[A-Z0-9]{3}$/);
    });
  });

  describe('isValidBookingCode', () => {
    test('should validate correct booking code format', () => {
      const validCodes = [
        'RZ-1211-A3F',
        'RZ-0101-Z9X',
        'RZ-1231-123',
        'RZ-0630-ABC'
      ];

      validCodes.forEach(code => {
        expect(isValidBookingCode(code)).toBe(true);
      });
    });

    test('should reject invalid booking code formats', () => {
      const invalidCodes = [
        'RH-20241211-A3F9', // Old format
        'RZ-1211-A3F9', // Too long suffix
        'RZ-1211-A3', // Too short suffix
        'RZ-121-A3F', // Too short date
        'RZ-12111-A3F', // Too long date
        'rz-1211-a3f', // Lowercase
        'RZ-1211-a3f', // Lowercase suffix
        'RZ-1211-A3f', // Mixed case suffix
        'BK123456789ABC', // Completely different format
        'RZ1211A3F', // Missing separators
        'RZ-1211', // Missing suffix
        'RZ--A3F', // Missing date
        '1211-A3F', // Missing prefix
        ''
      ];

      invalidCodes.forEach(code => {
        expect(isValidBookingCode(code)).toBe(false);
      });
    });

    test('should handle edge cases', () => {
      expect(isValidBookingCode('')).toBe(false);
      expect(isValidBookingCode(' ')).toBe(false);
      expect(isValidBookingCode('null')).toBe(false);
      expect(isValidBookingCode('undefined')).toBe(false);
    });
  });

  describe('extractDateFromBookingCode', () => {
    test('should extract correct date from valid booking code', () => {
      const code = 'RZ-1211-A3F'; // December 11th
      const extractedDate = extractDateFromBookingCode(code);
      
      expect(extractedDate).not.toBeNull();
      expect(extractedDate?.getMonth()).toBe(11); // December (0-indexed)
      expect(extractedDate?.getDate()).toBe(11);
      expect(extractedDate?.getFullYear()).toBe(new Date().getFullYear());
    });

    test('should extract correct date for different months', () => {
      const testCases = [
        { code: 'RZ-0101-ABC', month: 0, day: 1 }, // January 1st
        { code: 'RZ-0630-XYZ', month: 5, day: 30 }, // June 30th
        { code: 'RZ-1231-123', month: 11, day: 31 }, // December 31st
      ];

      testCases.forEach(({ code, month, day }) => {
        const extractedDate = extractDateFromBookingCode(code);
        expect(extractedDate).not.toBeNull();
        expect(extractedDate?.getMonth()).toBe(month);
        expect(extractedDate?.getDate()).toBe(day);
      });
    });

    test('should return null for invalid booking codes', () => {
      const invalidCodes = [
        'RH-20241211-A3F9', // Old format
        'RZ-1211-A3F9', // Invalid format
        'invalid-code',
        '',
        'RZ-1311-ABC', // Invalid month (will pass regex but fail date extraction)
        'RZ-0132-ABC', // Invalid day (will pass regex but fail date extraction)
      ];

      invalidCodes.forEach(code => {
        expect(extractDateFromBookingCode(code)).toBeNull();
      });
    });

    test('should use current year for date extraction', () => {
      const code = 'RZ-0615-DEF';
      const extractedDate = extractDateFromBookingCode(code);
      const currentYear = new Date().getFullYear();
      
      expect(extractedDate?.getFullYear()).toBe(currentYear);
    });
  });

  describe('Code Format Comparison', () => {
    test('new format should be shorter than old format', () => {
      const newCode = generateBookingCode(); // RZ-MMDD-XXX (10 chars)
      const oldFormatExample = 'RH-20241211-A3F9'; // (16 chars)
      
      expect(newCode.length).toBeLessThan(oldFormatExample.length);
      expect(newCode.length).toBe(11);
      expect(oldFormatExample.length).toBe(16);
    });

    test('new format should be more memorable', () => {
      const code = generateBookingCode();
      
      // New format characteristics that make it more memorable:
      // 1. Shorter overall length
      expect(code.length).toBe(11);
      
      // 2. Uses current date (month/day) which is contextually relevant
      const today = new Date();
      const expectedMonth = String(today.getMonth() + 1).padStart(2, '0');
      const expectedDay = String(today.getDate()).padStart(2, '0');
      expect(code).toContain(`${expectedMonth}${expectedDay}`);
      
      // 3. Only 3 random characters instead of 4
      const randomPart = code.split('-')[2];
      expect(randomPart.length).toBe(3);
      
      // 4. Clear structure with meaningful separators
      expect(code.split('-')).toHaveLength(3);
    });
  });
});