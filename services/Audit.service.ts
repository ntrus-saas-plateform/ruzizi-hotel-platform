import { PipelineStage } from 'mongoose';
import AuditLog from '@/models/AuditLog.model';
import { CreateAuditLogInput, AuditAction, AuditEntity } from '@/types/audit.types';
import connectDB from '@/lib/db/mongodb';

class AuditService {
  // Créer un log d'audit
  async log(input: CreateAuditLogInput) {
    try {
      await connectDB();
      
      const auditLog = await AuditLog.create({
        userId: input.userId,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId,
        changes: input.changes,
        metadata: input.metadata,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      });

      return auditLog;
    } catch (error) {
      console.error('Erreur lors de la création du log d\'audit:', error);
      throw error;
    }
  }

  // Récupérer les logs pour une entité spécifique
  async getEntityLogs(entity: AuditEntity, entityId: string) {
    try {
      await connectDB();
      
      const logs = await AuditLog.find({ entity, entityId })
        .populate('userId', 'name email')
        .sort({ timestamp: -1 })
        .limit(100);

      return logs;
    } catch (error) {
      console.error('Erreur lors de la récupération des logs:', error);
      throw error;
    }
  }

  // Récupérer les logs d'un utilisateur
  async getUserLogs(userId: string, limit: number = 50) {
    try {
      await connectDB();
      
      const logs = await AuditLog.find({ userId })
        .sort({ timestamp: -1 })
        .limit(limit);

      return logs;
    } catch (error) {
      console.error('Erreur lors de la récupération des logs utilisateur:', error);
      throw error;
    }
  }

  // Récupérer tous les logs avec filtres
  async getAllLogs(filters: {
    userId?: string;
    action?: AuditAction;
    entity?: AuditEntity;
    entityId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    skip?: number;
  }) {
    try {
      await connectDB();
      
      const query: any = {};
      
      if (filters.userId) query.userId = filters.userId;
      if (filters.action) query.action = filters.action;
      if (filters.entity) query.entity = filters.entity;
      if (filters.entityId) query.entityId = filters.entityId;
      
      if (filters.startDate || filters.endDate) {
        query.timestamp = {};
        if (filters.startDate) query.timestamp.$gte = filters.startDate;
        if (filters.endDate) query.timestamp.$lte = filters.endDate;
      }

      const logs = await AuditLog.find(query)
        .populate('userId', 'name email')
        .sort({ timestamp: -1 })
        .limit(filters.limit || 100)
        .skip(filters.skip || 0);

      const total = await AuditLog.countDocuments(query);

      return { logs, total };
    } catch (error) {
      console.error('Erreur lors de la récupération des logs:', error);
      throw error;
    }
  }

  // Récupérer les statistiques d'audit
  async getStats(startDate?: Date, endDate?: Date) {
    try {
      await connectDB();
      
      const matchStage: any = {};
      if (startDate || endDate) {
        matchStage.timestamp = {};
        if (startDate) matchStage.timestamp.$gte = startDate;
        if (endDate) matchStage.timestamp.$lte = endDate;
      }

      const stats = await AuditLog.aggregate([
        ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
        {
          $group: {
            _id: {
              action: '$action',
              entity: '$entity',
            },
            count: { $sum: 1 },
          },
        },
        {
          $group: {
            _id: '$_id.entity',
            actions: {
              $push: {
                action: '$_id.action',
                count: '$count',
              },
            },
            total: { $sum: '$count' },
          },
        },
        {
          $sort: { total: -1 },
        },
      ] as PipelineStage[]);

      return stats;
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      throw error;
    }
  }

  // Rechercher dans les logs
  async search(searchTerm: string, limit: number = 50) {
    try {
      await connectDB();
      
      const logs = await AuditLog.find({
        $or: [
          { 'metadata.description': { $regex: searchTerm, $options: 'i' } },
          { ipAddress: { $regex: searchTerm, $options: 'i' } },
        ],
      })
        .populate('userId', 'name email')
        .sort({ timestamp: -1 })
        .limit(limit);

      return logs;
    } catch (error) {
      console.error('Erreur lors de la recherche dans les logs:', error);
      throw error;
    }
  }

  // Nettoyer les anciens logs (à exécuter périodiquement)
  async cleanOldLogs(daysToKeep: number = 90) {
    try {
      await connectDB();
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const result = await AuditLog.deleteMany({
        timestamp: { $lt: cutoffDate },
      });

      return {
        deletedCount: result.deletedCount,
        cutoffDate,
      };
    } catch (error) {
      console.error('Erreur lors du nettoyage des logs:', error);
      throw error;
    }
  }
}

export default new AuditService();
