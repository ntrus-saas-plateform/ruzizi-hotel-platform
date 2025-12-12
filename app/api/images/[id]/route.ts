/**
 * Image Serving API Route
 * GET /api/images/[id]
 * 
 * Serves uploaded images from the uploads directory
 */

import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const filename = id;
    
    // Basic security check - prevent directory traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return NextResponse.json({
        success: false,
        error: 'Invalid filename'
      }, { status: 400 });
    }

    // Construct file path
    const filePath = join(process.cwd(), 'public', 'uploads', 'images', filename);
    
    // Check if file exists
    if (!existsSync(filePath)) {
      return NextResponse.json({
        success: false,
        error: 'Image not found'
      }, { status: 404 });
    }

    // Read file
    const fileBuffer = await readFile(filePath);
    
    // Determine content type based on file extension
    const extension = filename.split('.').pop()?.toLowerCase();
    let contentType = 'image/jpeg'; // default
    
    switch (extension) {
      case 'png':
        contentType = 'image/png';
        break;
      case 'webp':
        contentType = 'image/webp';
        break;
      case 'gif':
        contentType = 'image/gif';
        break;
      case 'jpg':
      case 'jpeg':
      default:
        contentType = 'image/jpeg';
        break;
    }

    // Return image with appropriate headers
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
        'Content-Length': fileBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('Error serving image:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to serve image'
    }, { status: 500 });
  }
}