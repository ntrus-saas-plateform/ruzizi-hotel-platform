/**
 * Vercel Blob Information API Route
 * GET /api/images/blob-info
 * 
 * Provides information about blob storage usage and files
 */

import { NextRequest, NextResponse } from 'next/server';
import { list, head } from '@vercel/blob';

/**
 * GET /api/images/blob-info
 * Get blob storage information and file listing
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'stats';
    const limit = parseInt(searchParams.get('limit') || '100');
    const prefix = searchParams.get('prefix') || '';

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json({
        success: false,
        error: 'Blob storage not configured'
      }, { status: 500 });
    }

    switch (action) {
      case 'list':
        // List blobs with optional prefix filter
        const { blobs } = await list({
          limit,
          prefix: prefix || undefined,
        });

        const blobsWithInfo = blobs.map(blob => ({
          url: blob.url,
          pathname: blob.pathname,
          size: blob.size,
          uploadedAt: blob.uploadedAt,
          contentType: 'contentType' in blob ? blob.contentType || 'unknown' : 'unknown',
          isImage: ('contentType' in blob && typeof blob.contentType === 'string' && blob.contentType.startsWith('image/')) || false,
          isThumbnail: blob.pathname.includes('thumbnails/'),
        }));

        return NextResponse.json({
          success: true,
          data: {
            blobs: blobsWithInfo,
            total: blobs.length,
            hasMore: blobs.length === limit,
          }
        });

      case 'stats':
        // Get storage statistics
        const { blobs: allBlobs } = await list({ limit: 1000 });
        
        const totalFiles = allBlobs.length;
        const totalSize = allBlobs.reduce((sum, blob) => sum + blob.size, 0);
        const imageFiles = allBlobs.filter(blob => 'contentType' in blob && typeof blob.contentType === 'string' && blob.contentType.startsWith('image/')).length;
        const thumbnails = allBlobs.filter(blob => blob.pathname.includes('thumbnails/')).length;
        
        const stats = {
          totalFiles,
          totalSize,
          imageFiles,
          thumbnails,
          averageSize: totalFiles > 0 ? Math.round(totalSize / totalFiles) : 0,
          oldestFile: totalFiles > 0 ? Math.min(...allBlobs.map(blob => new Date(blob.uploadedAt).getTime())) : null,
          newestFile: totalFiles > 0 ? Math.max(...allBlobs.map(blob => new Date(blob.uploadedAt).getTime())) : null,
        };

        return NextResponse.json({
          success: true,
          data: stats
        });

      case 'check':
        // Check if specific URL exists
        const url = searchParams.get('url');
        if (!url) {
          return NextResponse.json({
            success: false,
            error: 'URL parameter required for check action'
          }, { status: 400 });
        }

        try {
          const blobInfo = await head(url);
          return NextResponse.json({
            success: true,
            data: {
              exists: true,
              size: blobInfo.size,
              contentType: blobInfo.contentType,
              uploadedAt: blobInfo.uploadedAt,
              cacheControl: blobInfo.cacheControl,
            }
          });
        } catch (error) {
          return NextResponse.json({
            success: true,
            data: {
              exists: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            }
          });
        }

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Supported actions: list, stats, check'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ Blob info error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred'
    }, { status: 500 });
  }
}

/**
 * POST /api/images/blob-info
 * Batch operations on blobs
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, urls } = body;

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json({
        success: false,
        error: 'Blob storage not configured'
      }, { status: 500 });
    }

    switch (action) {
      case 'batch-check':
        if (!urls || !Array.isArray(urls)) {
          return NextResponse.json({
            success: false,
            error: 'URLs array required for batch-check'
          }, { status: 400 });
        }

        const results = await Promise.allSettled(
          urls.map(async (url: string) => {
            try {
              const info = await head(url);
              return {
                url,
                exists: true,
                size: info.size,
                contentType: info.contentType,
                uploadedAt: info.uploadedAt,
              };
            } catch (error) {
              return {
                url,
                exists: false,
                error: error instanceof Error ? error.message : 'Unknown error'
              };
            }
          })
        );

        const batchResults = results.map((result, index) => {
          const baseResult = { url: urls[index] };
          if (result.status === 'fulfilled') {
            return { ...baseResult, ...result.value };
          } else {
            return { ...baseResult, exists: false, error: 'Request failed' };
          }
        });

        return NextResponse.json({
          success: true,
          data: batchResults
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Supported actions: batch-check'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ Blob batch operation error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred'
    }, { status: 500 });
  }
}