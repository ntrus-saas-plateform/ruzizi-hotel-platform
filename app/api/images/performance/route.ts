/**
 * Image Performance Dashboard API
 * GET /api/images/performance
 * 
 * Provides comprehensive performance metrics and recommendations for image system
 */

import { NextRequest, NextResponse } from 'next/server';
import { imagePerformanceMonitor } from '@/lib/image/performance-monitor';
import { withEstablishmentIsolation } from '@/lib/auth/establishment-isolation.middleware';
import { createErrorResponse, createSuccessResponse } from '@/lib/auth/middleware';

interface PerformanceDashboardResponse {
  metrics: any;
  recommendations: any[];
  alerts: any[];
  healthStatus: 'healthy' | 'warning' | 'error';
  summary: {
    totalUploads: number;
    averageUploadTime: number;
    successRate: number;
    storageUsed: string;
    cacheHitRate: number;
  };
}

/**
 * GET /api/images/performance
 * Get comprehensive performance dashboard data
 */
export async function GET(request: NextRequest) {
  return withEstablishmentIsolation(async (req, context) => {
    try {
      const url = new URL(req.url);
      const timeRange = parseInt(url.searchParams.get('hours') || '24');
      
      // Validate time range (1 hour to 30 days)
      if (timeRange < 1 || timeRange > 720) {
        return createErrorResponse(
          'INVALID_TIME_RANGE',
          'Time range must be between 1 and 720 hours',
          400
        );
      }

      // Get comprehensive dashboard data
      const dashboardData = await imagePerformanceMonitor.getDashboardData();
      
      // Get metrics for the specified time range
      const metrics = await imagePerformanceMonitor.getImageMetrics(timeRange);
      
      // Create summary for quick overview
      const summary = {
        totalUploads: metrics.upload.totalUploads,
        averageUploadTime: Math.round(metrics.upload.averageUploadTime),
        successRate: Math.round(metrics.upload.successRate * 100) / 100,
        storageUsed: formatBytes(metrics.storage.totalSize),
        cacheHitRate: Math.round(metrics.serving.cacheHitRate * 100) / 100,
      };

      const response: PerformanceDashboardResponse = {
        metrics: dashboardData.metrics,
        recommendations: dashboardData.recommendations,
        alerts: dashboardData.alerts,
        healthStatus: dashboardData.healthStatus,
        summary,
      };

      return createSuccessResponse(
        response,
        'Performance dashboard data retrieved successfully'
      );

    } catch (error) {
      console.error('Performance dashboard error:', error);
      return createErrorResponse(
        'DASHBOARD_ERROR',
        'Failed to retrieve performance data',
        500
      );
    }
  }, { requireEstablishment: false })(request);
}

/**
 * POST /api/images/performance/cleanup
 * Trigger manual cleanup of orphaned files
 */
export async function POST(request: NextRequest) {
  return withEstablishmentIsolation(async (req, context) => {
    try {
      // Only allow admin users to trigger cleanup
      if (!context.role || !['admin', 'super_admin'].includes(context.role)) {
        return createErrorResponse(
          'INSUFFICIENT_PERMISSIONS',
          'Admin permissions required for cleanup operations',
          403
        );
      }

      // Perform automated cleanup
      const cleanupResult = await imagePerformanceMonitor.performAutomatedCleanup();
      
      return createSuccessResponse(
        {
          filesRemoved: cleanupResult.filesRemoved,
          spaceFreed: formatBytes(cleanupResult.spaceFreed),
          message: `Cleanup completed: ${cleanupResult.filesRemoved} files removed, ${formatBytes(cleanupResult.spaceFreed)} freed`
        },
        'Cleanup completed successfully'
      );

    } catch (error) {
      console.error('Cleanup error:', error);
      return createErrorResponse(
        'CLEANUP_ERROR',
        'Failed to perform cleanup',
        500
      );
    }
  }, { requireEstablishment: false })(request);
}

/**
 * GET /api/images/performance/recommendations
 * Get optimization recommendations
 */
export async function PUT(request: NextRequest) {
  return withEstablishmentIsolation(async (req, context) => {
    try {
      const recommendations = await imagePerformanceMonitor.generateRecommendations();
      
      return createSuccessResponse(
        { recommendations },
        'Optimization recommendations generated'
      );

    } catch (error) {
      console.error('Recommendations error:', error);
      return createErrorResponse(
        'RECOMMENDATIONS_ERROR',
        'Failed to generate recommendations',
        500
      );
    }
  }, { requireEstablishment: false })(request);
}

/**
 * Format bytes to human readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}