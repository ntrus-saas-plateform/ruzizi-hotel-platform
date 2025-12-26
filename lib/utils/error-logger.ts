/**
 * Enhanced error logging utility with security-aware logging
 * Provides structured logging while protecting sensitive information
 */

export interface LogContext {
  userId?: string;
  operation?: string;
  endpoint?: string;
  userAgent?: string;
  ipAddress?: string;
  timestamp?: string;
  requestId?: string;
  establishmentId?: string;
}

export interface SecurityEvent {
  type: 'ESTABLISHMENT_ACCESS_VIOLATION' | 'UNAUTHORIZED_ACCESS' | 'TOKEN_ABUSE' | 'SUSPICIOUS_ACTIVITY';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  userId?: string;
  details: Record<string, any>;
  context: LogContext;
}

class ErrorLogger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isProduction = process.env.NODE_ENV === 'production';

  /**
   * Log authentication errors with appropriate debugging information
   */
  public logAuthError(error: Error, context: LogContext = {}): void {
    const sanitizedContext = this.sanitizeContext(context);
    const logData = {
      level: 'error',
      source: 'AUTH',
      code: (error as any).code || 'UNKNOWN_AUTH_ERROR',
      message: error.message,
      context: {
        ...sanitizedContext,
        timestamp: new Date().toISOString(),
        stack: this.isDevelopment ? error.stack : undefined,
      }
    };

    if (this.isDevelopment) {
      console.error(`[AUTH] ${logData.code}:`, logData);
    } else {
      // In production, log structured data without sensitive information
      console.error(`[AUTH] ${logData.code}:`, {
        message: logData.message,
        context: logData.context,
      });
    }
  }

  /**
   * Log token management errors without exposing sensitive data
   */
  public logTokenError(operation: string, error: Error, context: LogContext = {}): void {
    const sanitizedContext = this.sanitizeContext(context);
    const logData = {
      level: 'error',
      source: 'TOKEN',
      operation,
      code: (error as any).code || 'TOKEN_ERROR',
      message: error.message,
      context: {
        ...sanitizedContext,
        timestamp: new Date().toISOString(),
        // Never log actual token values
        hasToken: !!(context as any).token,
        tokenLength: (context as any).token?.length || 0,
      }
    };

    // Remove any potential token data from context
    delete (logData.context as any).token;
    delete (logData.context as any).accessToken;
    delete (logData.context as any).refreshToken;

    console.error(`[TOKEN] ${operation.toUpperCase()} ${logData.code}:`, {
      message: logData.message,
      context: logData.context,
    });
  }

  /**
   * Log security events for monitoring
   */
  public logSecurityEvent(event: SecurityEvent): void {
    const sanitizedContext = this.sanitizeContext(event.context);
    const securityLog = {
      level: 'security',
      eventType: event.type,
      severity: event.severity,
      userId: event.userId,
      details: this.sanitizeSecurityDetails(event.details),
      context: {
        ...sanitizedContext,
        timestamp: new Date().toISOString(),
      }
    };

    // Security events always get logged with high visibility
    console.error('🚨 Security Alert:', event.type, securityLog);

    // In production, you might want to send this to a security monitoring service
    if (this.isProduction) {
      this.sendToSecurityMonitoring(securityLog);
    }
  }

  /**
   * Log network errors with retry information
   */
  public logNetworkError(error: Error, context: LogContext = {}): void {
    const sanitizedContext = this.sanitizeContext(context);
    const logData = {
      level: 'error',
      source: 'NETWORK',
      code: 'NETWORK_ERROR',
      message: error.message,
      errorType: error.name,
      context: {
        ...sanitizedContext,
        timestamp: new Date().toISOString(),
        retryable: true,
      }
    };

    console.error(`[NETWORK] ${logData.code}:`, logData);
  }

  /**
   * Log general errors with structured format
   */
  public logError(source: string, code: string, message: string, context: LogContext = {}): void {
    const sanitizedContext = this.sanitizeContext(context);
    const logData = {
      level: 'error',
      source: source.toUpperCase(),
      code,
      message,
      context: {
        ...sanitizedContext,
        timestamp: new Date().toISOString(),
      }
    };

    console.error(`[${logData.source}] ${logData.code}:`, {
      message: logData.message,
      context: logData.context,
    });
  }

  /**
   * Sanitize context to remove sensitive information
   */
  private sanitizeContext(context: LogContext): LogContext {
    const sanitized = { ...context };

    // Mask IP address for privacy (keep first 3 octets)
    if (sanitized.ipAddress) {
      const parts = sanitized.ipAddress.split('.');
      if (parts.length === 4) {
        sanitized.ipAddress = `${parts.slice(0, 3).join('.')}.xxx`;
      }
    }

    // Truncate user agent for privacy
    if (sanitized.userAgent && sanitized.userAgent.length > 50) {
      sanitized.userAgent = sanitized.userAgent.substring(0, 50) + '...';
    }

    // Remove any potential sensitive data
    delete (sanitized as any).password;
    delete (sanitized as any).token;
    delete (sanitized as any).accessToken;
    delete (sanitized as any).refreshToken;
    delete (sanitized as any).secret;

    return sanitized;
  }

  /**
   * Sanitize security event details
   */
  private sanitizeSecurityDetails(details: Record<string, any>): Record<string, any> {
    const sanitized = { ...details };

    // Remove sensitive information from security logs
    delete sanitized.password;
    delete sanitized.token;
    delete sanitized.accessToken;
    delete sanitized.refreshToken;
    delete sanitized.secret;
    delete sanitized.privateKey;

    return sanitized;
  }

  /**
   * Send security events to monitoring service (placeholder)
   */
  private sendToSecurityMonitoring(securityLog: any): void {
    // In a real implementation, this would send to a security monitoring service
    // like Datadog, Splunk, or a custom security dashboard
    if (this.isDevelopment) {
      console.log('📊 Security monitoring (dev):', securityLog);
    }
  }

  /**
   * Create establishment access violation event
   */
  public createEstablishmentAccessViolation(
    userId: string,
    userEstablishmentId: string,
    attemptedEstablishmentId: string,
    resourceType: string,
    resourceId: string,
    context: LogContext = {}
  ): SecurityEvent {
    return {
      type: 'ESTABLISHMENT_ACCESS_VIOLATION',
      severity: 'HIGH',
      userId,
      details: {
        userEstablishmentId,
        attemptedEstablishmentId,
        resourceType,
        resourceId,
        violation: 'cross_establishment_access',
      },
      context: {
        ...context,
        operation: 'establishment_access_check',
      }
    };
  }

  /**
   * Create unauthorized access event
   */
  public createUnauthorizedAccessEvent(
    userId: string | undefined,
    requiredPermission: string,
    context: LogContext = {}
  ): SecurityEvent {
    return {
      type: 'UNAUTHORIZED_ACCESS',
      severity: 'MEDIUM',
      userId,
      details: {
        requiredPermission,
        violation: 'insufficient_permissions',
      },
      context: {
        ...context,
        operation: 'permission_check',
      }
    };
  }
}

// Export singleton instance
export const errorLogger = new ErrorLogger();

// Export class for custom instances
export { ErrorLogger };

export default errorLogger;