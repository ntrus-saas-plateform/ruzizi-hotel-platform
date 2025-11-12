import Performance, { IPerformance } from '@/models/Performance.model';
import connectDB from '@/lib/db/mongodb';

interface CreatePerformanceInput {
  employeeId: string;
  evaluatorId: string;
  period: {
    startDate: Date;
    endDate: Date;
  };
  type: 'quarterly' | 'semi_annual' | 'annual' | 'probation';
  criteria: {
    name: string;
    category: string;
    score: number;
    weight: number;
    comments?: string;
  }[];
  strengths: string[];
  areasForImprovement: string[];
  goals: {
    description: string;
    deadline: Date;
  }[];
  evaluatorComments: string;
}

class PerformanceService {
  // Créer une évaluation
  async create(data: CreatePerformanceInput) {
    try {
      await connectDB();

      const performance = await Performance.create(data);
      return await Performance.findById(performance._id)
        .populate('employeeId', 'firstName lastName employeeNumber')
        .populate('evaluatorId', 'name email');
    } catch (error) {
      console.error('Erreur lors de la création de l\'évaluation:', error);
      throw error;
    }
  }

  // Récupérer toutes les évaluations
  async getAll(filters: {
    employeeId?: string;
    evaluatorId?: string;
    type?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
  } = {}) {
    try {
      await connectDB();

      const query: any = {};

      if (filters.employeeId) query.employeeId = filters.employeeId;
      if (filters.evaluatorId) query.evaluatorId = filters.evaluatorId;
      if (filters.type) query.type = filters.type;
      if (filters.status) query.status = filters.status;

      if (filters.startDate || filters.endDate) {
        query['period.startDate'] = {};
        if (filters.startDate) query['period.startDate'].$gte = filters.startDate;
        if (filters.endDate) query['period.startDate'].$lte = filters.endDate;
      }

      const performances = await Performance.find(query)
        .populate('employeeId', 'firstName lastName employeeNumber')
        .populate('evaluatorId', 'name email')
        .sort({ 'period.startDate': -1 });

      return performances;
    } catch (error) {
      console.error('Erreur lors de la récupération des évaluations:', error);
      throw error;
    }
  }

  // Récupérer une évaluation par ID
  async getById(id: string) {
    try {
      await connectDB();

      const performance = await Performance.findById(id)
        .populate('employeeId', 'firstName lastName employeeNumber position')
        .populate('evaluatorId', 'name email');

      if (!performance) {
        throw new Error('Évaluation non trouvée');
      }

      return performance;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'évaluation:', error);
      throw error;
    }
  }

  // Récupérer l'historique d'un employé
  async getEmployeeHistory(employeeId: string) {
    try {
      await connectDB();

      const performances = await Performance.find({ employeeId })
        .populate('evaluatorId', 'name email')
        .sort({ 'period.startDate': -1 });

      return performances;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'historique:', error);
      throw error;
    }
  }

  // Mettre à jour une évaluation
  async update(id: string, data: Partial<CreatePerformanceInput>) {
    try {
      await connectDB();

      const performance = await Performance.findByIdAndUpdate(
        id,
        { $set: data },
        { new: true, runValidators: true }
      )
        .populate('employeeId', 'firstName lastName employeeNumber')
        .populate('evaluatorId', 'name email');

      if (!performance) {
        throw new Error('Évaluation non trouvée');
      }

      return performance;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'évaluation:', error);
      throw error;
    }
  }

  // Soumettre une évaluation
  async submit(id: string) {
    try {
      await connectDB();

      const performance = await Performance.findByIdAndUpdate(
        id,
        {
          status: 'submitted',
          submittedAt: new Date(),
        },
        { new: true }
      )
        .populate('employeeId', 'firstName lastName employeeNumber')
        .populate('evaluatorId', 'name email');

      if (!performance) {
        throw new Error('Évaluation non trouvée');
      }

      // TODO: Envoyer notification à l'employé

      return performance;
    } catch (error) {
      console.error('Erreur lors de la soumission de l\'évaluation:', error);
      throw error;
    }
  }

  // Accuser réception (employé)
  async acknowledge(id: string, employeeComments?: string) {
    try {
      await connectDB();

      const performance = await Performance.findByIdAndUpdate(
        id,
        {
          status: 'acknowledged',
          acknowledgedAt: new Date(),
          ...(employeeComments && { employeeComments }),
        },
        { new: true }
      )
        .populate('employeeId', 'firstName lastName employeeNumber')
        .populate('evaluatorId', 'name email');

      if (!performance) {
        throw new Error('Évaluation non trouvée');
      }

      return performance;
    } catch (error) {
      console.error('Erreur lors de l\'accusé de réception:', error);
      throw error;
    }
  }

  // Supprimer une évaluation
  async delete(id: string) {
    try {
      await connectDB();

      const performance = await Performance.findByIdAndDelete(id);

      if (!performance) {
        throw new Error('Évaluation non trouvée');
      }

      return { message: 'Évaluation supprimée avec succès' };
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'évaluation:', error);
      throw error;
    }
  }

  // Obtenir les statistiques de performance
  async getStats(filters: {
    employeeId?: string;
    startDate?: Date;
    endDate?: Date;
  } = {}) {
    try {
      await connectDB();

      const matchStage: any = { status: 'submitted' };

      if (filters.employeeId) matchStage.employeeId = filters.employeeId;
      if (filters.startDate || filters.endDate) {
        matchStage['period.startDate'] = {};
        if (filters.startDate) matchStage['period.startDate'].$gte = filters.startDate;
        if (filters.endDate) matchStage['period.startDate'].$lte = filters.endDate;
      }

      const stats = await Performance.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            averageScore: { $avg: '$overallScore' },
            minScore: { $min: '$overallScore' },
            maxScore: { $max: '$overallScore' },
            totalEvaluations: { $sum: 1 },
          },
        },
      ]);

      const scoreDistribution = await Performance.aggregate([
        { $match: matchStage },
        {
          $bucket: {
            groupBy: '$overallScore',
            boundaries: [1, 2, 3, 4, 5, 6],
            default: 'Other',
            output: {
              count: { $sum: 1 },
            },
          },
        },
      ]);

      return {
        ...(stats[0] || {
          averageScore: 0,
          minScore: 0,
          maxScore: 0,
          totalEvaluations: 0,
        }),
        scoreDistribution,
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      throw error;
    }
  }

  // Obtenir les critères par défaut
  getDefaultCriteria() {
    return [
      {
        name: 'Qualité du travail',
        category: 'Performance',
        weight: 20,
      },
      {
        name: 'Productivité',
        category: 'Performance',
        weight: 15,
      },
      {
        name: 'Ponctualité et assiduité',
        category: 'Comportement',
        weight: 15,
      },
      {
        name: 'Travail d\'équipe',
        category: 'Comportement',
        weight: 15,
      },
      {
        name: 'Communication',
        category: 'Compétences',
        weight: 10,
      },
      {
        name: 'Initiative et autonomie',
        category: 'Compétences',
        weight: 10,
      },
      {
        name: 'Respect des procédures',
        category: 'Comportement',
        weight: 10,
      },
      {
        name: 'Développement professionnel',
        category: 'Compétences',
        weight: 5,
      },
    ];
  }
}

export default new PerformanceService();
