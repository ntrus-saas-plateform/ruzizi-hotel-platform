/**
 * Simple Image Upload API Route
 * POST /api/images/upload
 * 
 * Handles image uploads and returns simple URLs
 */

import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

interface UploadResult {
  url: string;
  filename: string;
}

interface UploadResponse {
  success: boolean;
  results: UploadResult[];
  errors?: string[];
}

/**
 * POST /api/images/upload
 * Simple image upload that returns URLs
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Simple image upload API called');
    
    // Parse form data
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    
    console.log('📁 Files received:', files.length);
    
    if (!files || files.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No files provided'
      }, { status: 400 });
    }

    // Validate file count (max 10 files per request)
    if (files.length > 10) {
      return NextResponse.json({
        success: false,
        error: 'Maximum 10 files allowed per request'
      }, { status: 400 });
    }

    const results: UploadResult[] = [];
    const errors: string[] = [];

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'images');
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (error) {
      // Directory might already exist, ignore error
    }

    // Process each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      try {
        // Basic validation
        if (!file.type.startsWith('image/')) {
          errors.push(`File ${i + 1} (${file.name}): Not an image file`);
          continue;
        }

        // Check file size (max 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
          errors.push(`File ${i + 1} (${file.name}): File too large (max 10MB)`);
          continue;
        }

        // Generate unique filename
        const fileExtension = file.name.split('.').pop() || 'jpg';
        const uniqueFilename = `${uuidv4()}.${fileExtension}`;
        
        // Convert file to buffer and save
        const buffer = Buffer.from(await file.arrayBuffer());
        const filePath = join(uploadsDir, uniqueFilename);
        
        await writeFile(filePath, buffer);
        
        // Create URL (full URL for database storage)
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        const imageUrl = `${baseUrl}/api/images/${uniqueFilename}`;
        
        results.push({
          url: imageUrl,
          filename: uniqueFilename
        });
        
        console.log(`✅ Uploaded: ${file.name} -> ${imageUrl}`);
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`File ${i + 1} (${file.name}): ${errorMessage}`);
        console.error(`❌ Failed to upload ${file.name}:`, error);
      }
    }

    // Check if any files were successfully processed
    if (results.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'All file uploads failed',
        errors
      }, { status: 400 });
    }

    // Prepare response
    const response: UploadResponse = {
      success: true,
      results,
      ...(errors.length > 0 && { errors })
    };

    const statusCode = errors.length > 0 ? 207 : 200; // 207 Multi-Status if partial success
    return NextResponse.json(response, { status: statusCode });

  } catch (error) {
    console.error('Image upload error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred'
    }, { status: 500 });
  }
}

/**
 * GET /api/images/upload
 * Get upload configuration and limits
 */
export async function GET() {
  try {
    const config = {
      maxFileSize: 10 * 1024 * 1024, // 10MB
      allowedFormats: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
      maxFilesPerRequest: 10
    };

    return NextResponse.json({
      success: true,
      data: config,
      message: 'Upload configuration retrieved'
    });
  } catch (error) {
    console.error('Failed to get upload configuration:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to get upload configuration'
    }, { status: 500 });
  }
}