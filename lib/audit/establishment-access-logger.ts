import EstablishmentAccessLog, {
  AccessAction,
  ResourceType,
  IEstablishmentAccessLog,
} from '@/models/EstablishmentAccessLog.model';
import { UserRole } from '@/types/user.types';
import mongoose from 'mongoose';

/**
 * Access log entry input
 */
export interface AccessLogEntry {
  timestamp?: Date;
  userId: string;
  userRole: UserRole;
  userEstablishmentId?: string;
  action: AccessAction;
  resourceType: ResourceType;
  resourceId: string;
  resourceEstablishmentId: string;
  allowed: boolean;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Establishment Access Logger
 * 
 * Provides comprehensive audit logging for establishment-based access control.
 * Logs all access attempts (both allowed and denied) for security monitoring
 * and compliance purposes.
 */
export class EstablishmentAccessLogger {
  /**
   * Log an access attempt
   * 
   * @param entry - The access log entry to record
   * @returns Promise resolving to the created log entry
   */
  static async log(entry: AccessLogEntry): Promise<IEstablishmentAccessLog> {
    try {
      const logEntry = await EstablishmentAccessLog.create({
        timestamp: entry.timestamp || new Date(),
        userId: new mongoose.Types.ObjectId(entry.userId),
        userRole: entry.userRole,
        userEstablishmentId: entry.userEstablishmentId
          ? new mongoose.Types.ObjectId(entry.userEstablishmentId)
          : undefined,
        action: entry.action,
        resourceType: entry.resourceType,
        resourceId: entry.resourceId,
        resourceEstablishmentId: new mongoose.Types.ObjectId(entry.resourceEstablishmentId),
        allowed: entry.allowed,
        reason: entry.reason,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
      });

      return logEntry;
    } catch (error) {
      // Log error but don't throw - audit logging should not break the application
      console.error('Failed to create establishment access log:', error);
      throw error;
    }
  }

  /**
   * Get access violations (denied access attempts)
   * 
   * @param since - Get violations since this date
   * @param limit - Maximum number of violations to return (default: 100)
   * @returns Promise resolving to array of violation log entries
   */
  static async getViolations(
    since: Date,
    limit: number = 100
  ): Promise<IEstablishmentAccessLog[]> {
    try {
      const violations = await EstablishmentAccessLog.find({
        allowed: false,
        timestamp: { $gte: since },
      })
        .sort({ timestamp: -1 })
        .limit(limit)
        .populate('userId', 'firstName lastName email role')
        .populate('userEstablishmentId', 'name')
        .populate('resourceEstablishmentId', 'name')
        .lean();

      return violations as IEstablishmentAccessLog[];
    } catch (error) {
      console.error('Failed to retrieve access violations:', error);
      throw error;
    }
  }

  /**
   * Get user activity logs
   * 
   * @param userId - The user ID to get activity for
   * @param since - Get activity since this date
   * @param limit - Maximum number of entries to return (default: 100)
   * @returns Promise resolving to array of user activity log entries
   */
  static async getUserActivity(
    userId: string,
    since: Date,
    limit: number = 100
  ): Promise<IEstablishmentAccessLog[]> {
    try {
      const activity = await EstablishmentAccessLog.find({
        userId: new mongoose.Types.ObjectId(userId),
        timestamp: { $gte: since },
      })
        .sort({ timestamp: -1 })
        .limit(limit)
        .populate('userEstablishmentId', 'name')
        .populate('resourceEstablishmentId', 'name')
        .lean();

      return activity as IEstablishmentAccessLog[];
    } catch (error) {
      console.error('Failed to retrieve user activity:', error);
      throw error;
    }
  }

  /**
   * Get violation count for a user within a time window
   * 
   * @param userId - The user ID to check
   * @param since - Count violations since this date
   * @returns Promise resolving to the count of violations
   */
  static async getViolationCount(userId: string, since: Date): Promise<number> {
    try {
      const count = await EstablishmentAccessLog.countDocuments({
        userId: new mongoose.Types.ObjectId(userId),
        allowed: false,
        timestamp: { $gte: since },
      });

      return count;
    } catch (error) {
      console.error('Failed to count violations:', error);
      throw error;
    }
  }

  /**
   * Get access logs for a specific resource
   * 
   * @param resourceType - The type of resource
   * @param resourceId - The resource ID
   * @param limit - Maximum number of entries to return (default: 50)
   * @returns Promise resolving to array of access log entries for the resource
   */
  static async getResourceAccessHistory(
    resourceType: ResourceType,
    resourceId: string,
    limit: number = 50
  ): Promise<IEstablishmentAccessLog[]> {
    try {
      const history = await EstablishmentAccessLog.find({
        resourceType,
        resourceId,
      })
        .sort({ timestamp: -1 })
        .limit(limit)
        .populate('userId', 'firstName lastName email role')
        .populate('userEstablishmentId', 'name')
        .populate('resourceEstablishmentId', 'name')
        .lean();

      return history as IEstablishmentAccessLog[];
    } catch (error) {
      console.error('Failed to retrieve resource access history:', error);
      throw error;
    }
  }

  /**
   * Check if a user has suspicious activity (multiple violations in short time)
   * 
   * @param userId - The user ID to check
   * @param windowMinutes - Time window in minutes (default: 10)
   * @param threshold - Number of violations to trigger alert (default: 5)
   * @returns Promise resolving to true if suspicious activity detected
   */
  static async hasSuspiciousActivity(
    userId: string,
    windowMinutes: number = 10,
    threshold: number = 5
  ): Promise<boolean> {
    try {
      const since = new Date(Date.now() - windowMinutes * 60 * 1000);
      const count = await this.getViolationCount(userId, since);
      return count >= threshold;
    } catch (error) {
      console.error('Failed to check suspicious activity:', error);
      return false;
    }
  }
}
