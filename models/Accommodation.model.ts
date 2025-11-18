import mongoose, { Schema, Model, Types } from 'mongoose';
import type {
  IAccommodation,
  AccommodationType,
  AccommodationPricingMode,
  AccommodationStatus,
} from '@/types/accommodation.types';

/**
 * Accommodation document interface with methods
 */
export interface IAccommodationDocument extends Omit<IAccommodation, '_id'>, mongoose.Document<Types.ObjectId> {
  toJSON(): Partial<IAccommodation>;
}

/**
 * Accommodation model interface with static methods
 */
export interface IAccommodationModel extends Model<IAccommodationDocument> {
  findByEstablishment(establishmentId: string): Promise<IAccommodationDocument[]>;
  findAvailable(establishmentId?: string): Promise<IAccommodationDocument[]>;
  findByType(type: AccommodationType): Promise<IAccommodationDocument[]>;
  findByStatus(status: AccommodationStatus): Promise<IAccommodationDocument[]>;
}

/**
 * Pricing schema
 */
const PricingSchema = new Schema(
  {
    basePrice: {
      type: Number,
      required: [true, 'Base price is required'],
      min: [0, 'Base price must be positive'],
    },
    seasonalPrice: {
      type: Number,
      min: [0, 'Seasonal price must be positive'],
    },
    currency: {
      type: String,
      enum: ['BIF'],
      default: 'BIF',
    },
  },
  { _id: false }
);

/**
 * Capacity schema
 */
const CapacitySchema = new Schema(
  {
    maxGuests: {
      type: Number,
      required: [true, 'Max guests is required'],
      min: [1, 'Max guests must be at least 1'],
    },
    bedrooms: {
      type: Number,
      required: [true, 'Number of bedrooms is required'],
      min: [0, 'Bedrooms must be non-negative'],
    },
    bathrooms: {
      type: Number,
      required: [true, 'Number of bathrooms is required'],
      min: [0, 'Bathrooms must be non-negative'],
    },
    showers: {
      type: Number,
      required: [true, 'Number of showers is required'],
      min: [0, 'Showers must be non-negative'],
    },
    livingRooms: {
      type: Number,
      required: [true, 'Number of living rooms is required'],
      min: [0, 'Living rooms must be non-negative'],
    },
    kitchens: {
      type: Number,
      required: [true, 'Number of kitchens is required'],
      min: [0, 'Kitchens must be non-negative'],
    },
    balconies: {
      type: Number,
      required: [true, 'Number of balconies is required'],
      min: [0, 'Balconies must be non-negative'],
    },
  },
  { _id: false }
);

/**
 * Details schema
 */
const DetailsSchema = new Schema(
  {
    floor: {
      type: Number,
    },
    area: {
      type: Number,
      min: [0, 'Area must be positive'],
    },
    view: {
      type: String,
      maxlength: [100, 'View description cannot exceed 100 characters'],
    },
    bedType: {
      type: String,
      maxlength: [50, 'Bed type cannot exceed 50 characters'],
    },
  },
  { _id: false }
);

/**
 * Maintenance history schema
 */
const MaintenanceHistorySchema = new Schema(
  {
    date: {
      type: Date,
      required: [true, 'Maintenance date is required'],
    },
    description: {
      type: String,
      required: [true, 'Maintenance description is required'],
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    cost: {
      type: Number,
      min: [0, 'Cost must be positive'],
    },
  },
  { _id: false }
);

/**
 * Accommodation schema
 */
const AccommodationSchema = new Schema<IAccommodationDocument, IAccommodationModel>(
  {
    establishmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Establishment',
      required: [true, 'Establishment is required'],
    },
    name: {
      type: String,
      required: [true, 'Accommodation name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    type: {
      type: String,
      enum: {
        values: ['standard_room', 'suite', 'house', 'apartment'],
        message: '{VALUE} is not a valid accommodation type',
      },
      required: [true, 'Accommodation type is required'],
    },
    pricingMode: {
      type: String,
      enum: {
        values: ['nightly', 'monthly', 'hourly'],
        message: '{VALUE} is not a valid pricing mode',
      },
      required: [true, 'Pricing mode is required'],
    },
    pricing: {
      type: PricingSchema,
      required: [true, 'Pricing information is required'],
    },
    capacity: {
      type: CapacitySchema,
      required: [true, 'Capacity information is required'],
    },
    details: {
      type: DetailsSchema,
      default: {},
    },
    amenities: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: {
        values: ['available', 'occupied', 'maintenance', 'reserved'],
        message: '{VALUE} is not a valid status',
      },
      default: 'available',
    },
    images: {
      type: [String],
      default: [],
    },
    maintenanceHistory: {
      type: [MaintenanceHistorySchema],
      default: [],
    },
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

/**
 * Indexes
 */
AccommodationSchema.index({ establishmentId: 1 });
AccommodationSchema.index({ status: 1 });
AccommodationSchema.index({ type: 1 });
AccommodationSchema.index({ pricingMode: 1 });
AccommodationSchema.index({ establishmentId: 1, status: 1 });
AccommodationSchema.index({ 'pricing.basePrice': 1 });

/**
 * Text index for search
 */
AccommodationSchema.index({ name: 'text' });

/**
 * Static method: Find accommodations by establishment
 */
AccommodationSchema.statics.findByEstablishment = function (establishmentId: string) {
  return this.find({ establishmentId });
};

/**
 * Static method: Find available accommodations
 */
AccommodationSchema.statics.findAvailable = function (establishmentId?: string) {
  const query: any = { status: 'available' };
  if (establishmentId) {
    query.establishmentId = establishmentId;
  }
  return this.find(query);
};

/**
 * Static method: Find accommodations by type
 */
AccommodationSchema.statics.findByType = function (type: AccommodationType) {
  return this.find({ type });
};

/**
 * Static method: Find accommodations by status
 */
AccommodationSchema.statics.findByStatus = function (status: AccommodationStatus) {
  return this.find({ status });
};

/**
 * Virtual: Establishment details (populated)
 */
AccommodationSchema.virtual('establishment', {
  ref: 'Establishment',
  localField: 'establishmentId',
  foreignField: '_id',
  justOne: true,
});

/**
 * Export Accommodation model
 */
export const AccommodationModel =
  (mongoose.models.Accommodation as IAccommodationModel) ||
  mongoose.model<IAccommodationDocument, IAccommodationModel>('Accommodation', AccommodationSchema);

export default AccommodationModel;
