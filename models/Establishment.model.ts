import mongoose, { Schema, Model } from 'mongoose';
import type { IEstablishment, PricingMode } from '@/types/establishment.types';

/**
 * Establishment document interface with methods
 */
export interface IEstablishmentDocument extends Omit<IEstablishment, '_id'>, mongoose.Document {
  toJSON(): Partial<IEstablishment>;
}

/**
 * Establishment model interface with static methods
 */
export interface IEstablishmentModel extends Model<IEstablishmentDocument> {
  findByCity(city: string): Promise<IEstablishmentDocument[]>;
  findByManager(managerId: string): Promise<IEstablishmentDocument[]>;
  findActive(): Promise<IEstablishmentDocument[]>;
  findByPricingMode(pricingMode: PricingMode): Promise<IEstablishmentDocument[]>;
}

/**
 * Location schema
 */
const LocationSchema = new Schema(
  {
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      maxlength: [100, 'City name cannot exceed 100 characters'],
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
      maxlength: [200, 'Address cannot exceed 200 characters'],
    },
    coordinates: {
      lat: {
        type: Number,
        required: [true, 'Latitude is required'],
        min: [-90, 'Latitude must be between -90 and 90'],
        max: [90, 'Latitude must be between -90 and 90'],
      },
      lng: {
        type: Number,
        required: [true, 'Longitude is required'],
        min: [-180, 'Longitude must be between -180 and 180'],
        max: [180, 'Longitude must be between -180 and 180'],
      },
    },
  },
  { _id: false }
);

/**
 * Contacts schema
 */
const ContactsSchema = new Schema(
  {
    phone: {
      type: [String],
      required: [true, 'At least one phone number is required'],
      validate: {
        validator: function (v: string[]) {
          return v && v.length > 0;
        },
        message: 'At least one phone number is required',
      },
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
  },
  { _id: false }
);

/**
 * Establishment schema
 */
const EstablishmentSchema = new Schema<IEstablishmentDocument, IEstablishmentModel>(
  {
    name: {
      type: String,
      required: [true, 'Establishment name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [10000, 'Description cannot exceed 1000 characters'],
    },
    location: {
      type: LocationSchema,
      required: [true, 'Location is required'],
    },
    pricingMode: {
      type: String,
      enum: {
        values: ['nightly', 'monthly'],
        message: '{VALUE} is not a valid pricing mode',
      },
      required: [true, 'Pricing mode is required'],
    },
    contacts: {
      type: ContactsSchema,
      required: [true, 'Contact information is required'],
    },
    services: {
      type: [String],
      default: [],
    },
    images: {
      type: [String],
      default: [],
    },
    managerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      //required: [true, 'Manager is required'],
    },
    staffIds: {
      type: [Schema.Types.ObjectId],
      ref: 'User',
      default: [],
    },
    totalCapacity: {
      type: Number,
      required: [true, 'Total capacity is required'],
      min: [1, 'Total capacity must be at least 1'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        ret.id = ret._id?.toString();
        if (ret._id) delete ret._id;
        if ('__v' in ret) delete (ret as any).__v;
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
EstablishmentSchema.index({ name: 1 });
EstablishmentSchema.index({ 'location.city': 1 });
EstablishmentSchema.index({ isActive: 1 });
EstablishmentSchema.index({ managerId: 1 });
EstablishmentSchema.index({ pricingMode: 1 });

/**
 * Text index for search
 */
EstablishmentSchema.index({ name: 'text', description: 'text', 'location.city': 'text' });

/**
 * Static method: Find establishments by city
 */
EstablishmentSchema.statics.findByCity = function (city: string) {
  return this.find({ 'location.city': new RegExp(city, 'i') });
};

/**
 * Static method: Find establishments by manager
 */
EstablishmentSchema.statics.findByManager = function (managerId: string) {
  return this.find({ managerId });
};

/**
 * Static method: Find active establishments
 */
EstablishmentSchema.statics.findActive = function () {
  return this.find({ isActive: true });
};

/**
 * Static method: Find establishments by pricing mode
 */
EstablishmentSchema.statics.findByPricingMode = function (pricingMode: PricingMode) {
  return this.find({ pricingMode });
};

/**
 * Virtual: Manager details (populated)
 */
EstablishmentSchema.virtual('manager', {
  ref: 'User',
  localField: 'managerId',
  foreignField: '_id',
  justOne: true,
});

/**
 * Virtual: Staff details (populated)
 */
EstablishmentSchema.virtual('staff', {
  ref: 'User',
  localField: 'staffIds',
  foreignField: '_id',
});

/**
 * Virtual: Accommodations count
 */
EstablishmentSchema.virtual('accommodationsCount', {
  ref: 'Accommodation',
  localField: '_id',
  foreignField: 'establishmentId',
  count: true,
});

/**
 * Export Establishment model
 */
export const EstablishmentModel =
  (mongoose.models.Establishment as IEstablishmentModel) ||
  mongoose.model<IEstablishmentDocument, IEstablishmentModel>('Establishment', EstablishmentSchema);

export default EstablishmentModel;
