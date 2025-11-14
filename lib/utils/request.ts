import { NextRequest } from 'next/server';

/**
 * Parse JSON from request body with proper error handling
 * @param request - NextRequest object
 * @returns Parsed JSON object
 * @throws Error with descriptive message if parsing fails
 */
export async function parseRequestBody<T = any>(request: NextRequest): Promise<T> {
  try {
    const text = await request.text();
    
    if (!text || text.trim() === '') {
      throw new Error('Request body is empty');
    }
    
    return JSON.parse(text) as T;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('Invalid JSON format in request body');
    }
    throw error;
  }
}

/**
 * Safe JSON parse with fallback
 * @param text - Text to parse
 * @param fallback - Fallback value if parsing fails
 * @returns Parsed object or fallback
 */
export function safeJsonParse<T = any>(text: string, fallback: T): T {
  try {
    return JSON.parse(text) as T;
  } catch {
    return fallback;
  }
}

/**
 * Validate content type is JSON
 * @param request - NextRequest object
 * @returns true if content type is JSON
 */
export function isJsonContentType(request: NextRequest): boolean {
  const contentType = request.headers.get('content-type');
  return contentType?.includes('application/json') ?? false;
}

/**
 * Parse request body with content type validation
 * @param request - NextRequest object
 * @returns Parsed JSON object
 * @throws Error if content type is not JSON or parsing fails
 */
export async function parseJsonRequest<T = any>(request: NextRequest): Promise<T> {
  if (!isJsonContentType(request)) {
    throw new Error('Content-Type must be application/json');
  }
  
  return parseRequestBody<T>(request);
}
