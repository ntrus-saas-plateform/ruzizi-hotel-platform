import { NextRequest } from 'next/server';
import { AuditHelper } from '@/lib/utils/audit-helper';
import { AuditEntity } from '@/types/audit.types';

/**
 * Middleware pour logger automatiquement les actions d'audit
 */
export async function withAudit(
  request: NextRequest,
  userId: string,
  entity: AuditEntity,
  entityId: string,
  action: 'create' | 'update' | 'delete' | 'approve' | 'reject' | 'payment',
  metadata?: Record<string, any>
) {
  const { ipAddress, userAgent } = AuditHelper.extractRequestInfo(request);

  try {
    switch (action) {
      case 'create':
        await AuditHelper.logCreate(userId, entity, entityId, metadata, ipAddress, userAgent);
        break;
      case 'update':
        // Pour update, il faudrait passer oldData et newData
        // On utilise juste metadata pour simplifier
        await AuditHelper.logUpdate(userId, entity, entityId, {}, {}, metadata, ipAddress, userAgent);
        break;
      case 'delete':
        await AuditHelper.logDelete(userId, entity, entityId, metadata, ipAddress, userAgent);
        break;
      case 'approve':
        await AuditHelper.logApprove(userId, entity, entityId, metadata, ipAddress, userAgent);
        break;
      case 'reject':
        await AuditHelper.logReject(userId, entity, entityId, metadata, ipAddress, userAgent);
        break;
      case 'payment':
        await AuditHelper.logPayment(
          userId,
          entity,
          entityId,
          metadata?.amount || 0,
          metadata?.method || 'unknown',
          metadata,
          ipAddress,
          userAgent
        );
        break;
    }
  } catch (error) {
    // Ne pas bloquer la requête si l'audit échoue
    console.error('Erreur lors du logging d\'audit:', error);
  }
}

/**
 * Wrapper pour les handlers d'API avec audit automatique
 */
export function withAuditLog(
  handler: (request: NextRequest, context: any) => Promise<Response>,
  entity: AuditEntity,
  getEntityId: (request: NextRequest, context: any) => string,
  action: 'create' | 'update' | 'delete' | 'approve' | 'reject' | 'payment'
) {
  return async (request: NextRequest, context: any) => {
    const response = await handler(request, context);
    
    // Si la requête a réussi (2xx), logger l'audit
    if (response.ok) {
      try {
        const userId = (request as any).user?.id; // Supposant que l'user est attaché par le middleware d'auth
        if (userId) {
          const entityId = getEntityId(request, context);
          await withAudit(request, userId, entity, entityId, action);
        }
      } catch (error) {
        console.error('Erreur lors du logging d\'audit:', error);
      }
    }
    
    return response;
  };
}
