import { useRef, useEffect } from 'react';
import React from 'react';

interface RenderMetrics {
  componentName: string;
  renderCount: number;
  lastRenderTime: number;
  averageRenderTime: number;
  totalRenderTime: number;
}

// Global render metrics store (only in development)
const renderMetrics = new Map<string, RenderMetrics>();

/**
 * Hook to monitor component render performance
 * Only active in development mode
 */
export function useRenderMonitor(componentName: string) {
  const renderCountRef = useRef(0);
  const startTimeRef = useRef(0);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    const endTime = performance.now();
    const renderTime = endTime - startTimeRef.current;
    
    renderCountRef.current += 1;

    const existing = renderMetrics.get(componentName);
    if (existing) {
      const newTotalTime = existing.totalRenderTime + renderTime;
      const newAverageTime = newTotalTime / renderCountRef.current;
      
      renderMetrics.set(componentName, {
        componentName,
        renderCount: renderCountRef.current,
        lastRenderTime: renderTime,
        averageRenderTime: newAverageTime,
        totalRenderTime: newTotalTime,
      });
    } else {
      renderMetrics.set(componentName, {
        componentName,
        renderCount: 1,
        lastRenderTime: renderTime,
        averageRenderTime: renderTime,
        totalRenderTime: renderTime,
      });
    }
  });

  // Record start time before render
  if (process.env.NODE_ENV === 'development') {
    startTimeRef.current = performance.now();
  }

  return renderCountRef.current;
}

/**
 * Get render metrics for all monitored components
 */
export function getRenderMetrics(): RenderMetrics[] {
  return Array.from(renderMetrics.values());
}

/**
 * Clear all render metrics
 */
export function clearRenderMetrics(): void {
  renderMetrics.clear();
}

/**
 * Log render metrics to console (development only)
 */
export function logRenderMetrics(): void {
  if (process.env.NODE_ENV !== 'development') return;

  const metrics = getRenderMetrics();
  if (metrics.length === 0) {
    console.log('📊 No render metrics available');
    return;
  }

  console.group('📊 Component Render Metrics');
  metrics
    .sort((a, b) => b.renderCount - a.renderCount)
    .forEach(metric => {
      console.log(
        `${metric.componentName}: ${metric.renderCount} renders, ` +
        `avg: ${metric.averageRenderTime.toFixed(2)}ms, ` +
        `last: ${metric.lastRenderTime.toFixed(2)}ms`
      );
    });
  console.groupEnd();
}

/**
 * Higher-order component to automatically monitor renders
 */
export function withRenderMonitor<P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
) {
  const WrappedComponent = (props: P) => {
    const displayName = componentName || Component.displayName || Component.name || 'Unknown';
    useRenderMonitor(displayName);
    
    return React.createElement(Component, props);
  };

  WrappedComponent.displayName = `withRenderMonitor(${componentName || Component.displayName || Component.name})`;
  
  return WrappedComponent;
}