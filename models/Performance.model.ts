import mongoose, { Schema, Model } from 'mongoose';

export interface IPerformance {
  id?: string;
  employeeId: mongoose.Types.ObjectId;
  evaluatorId: mongoose.Types.ObjectId;
  period: {
    startDate: Date;
    endDate: Date;
  };
  type: 'quarterly' | 'semi_annual' | 'annual' | 'probation';
  criteria: {
    name: string;
    category: string;
    score: number; // 1-5
    weight: number; // Percentage
    comments?: string;
  }[];
  overallScore: number;
  strengths: string[];
  areasForImprovement: string[];
  goals: {
    description: string;
    deadline: Date;
    status: 'pending' | 'in_progress' | 'completed';
  }[];
  evaluatorComments: string;
  employeeComments?: string;
  status: 'draft' | 'submitted' | 'acknowledged';
  submittedAt?: Date;
  acknowledgedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PerformanceSchema = new Schema<IPerformance>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    evaluatorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    period: {
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true },
    },
    type: {
      type: String,
      enum: ['quarterly', 'semi_annual', 'annual', 'probation'],
      required: true,
    },
    criteria: [
      {
        name: { type: String, required: true },
        category: { type: String, required: true },
        score: { type: Number, required: true, min: 1, max: 5 },
        weight: { type: Number, required: true, min: 0, max: 100 },
        comments: String,
      },
    ],
    overallScore: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    strengths: [String],
    areasForImprovement: [String],
    goals: [
      {
        description: { type: String, required: true },
        deadline: { type: Date, required: true },
        status: {
          type: String,
          enum: ['pending', 'in_progress', 'completed'],
          default: 'pending',
        },
      },
    ],
    evaluatorComments: {
      type: String,
      required: true,
    },
    employeeComments: String,
    status: {
      type: String,
      enum: ['draft', 'submitted', 'acknowledged'],
      default: 'draft',
    },
    submittedAt: Date,
    acknowledgedAt: Date,
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        ret.id = ret._id?.toString();
        delete (ret as any)._id;
        delete (ret as any).__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
    },
  }
);

// Index composé pour recherches fréquentes
PerformanceSchema.index({ employeeId: 1, 'period.startDate': -1 });
PerformanceSchema.index({ status: 1 });

// Calculer le score global avant sauvegarde
PerformanceSchema.pre('save', function (next) {
  if (this.criteria && this.criteria.length > 0) {
    let totalScore = 0;
    let totalWeight = 0;

    this.criteria.forEach((criterion) => {
      totalScore += criterion.score * (criterion.weight / 100);
      totalWeight += criterion.weight;
    });

    // Normaliser si les poids ne totalisent pas 100%
    if (totalWeight > 0) {
      this.overallScore = Number((totalScore * (100 / totalWeight)).toFixed(2));
    }
  }
  next();
});

const Performance: Model<IPerformance> =
  mongoose.models.Performance ||
  mongoose.model<IPerformance>('Performance', PerformanceSchema);

export default Performance;
