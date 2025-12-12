/**
 * Image Upload Configuration API Route
 * GET /api/images/config
 * 
 * Provides configuration information for debugging upload issues
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const isProduction = process.env.NODE_ENV === 'production';
    const hasBlobToken = !!process.env.BLOB_READ_WRITE_TOKEN;
    const hasMongoUri = !!process.env.MONGODB_URI;
    
    // Get environment info (safe for client)
    const config = {
      environment: process.env.NODE_ENV || 'development',
      isProduction,
      blobConfigured: hasBlobToken,
      databaseConfigured: hasMongoUri,
      timestamp: new Date().toISOString(),
      recommendations: [] as string[],
    };

    // Add recommendations based on configuration
    if (isProduction && !hasBlobToken) {
      config.recommendations.push('Configure BLOB_READ_WRITE_TOKEN for production image uploads');
    }
    
    if (!hasMongoUri) {
      config.recommendations.push('Configure MONGODB_URI for database connectivity');
    }

    if (isProduction && hasBlobToken) {
      config.recommendations.push('✅ Production ready - Vercel Blob configured');
    }

    return NextResponse.json({
      success: true,
      data: config,
      message: 'Configuration retrieved successfully'
    });

  } catch (error) {
    console.error('Failed to get configuration:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve configuration',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}