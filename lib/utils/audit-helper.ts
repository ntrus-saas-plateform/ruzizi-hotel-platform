import AuditService from '@/services/Audit.service';
import { AuditAction, AuditEntity } from '@/types/audit.types';

/**
 * Helper pour créer des logs d'audit facilement
 */
export class AuditHelper {
  /**
   * Log une action de création
   */
  static async logCreate(
    userId: string,
    entity: AuditEntity,
    entityId: string,
    metadata?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ) {
    return AuditService.log({
      userId,
      action: 'create',
      entity,
      entityId,
      metadata,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log une action de mise à jour avec les changements
   */
  static async logUpdate(
    userId: string,
    entity: AuditEntity,
    entityId: string,
    oldData: any,
    newData: any,
    metadata?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ) {
    const changes = this.detectChanges(oldData, newData);
    
    return AuditService.log({
      userId,
      action: 'update',
      entity,
      entityId,
      changes,
      metadata,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log une action de suppression
   */
  static async logDelete(
    userId: string,
    entity: AuditEntity,
    entityId: string,
    metadata?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ) {
    return AuditService.log({
      userId,
      action: 'delete',
      entity,
      entityId,
      metadata,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log une action d'approbation
   */
  static async logApprove(
    userId: string,
    entity: AuditEntity,
    entityId: string,
    metadata?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ) {
    return AuditService.log({
      userId,
      action: 'approve',
      entity,
      entityId,
      metadata,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log une action de rejet
   */
  static async logReject(
    userId: string,
    entity: AuditEntity,
    entityId: string,
    metadata?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ) {
    return AuditService.log({
      userId,
      action: 'reject',
      entity,
      entityId,
      metadata,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log une action de paiement
   */
  static async logPayment(
    userId: string,
    entity: AuditEntity,
    entityId: string,
    amount: number,
    method: string,
    metadata?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ) {
    return AuditService.log({
      userId,
      action: 'payment',
      entity,
      entityId,
      metadata: {
        ...metadata,
        amount,
        method,
      },
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log un changement de statut
   */
  static async logStatusChange(
    userId: string,
    entity: AuditEntity,
    entityId: string,
    oldStatus: string,
    newStatus: string,
    metadata?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ) {
    return AuditService.log({
      userId,
      action: 'status_change',
      entity,
      entityId,
      changes: [
        {
          field: 'status',
          oldValue: oldStatus,
          newValue: newStatus,
        },
      ],
      metadata,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Détecte les changements entre deux objets
   */
  private static detectChanges(oldData: any, newData: any) {
    const changes: { field: string; oldValue: any; newValue: any }[] = [];
    
    // Champs à ignorer
    const ignoreFields = ['_id', '__v', 'createdAt', 'updatedAt', 'password'];
    
    // Parcourir les nouvelles données
    for (const key in newData) {
      if (ignoreFields.includes(key)) continue;
      
      const oldValue = oldData[key];
      const newValue = newData[key];
      
      // Vérifier si la valeur a changé
      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes.push({
          field: key,
          oldValue: this.sanitizeValue(oldValue),
          newValue: this.sanitizeValue(newValue),
        });
      }
    }
    
    return changes;
  }

  /**
   * Nettoie les valeurs sensibles avant de les logger
   */
  private static sanitizeValue(value: any): any {
    if (value === null || value === undefined) return value;
    
    // Si c'est un objet avec un _id, ne garder que l'_id
    if (typeof value === 'object' && value._id) {
      return value._id.toString();
    }
    
    // Si c'est un tableau d'objets avec _id
    if (Array.isArray(value) && value.length > 0 && value[0]._id) {
      return value.map(v => v._id.toString());
    }
    
    return value;
  }

  /**
   * Extrait l'IP et le User-Agent d'une requête Next.js
   */
  static extractRequestInfo(request: Request) {
    const headers = request.headers;
    const ipAddress = 
      headers.get('x-forwarded-for')?.split(',')[0] ||
      headers.get('x-real-ip') ||
      'unknown';
    const userAgent = headers.get('user-agent') || 'unknown';
    
    return { ipAddress, userAgent };
  }
}
