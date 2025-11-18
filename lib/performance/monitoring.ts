/**
 * Performance monitoring utilities for the application
 * Includes metrics collection, alerting, and performance tracking
 */

import { cache } from './cache';

export interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: Date;
  tags?: Record<string, string>;
}

export interface PerformanceAlert {
  id: string;
  type: 'warning' | 'error' | 'critical';
  message: string;
  metric: string;
  threshold: number;
  currentValue: number;
  timestamp: Date;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private alerts: PerformanceAlert[] = [];
  private readonly maxMetricsHistory = 1000;
  private readonly maxAlertsHistory = 100;
  private thresholds = {
    responseTime: { warning: 1000, error: 5000 }, // ms
    memoryUsage: { warning: 80, error: 95 }, // percentage
    cpuUsage: { warning: 70, error: 90 }, // percentage
    errorRate: { warning: 5, error: 10 }, // percentage
    cacheHitRate: { warning: 70, error: 50 }, // percentage
  };

  /**
   * Record a performance metric
   */
  recordMetric(name: string, value: number, tags?: Record<string, string>): void {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: new Date(),
      tags,
    };

    this.metrics.push(metric);

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics = this.metrics.slice(-this.maxMetricsHistory);
    }

    // Check thresholds and create alerts
    this.checkThresholds(metric);
  }

  /**
   * Start timing an operation
   */
  startTimer(name: string, tags?: Record<string, string>): () => void {
    const startTime = performance.now();

    return () => {
      const duration = performance.now() - startTime;
      this.recordMetric(`${name}_duration`, duration, tags);
    };
  }

  /**
   * Measure async function execution time
   */
  async measureAsync<T>(
    name: string,
    fn: () => Promise<T>,
    tags?: Record<string, string>
  ): Promise<T> {
    const endTimer = this.startTimer(name, tags);

    try {
      const result = await fn();
      endTimer();
      return result;
    } catch (error) {
      endTimer();
      this.recordMetric(`${name}_error`, 1, { ...tags, error: 'true' });
      throw error;
    }
  }

  /**
   * Record database query performance
   */
  recordDatabaseQuery(
    operation: string,
    collection: string,
    duration: number,
    success: boolean = true
  ): void {
    this.recordMetric('db_query_duration', duration, {
      operation,
      collection,
      success: success.toString(),
    });
  }

  /**
   * Record cache performance
   */
  async recordCachePerformance(): Promise<void> {
    try {
      const stats = await cache.getStats();

      if (stats.connected) {
        // Calculate hit rate if we had total requests vs hits
        // For now, just record connection status
        this.recordMetric('cache_connected', 1);
        this.recordMetric('cache_keys_total', stats.total);
        this.recordMetric('cache_keys_active', stats.active);
      } else {
        this.recordMetric('cache_connected', 0);
      }
    } catch (error) {
      console.error('Failed to record cache performance:', error);
      this.recordMetric('cache_error', 1);
    }
  }

  /**
   * Record memory usage
   */
  recordMemoryUsage(): void {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const memUsage = process.memoryUsage();

      this.recordMetric('memory_rss', memUsage.rss / 1024 / 1024, { unit: 'MB' });
      this.recordMetric('memory_heap_used', memUsage.heapUsed / 1024 / 1024, { unit: 'MB' });
      this.recordMetric('memory_heap_total', memUsage.heapTotal / 1024 / 1024, { unit: 'MB' });
      this.recordMetric('memory_external', memUsage.external / 1024 / 1024, { unit: 'MB' });
    }
  }

  /**
   * Record HTTP request metrics
   */
  recordHttpRequest(
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    userAgent?: string
  ): void {
    this.recordMetric('http_request_duration', duration, {
      method,
      path,
      status_code: statusCode.toString(),
      user_agent: userAgent || 'unknown',
    });

    // Record error rate
    if (statusCode >= 400) {
      this.recordMetric('http_error_count', 1, {
        method,
        path,
        status_code: statusCode.toString(),
      });
    }
  }

  /**
   * Get metrics for a specific time range
   */
  getMetrics(
    name?: string,
    startTime?: Date,
    endTime?: Date,
    tags?: Record<string, string>
  ): PerformanceMetric[] {
    let filtered = this.metrics;

    if (name) {
      filtered = filtered.filter(m => m.name === name);
    }

    if (startTime) {
      filtered = filtered.filter(m => m.timestamp >= startTime);
    }

    if (endTime) {
      filtered = filtered.filter(m => m.timestamp <= endTime);
    }

    if (tags) {
      filtered = filtered.filter(m => {
        if (!m.tags) return false;
        return Object.entries(tags).every(([key, value]) => m.tags![key] === value);
      });
    }

    return filtered;
  }

  /**
   * Get aggregated metrics
   */
  getAggregatedMetrics(
    name: string,
    startTime?: Date,
    endTime?: Date
  ): {
    count: number;
    sum: number;
    avg: number;
    min: number;
    max: number;
    p95: number;
    p99: number;
  } | null {
    const metrics = this.getMetrics(name, startTime, endTime);

    if (metrics.length === 0) {
      return null;
    }

    const values = metrics.map(m => m.value).sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);

    return {
      count: values.length,
      sum,
      avg: sum / values.length,
      min: values[0],
      max: values[values.length - 1],
      p95: values[Math.floor(values.length * 0.95)],
      p99: values[Math.floor(values.length * 0.99)],
    };
  }

  /**
   * Get recent alerts
   */
  getAlerts(limit: number = 10): PerformanceAlert[] {
    return this.alerts.slice(-limit);
  }

  /**
   * Check thresholds and create alerts
   */
  private checkThresholds(metric: PerformanceMetric): void {
    const threshold = this.thresholds[metric.name as keyof typeof this.thresholds];

    if (!threshold) {
      return;
    }

    let alertType: 'warning' | 'error' | 'critical' | null = null;
    let message = '';

    if (metric.value >= threshold.error) {
      alertType = 'error';
      message = `${metric.name} exceeded error threshold (${threshold.error})`;
    } else if (metric.value >= threshold.warning) {
      alertType = 'warning';
      message = `${metric.name} exceeded warning threshold (${threshold.warning})`;
    }

    if (alertType) {
      const alert: PerformanceAlert = {
        id: `${metric.name}_${Date.now()}`,
        type: alertType,
        message,
        metric: metric.name,
        threshold: alertType === 'error' ? threshold.error : threshold.warning,
        currentValue: metric.value,
        timestamp: new Date(),
      };

      this.alerts.push(alert);

      // Keep only recent alerts
      if (this.alerts.length > this.maxAlertsHistory) {
        this.alerts = this.alerts.slice(-this.maxAlertsHistory);
      }

      console.warn(`[Performance Alert] ${alert.message} - Current: ${metric.value}`);
    }
  }

  /**
   * Export metrics for external monitoring systems
   */
  exportMetrics(): {
    metrics: PerformanceMetric[];
    alerts: PerformanceAlert[];
    summary: Record<string, any>;
  } {
    const summary: Record<string, any> = {};

    // Calculate summary statistics
    const metricNames = [...new Set(this.metrics.map(m => m.name))];

    for (const name of metricNames) {
      const agg = this.getAggregatedMetrics(name);
      if (agg) {
        summary[name] = agg;
      }
    }

    return {
      metrics: this.metrics,
      alerts: this.alerts,
      summary,
    };
  }

  /**
   * Clear old metrics and alerts
   */
  clearOldData(olderThanHours: number = 24): void {
    const cutoff = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);

    this.metrics = this.metrics.filter(m => m.timestamp > cutoff);
    this.alerts = this.alerts.filter(a => a.timestamp > cutoff);
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'warning' | 'error';
    checks: Record<string, boolean>;
    metrics: Record<string, number>;
  }> {
    const checks: Record<string, boolean> = {};
    const metrics: Record<string, number> = {};

    // Check cache connectivity
    try {
      const cacheStats = await cache.getStats();
      checks.cache = cacheStats.connected;
      metrics.cache_keys = cacheStats.total;
    } catch {
      checks.cache = false;
    }

    // Check memory usage
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const memUsage = process.memoryUsage();
      const heapUsedPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
      checks.memory = heapUsedPercent < 90;
      metrics.memory_usage_percent = heapUsedPercent;
    }

    // Check recent error rate
    const recentErrors = this.getMetrics('http_error_count', new Date(Date.now() - 5 * 60 * 1000));
    const recentRequests = this.getMetrics('http_request_duration', new Date(Date.now() - 5 * 60 * 1000));
    const errorRate = recentRequests.length > 0 ? (recentErrors.length / recentRequests.length) * 100 : 0;
    checks.error_rate = errorRate < 5;
    metrics.error_rate_percent = errorRate;

    // Overall status
    const failingChecks = Object.values(checks).filter(check => !check);
    const status = failingChecks.length === 0 ? 'healthy' : failingChecks.length > 2 ? 'error' : 'warning';

    return {
      status,
      checks,
      metrics,
    };
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Convenience functions for common use cases
export const measureTime = performanceMonitor.measureAsync.bind(performanceMonitor);
export const recordMetric = performanceMonitor.recordMetric.bind(performanceMonitor);
export const startTimer = performanceMonitor.startTimer.bind(performanceMonitor);

/**
 * Middleware for monitoring HTTP requests
 */
export function createPerformanceMiddleware() {
  return (req: any, res: any, next: () => void) => {
    const startTime = performance.now();
    const endTimer = performanceMonitor.startTimer('http_request', {
      method: req.method,
      path: req.path,
    });

    res.on('finish', () => {
      const duration = performance.now() - startTime;
      performanceMonitor.recordHttpRequest(
        req.method,
        req.path,
        res.statusCode,
        duration,
        req.get('User-Agent')
      );
      endTimer();
    });

    next();
  };
}

/**
 * Periodic monitoring task
 */
export function startPeriodicMonitoring(intervalMs: number = 60000): NodeJS.Timeout {
  return setInterval(async () => {
    try {
      // Record system metrics
      performanceMonitor.recordMemoryUsage();
      await performanceMonitor.recordCachePerformance();

      // Health check
      const health = await performanceMonitor.healthCheck();
      if (health.status !== 'healthy') {
        console.warn('[Health Check]', health);
      }

      // Clear old data weekly
      const oneWeek = 24 * 7;
      if (Math.random() < 0.01) { // 1% chance per interval
        performanceMonitor.clearOldData(oneWeek);
      }
    } catch (error) {
      console.error('Periodic monitoring error:', error);
    }
  }, intervalMs);
}