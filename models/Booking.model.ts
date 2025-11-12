import mongoose, { Schema, Model } from 'mongoose';
import type { IBooking, BookingStatus, BookingType } from '@/types/booking.types';
import { generateBookingCode } from '@/lib/utils/booking-code';

/**
 * Booking document interface with methods
 */
export interface IBookingDocument extends Omit<IBooking, '_id'>, mongoose.Document {
  toJSON(): Partial<IBooking>;
}

/**
 * Booking model interface with static methods
 */
export interface IBookingModel extends Model<IBookingDocument> {
  findByCode(bookingCode: string): Promise<IBookingDocument | null>;
  findByEstablishment(establishmentId: string): Promise<IBookingDocument[]>;
  findByAccommodation(accommodationId: string): Promise<IBookingDocument[]>;
  findByStatus(status: BookingStatus): Promise<IBookingDocument[]>;
  findByClientEmail(email: string): Promise<IBookingDocument[]>;
}

/**
 * Client info schema
 */
const ClientInfoSchema = new Schema(
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
  },
  { _id: false }
);

/**
 * Pricing details schema
 */
const PricingDetailsSchema = new Schema(
  {
    mode: {
      type: String,
      enum: ['nightly', 'monthly', 'hourly'],
      required: [true, 'Pricing mode is required'],
    },
    unitPrice: {
      type: Number,
      required: [true, 'Unit price is required'],
      min: [0, 'Unit price must be positive'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0, 'Quantity must be positive'],
    },
    subtotal: {
      type: Number,
      required: [true, 'Subtotal is required'],
      min: [0, 'Subtotal must be positive'],
    },
    discount: {
      type: Number,
      min: [0, 'Discount must be positive'],
    },
    tax: {
      type: Number,
      min: [0, 'Tax must be positive'],
    },
    total: {
      type: Number,
      required: [true, 'Total is required'],
      min: [0, 'Total must be positive'],
    },
  },
  { _id: false }
);

/**
 * Booking schema
 */
const BookingSchema = new Schema<IBookingDocument, IBookingModel>(
  {
    bookingCode: {
      type: String,
      required: [true, 'Booking code is required'],
      unique: true,
      uppercase: true,
    },
    establishmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Establishment',
      required: [true, 'Establishment is required'],
    },
    accommodationId: {
      type: Schema.Types.ObjectId,
      ref: 'Accommodation',
      required: [true, 'Accommodation is required'],
    },
    clientInfo: {
      type: ClientInfoSchema,
      required: [true, 'Client information is required'],
    },
    bookingType: {
      type: String,
      enum: {
        values: ['online', 'onsite', 'walkin'],
        message: '{VALUE} is not a valid booking type',
      },
      default: 'online',
    },
    checkIn: {
      type: Date,
      required: [true, 'Check-in date is required'],
    },
    checkOut: {
      type: Date,
      required: [true, 'Check-out date is required'],
    },
    numberOfGuests: {
      type: Number,
      required: [true, 'Number of guests is required'],
      min: [1, 'Number of guests must be at least 1'],
    },
    pricingDetails: {
      type: PricingDetailsSchema,
      required: [true, 'Pricing details are required'],
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'confirmed', 'cancelled', 'completed'],
        message: '{VALUE} is not a valid status',
      },
      default: 'pending',
    },
    paymentStatus: {
      type: String,
      enum: {
        values: ['unpaid', 'partial', 'paid'],
        message: '{VALUE} is not a valid payment status',
      },
      default: 'unpaid',
    },
    notes: {
      type: String,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
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
BookingSchema.index({ bookingCode: 1 });
BookingSchema.index({ establishmentId: 1 });
BookingSchema.index({ accommodationId: 1 });
BookingSchema.index({ status: 1 });
BookingSchema.index({ checkIn: 1 });
BookingSchema.index({ checkOut: 1 });
BookingSchema.index({ 'clientInfo.email': 1 });
BookingSchema.index({ createdAt: -1 });
BookingSchema.index({ establishmentId: 1, status: 1, checkIn: 1 });

/**
 * Pre-save middleware to generate booking code
 */
BookingSchema.pre('save', function (next) {
  if (!this.bookingCode) {
    this.bookingCode = generateBookingCode();
  }
  next();
});

/**
 * Validation: Check-out must be after check-in
 */
BookingSchema.pre('save', function (next) {
  if (this.checkOut <= this.checkIn) {
    return next(new Error('Check-out date must be after check-in date'));
  }
  next();
});

/**
 * Static method: Find booking by code
 */
BookingSchema.statics.findByCode = function (bookingCode: string) {
  return this.findOne({ bookingCode: bookingCode.toUpperCase() });
};

/**
 * Static method: Find bookings by establishment
 */
BookingSchema.statics.findByEstablishment = function (establishmentId: string) {
  return this.find({ establishmentId });
};

/**
 * Static method: Find bookings by accommodation
 */
BookingSchema.statics.findByAccommodation = function (accommodationId: string) {
  return this.find({ accommodationId });
};

/**
 * Static method: Find bookings by status
 */
BookingSchema.statics.findByStatus = function (status: BookingStatus) {
  return this.find({ status });
};

/**
 * Static method: Find bookings by client email
 */
BookingSchema.statics.findByClientEmail = function (email: string) {
  return this.find({ 'clientInfo.email': email.toLowerCase() });
};

/**
 * Virtual: Establishment details (populated)
 */
BookingSchema.virtual('establishment', {
  ref: 'Establishment',
  localField: 'establishmentId',
  foreignField: '_id',
  justOne: true,
});

/**
 * Virtual: Accommodation details (populated)
 */
BookingSchema.virtual('accommodation', {
  ref: 'Accommodation',
  localField: 'accommodationId',
  foreignField: '_id',
  justOne: true,
});

/**
 * Export Booking model
 */
export const BookingModel =
  (mongoose.models.Booking as IBookingModel) ||
  mongoose.model<IBookingDocument, IBookingModel>('Booking', BookingSchema);

export default BookingModel;
