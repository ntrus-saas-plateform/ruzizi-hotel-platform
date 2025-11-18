import mongoose, { Schema, Model, Types } from 'mongoose';
import type { IClient, ClientClassification } from '@/types/client.types';

/**
 * Client document interface with methods
 */
export interface IClientDocument extends Omit<IClient, '_id'>, mongoose.Document<Types.ObjectId> {
  toJSON(): Partial<IClient>;
}

/**
 * Client model interface with static methods
 */
export interface IClientModel extends Model<IClientDocument> {
  findByEmail(email: string): Promise<IClientDocument | null>;
  findByPhone(phone: string): Promise<IClientDocument | null>;
  findByClassification(classification: ClientClassification): Promise<IClientDocument[]>;
}

/**
 * Personal info schema
 */
const PersonalInfoSchema = new Schema(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: [50, 'First name cannot exceed 50 characters'],
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      minlength: [8, 'Phone number must be at least 8 characters'],
      maxlength: [20, 'Phone number cannot exceed 20 characters'],
    },
    idNumber: {
      type: String,
      trim: true,
      maxlength: [50, 'ID number cannot exceed 50 characters'],
    },
    address: {
      type: String,
      trim: true,
      maxlength: [200, 'Address cannot exceed 200 characters'],
    },
  },
  { _id: false }
);

/**
 * Discount schema
 */
const DiscountSchema = new Schema(
  {
    type: {
      type: String,
      required: [true, 'Discount type is required'],
      maxlength: [50, 'Discount type cannot exceed 50 characters'],
    },
    percentage: {
      type: Number,
      required: [true, 'Discount percentage is required'],
      min: [0, 'Percentage must be positive'],
      max: [100, 'Percentage cannot exceed 100'],
    },
    validUntil: {
      type: Date,
    },
  },
  { _id: false }
);

/**
 * Client schema
 */
const ClientSchema = new Schema<IClientDocument, IClientModel>(
  {
    personalInfo: {
      type: PersonalInfoSchema,
      required: [true, 'Personal information is required'],
    },
    classification: {
      type: String,
      enum: {
        values: ['regular', 'walkin', 'corporate'],
        message: '{VALUE} is not a valid classification',
      },
      default: 'regular',
    },
    preferences: {
      type: [String],
      default: [],
    },
    bookingHistory: {
      type: [Schema.Types.ObjectId],
      ref: 'Booking',
      default: [],
    },
    totalStays: {
      type: Number,
      default: 0,
      min: [0, 'Total stays must be non-negative'],
    },
    totalSpent: {
      type: Number,
      default: 0,
      min: [0, 'Total spent must be non-negative'],
    },
    debt: {
      type: Number,
      default: 0,
    },
    discounts: {
      type: [DiscountSchema],
      default: [],
    },
    notes: {
      type: String,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
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
ClientSchema.index({ 'personalInfo.phone': 1 });
ClientSchema.index({ classification: 1 });
ClientSchema.index({ totalStays: -1 });

/**
 * Text index for search
 */
ClientSchema.index({
  'personalInfo.firstName': 'text',
  'personalInfo.lastName': 'text',
  'personalInfo.email': 'text',
});

/**
 * Static method: Find client by email
 */
ClientSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ 'personalInfo.email': email.toLowerCase() });
};

/**
 * Static method: Find client by phone
 */
ClientSchema.statics.findByPhone = function (phone: string) {
  return this.findOne({ 'personalInfo.phone': phone });
};

/**
 * Static method: Find clients by classification
 */
ClientSchema.statics.findByClassification = function (classification: ClientClassification) {
  return this.find({ classification });
};

/**
 * Virtual: Full name
 */
ClientSchema.virtual('fullName').get(function () {
  return `${this.personalInfo.firstName} ${this.personalInfo.lastName}`;
});

/**
 * Export Client model
 */
export const ClientModel =
  (mongoose.models.Client as IClientModel) ||
  mongoose.model<IClientDocument, IClientModel>('Client', ClientSchema);

export default ClientModel;
