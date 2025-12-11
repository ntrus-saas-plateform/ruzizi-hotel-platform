/**
 * Image validation and security service
 * Provides file type validation, size validation, and security scanning
 */

import { ValidationResult } from './types';
import path from 'path';

export interface ImageValidatorOptions {
    maxFileSize?: number; // in bytes, default 10MB
    allowedFormats?: string[];
    enableMaliciousContentScanning?: boolean;
}

export interface SecurityScanResult {
    isSafe: boolean;
    threats: string[];
    warnings: string[];
}

export class ImageValidator {
    private readonly maxFileSize: number;
    private readonly allowedFormats: Set<string>;
    private readonly enableMaliciousContentScanning: boolean;

    // Magic numbers for image format detection
    private readonly magicNumbers = new Map<string, Buffer[]>([
        ['jpeg', [
            Buffer.from([0xFF, 0xD8, 0xFF]), // JPEG
        ]],
        ['png', [
            Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]), // PNG
        ]],
        ['gif', [
            Buffer.from([0x47, 0x49, 0x46, 0x38, 0x37, 0x61]), // GIF87a
            Buffer.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]), // GIF89a
        ]],
        ['webp', [
            Buffer.from([0x52, 0x49, 0x46, 0x46]), // RIFF (WebP starts with RIFF)
        ]],
    ]);

    constructor(options: ImageValidatorOptions = {}) {
        this.maxFileSize = options.maxFileSize || 10 * 1024 * 1024; // 10MB default
        this.allowedFormats = new Set(options.allowedFormats || ['jpeg', 'png', 'gif', 'webp']);
        this.enableMaliciousContentScanning = options.enableMaliciousContentScanning ?? true;
    }

    /**
     * Validates an uploaded file
     */
    async validateFile(file: File | Buffer, filename?: string): Promise<ValidationResult> {
        const errors: string[] = [];
        const warnings: string[] = [];

        try {
            // Get file buffer
            let buffer: Buffer;
            let name: string;
            
            if (Buffer.isBuffer(file)) {
                buffer = file;
                name = filename || 'unknown';
            } else {
                // file is File type - check if it has arrayBuffer method
                if ('arrayBuffer' in file && typeof file.arrayBuffer === 'function') {
                    buffer = Buffer.from(await file.arrayBuffer());
                    name = filename || ('name' in file ? file.name : 'unknown');
                } else {
                    throw new Error('Invalid file type: expected File or Buffer');
                }
            }

            // Validate file size
            const sizeValidation = this.validateFileSize(buffer);
            if (!sizeValidation.isValid) {
                errors.push(...sizeValidation.errors);
            }

            // Validate file format using magic numbers
            const formatValidation = this.validateFileFormat(buffer, name);
            if (!formatValidation.isValid) {
                errors.push(...formatValidation.errors);
            }

            // Sanitize filename
            const sanitizedName = this.sanitizeFilename(name);
            if (sanitizedName !== name) {
                warnings.push(`Filename was sanitized from "${name}" to "${sanitizedName}"`);
            }

            // Security scanning
            if (this.enableMaliciousContentScanning) {
                const securityScan = await this.scanForMaliciousContent(buffer);
                if (!securityScan.isSafe) {
                    errors.push(...securityScan.threats);
                }
                if (securityScan.warnings.length > 0) {
                    warnings.push(...securityScan.warnings);
                }
            }

            return {
                isValid: errors.length === 0,
                errors,
                warnings: warnings.length > 0 ? warnings : undefined,
            };
        } catch (error) {
            return {
                isValid: false,
                errors: [`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
            };
        }
    }

    /**
     * Validates file size against the maximum allowed size
     */
    validateFileSize(buffer: Buffer): ValidationResult {
        const fileSize = buffer.length;

        if (fileSize > this.maxFileSize) {
            return {
                isValid: false,
                errors: [`File size ${fileSize} bytes exceeds maximum allowed size of ${this.maxFileSize} bytes`],
            };
        }

        if (fileSize === 0) {
            return {
                isValid: false,
                errors: ['File is empty'],
            };
        }

        return {
            isValid: true,
            errors: [],
        };
    }

    /**
     * Validates file format using magic numbers (not just file extension)
     */
    validateFileFormat(buffer: Buffer, filename: string): ValidationResult {
        const errors: string[] = [];

        // Check if buffer is large enough for magic number detection
        if (buffer.length < 8) {
            return {
                isValid: false,
                errors: ['File is too small to determine format'],
            };
        }

        // Detect format using magic numbers
        const detectedFormat = this.detectFormatByMagicNumbers(buffer);

        if (!detectedFormat) {
            return {
                isValid: false,
                errors: ['Unable to detect valid image format from file content'],
            };
        }

        if (!this.allowedFormats.has(detectedFormat)) {
            return {
                isValid: false,
                errors: [`Format "${detectedFormat}" is not allowed. Allowed formats: ${Array.from(this.allowedFormats).join(', ')}`],
            };
        }

        // Additional validation for WebP files
        if (detectedFormat === 'webp') {
            const isValidWebP = this.validateWebPFormat(buffer);
            if (!isValidWebP) {
                errors.push('Invalid WebP file structure');
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }

    /**
     * Detects image format using magic numbers
     */
    private detectFormatByMagicNumbers(buffer: Buffer): string | null {
        for (const [format, magicNumbers] of this.magicNumbers.entries()) {
            for (const magic of magicNumbers) {
                if (buffer.subarray(0, magic.length).equals(magic)) {
                    // Special case for WebP - need to check for 'WEBP' signature
                    if (format === 'webp') {
                        if (buffer.length >= 12 && buffer.subarray(8, 12).toString() === 'WEBP') {
                            return 'webp';
                        }
                    } else {
                        return format;
                    }
                }
            }
        }
        return null;
    }

    /**
     * Validates WebP file structure
     */
    private validateWebPFormat(buffer: Buffer): boolean {
        if (buffer.length < 12) return false;

        // Check RIFF header
        if (!buffer.subarray(0, 4).equals(Buffer.from('RIFF'))) return false;

        // Check WEBP signature
        if (buffer.subarray(8, 12).toString() !== 'WEBP') return false;

        return true;
    }

    /**
     * Sanitizes filename to prevent directory traversal and other security issues
     */
    sanitizeFilename(filename: string): string {
        // Remove path separators and dangerous characters
        let sanitized = filename
            .replace(/[\/\\:*?"<>|]/g, '_') // Replace dangerous characters
            .replace(/\.\./g, '_') // Remove directory traversal attempts
            .replace(/^\.+/, '') // Remove leading dots
            .trim();

        // Ensure filename is not empty after sanitization
        if (!sanitized || sanitized === '_') {
            sanitized = 'unnamed_file';
        }

        // Limit filename length
        const maxLength = 255;
        if (sanitized.length > maxLength) {
            const ext = path.extname(sanitized);
            const name = path.basename(sanitized, ext);
            sanitized = name.substring(0, maxLength - ext.length) + ext;
        }

        return sanitized;
    }

    /**
     * Scans file content for malicious patterns
     */
    private async scanForMaliciousContent(buffer: Buffer): Promise<SecurityScanResult> {
        const threats: string[] = [];
        const warnings: string[] = [];

        try {
            // Convert buffer to string for pattern matching
            const content = buffer.toString('binary');

            // Check for embedded scripts or executable content
            const maliciousPatterns = [
                /<script/i,
                /javascript:/i,
                /vbscript:/i,
                /onload\s*=/i,
                /onerror\s*=/i,
                /onclick\s*=/i,
                /<iframe/i,
                /<object/i,
                /<embed/i,
                /data:text\/html/i,
            ];

            for (const pattern of maliciousPatterns) {
                if (pattern.test(content)) {
                    threats.push(`Potentially malicious content detected: ${pattern.source}`);
                }
            }

            // Check for suspicious file headers that might indicate polyglot files
            const suspiciousHeaders = [
                Buffer.from('MZ'), // PE executable
                Buffer.from('PK'), // ZIP archive
                Buffer.from('%PDF'), // PDF file
            ];

            for (const header of suspiciousHeaders) {
                if (buffer.subarray(0, header.length).equals(header)) {
                    warnings.push(`File contains suspicious header that might indicate a polyglot file`);
                }
            }

            // Check for excessively large metadata sections (potential DoS)
            if (this.hasExcessiveMetadata(buffer)) {
                warnings.push('File contains unusually large metadata sections');
            }

            return {
                isSafe: threats.length === 0,
                threats,
                warnings,
            };
        } catch (error) {
            return {
                isSafe: false,
                threats: [`Security scan failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
                warnings: [],
            };
        }
    }

    /**
     * Checks if file has excessive metadata that could be used for DoS attacks
     */
    private hasExcessiveMetadata(buffer: Buffer): boolean {
        // For JPEG files, check EXIF data size
        if (buffer.length >= 2 && buffer[0] === 0xFF && buffer[1] === 0xD8) {
            let offset = 2;
            while (offset < buffer.length - 1) {
                if (buffer[offset] === 0xFF) {
                    const marker = buffer[offset + 1];
                    if (marker === 0xE1) { // EXIF marker
                        const length = (buffer[offset + 2] << 8) | buffer[offset + 3];
                        // Flag if EXIF data is larger than 64KB
                        if (length > 65536) {
                            return true;
                        }
                    }
                    // Move to next marker
                    const segmentLength = (buffer[offset + 2] << 8) | buffer[offset + 3];
                    offset += 2 + segmentLength;
                } else {
                    break;
                }
            }
        }

        return false;
    }

    /**
     * Gets the maximum allowed file size
     */
    getMaxFileSize(): number {
        return this.maxFileSize;
    }

    /**
     * Gets the allowed file formats
     */
    getAllowedFormats(): string[] {
        return Array.from(this.allowedFormats);
    }
}

// Export default instance with standard configuration
export const imageValidator = new ImageValidator();