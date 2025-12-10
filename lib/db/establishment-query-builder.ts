import { Model, Query, Aggregate, PipelineStage, Types } from 'mongoose';
import { EstablishmentServiceContext } from '@/lib/services/establishment-context';

/**
 * Establishment Query Builder
 * Automatically injects establishment filtering into MongoDB queries
 * Ensures data isolation at the database query level
 */
export class EstablishmentQueryBuilder<T> {
  constructor(
    private model: Model<T>,
    private context?: EstablishmentServiceContext
  ) {}

  /**
   * Find documents with automatic establishment filtering
   */
  find(filter: any = {}): Query<T[], T> {
    const enhancedFilter = this.applyEstablishmentFilter(filter);
    return this.model.find(enhancedFilter);
  }

  /**
   * Find one document with automatic establishment filtering
   */
  findOne(filter: any = {}): Query<T | null, T> {
    const enhancedFilter = this.applyEstablishmentFilter(filter);
    return this.model.findOne(enhancedFilter);
  }

  /**
   * Find by ID with automatic establishment validation
   * Note: This still needs manual validation after retrieval
   * since findById doesn't support additional filters
   */
  findById(id: string | Types.ObjectId): Query<T | null, T> {
    return this.model.findById(id);
  }

  /**
   * Count documents with automatic establishment filtering
   */
  countDocuments(filter: any = {}): Query<number, T> {
    const enhancedFilter = this.applyEstablishmentFilter(filter);
    return this.model.countDocuments(enhancedFilter);
  }

  /**
   * Update documents with automatic establishment filtering
   */
  updateMany(filter: any, update: any): Query<any, T> {
    const enhancedFilter = this.applyEstablishmentFilter(filter);
    return this.model.updateMany(enhancedFilter, update);
  }

  /**
   * Update one document with automatic establishment filtering
   */
  updateOne(filter: any, update: any): Query<any, T> {
    const enhancedFilter = this.applyEstablishmentFilter(filter);
    return this.model.updateOne(enhancedFilter, update);
  }

  /**
   * Delete documents with automatic establishment filtering
   */
  deleteMany(filter: any = {}): Query<any, T> {
    const enhancedFilter = this.applyEstablishmentFilter(filter);
    return this.model.deleteMany(enhancedFilter);
  }

  /**
   * Delete one document with automatic establishment filtering
   */
  deleteOne(filter: any = {}): Query<any, T> {
    const enhancedFilter = this.applyEstablishmentFilter(filter);
    return this.model.deleteOne(enhancedFilter);
  }

  /**
   * Create aggregation pipeline with automatic establishment filtering
   * Injects $match stage with establishmentId at the beginning of the pipeline
   */
  aggregate(pipeline: PipelineStage[] = []): Aggregate<any[]> {
    const enhancedPipeline = this.applyEstablishmentFilterToPipeline(pipeline);
    return this.model.aggregate(enhancedPipeline);
  }

  /**
   * Apply establishment filter to a query filter object
   * Uses the context to determine if filtering is needed
   */
  private applyEstablishmentFilter(filter: any): any {
    // If no context, return filter as-is (for system operations)
    if (!this.context) {
      return filter;
    }

    // Use context to apply filter
    return this.context.applyFilter(filter);
  }

  /**
   * Apply establishment filter to an aggregation pipeline
   * Injects $match stage at the beginning if needed
   */
  private applyEstablishmentFilterToPipeline(pipeline: PipelineStage[]): PipelineStage[] {
    // If no context or user can access all, return pipeline as-is
    if (!this.context || this.context.canAccessAll()) {
      return pipeline;
    }

    // Get establishment ID from context
    const establishmentId = this.context.getEstablishmentId();
    if (!establishmentId) {
      return pipeline;
    }

    // Check if pipeline already has a $match stage with establishmentId
    const hasEstablishmentMatch = pipeline.some((stage) => {
      if ('$match' in stage) {
        const matchStage = stage.$match as any;
        return 'establishmentId' in matchStage;
      }
      return false;
    });

    // If already has establishment filter, return as-is
    if (hasEstablishmentMatch) {
      return pipeline;
    }

    // Inject $match stage at the beginning
    const establishmentMatch: PipelineStage = {
      $match: {
        establishmentId: new Types.ObjectId(establishmentId),
      },
    };

    return [establishmentMatch, ...pipeline];
  }

  /**
   * Get the underlying model
   * Use with caution - bypasses automatic filtering
   */
  getModel(): Model<T> {
    return this.model;
  }

  /**
   * Get the context
   */
  getContext(): EstablishmentServiceContext | undefined {
    return this.context;
  }

  /**
   * Create a new query builder with a different context
   */
  withContext(context: EstablishmentServiceContext): EstablishmentQueryBuilder<T> {
    return new EstablishmentQueryBuilder(this.model, context);
  }

  /**
   * Create a query builder without context (system operations)
   */
  withoutContext(): EstablishmentQueryBuilder<T> {
    return new EstablishmentQueryBuilder(this.model, undefined);
  }
}

/**
 * Factory function to create an establishment query builder
 */
export function createEstablishmentQueryBuilder<T>(
  model: Model<T>,
  context?: EstablishmentServiceContext
): EstablishmentQueryBuilder<T> {
  return new EstablishmentQueryBuilder(model, context);
}
