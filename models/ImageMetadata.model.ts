import mongoose, { Schema, Model, Types } from 'mongoose';

/**
 * Thumbnail information interface
 */
export interface IThumbnailInfo {
  path: string;
  width: number;
  height: number;
  fileSize: number;
}

/**
 * Thumbnail set interface
 */
export interface IThumbnailSet {
  small: IThumbnailInfo;    // 150x150
  medium: IThumbnailInfo;   // 300x300
  large: IThumbnailInfo;    // 600x400
  xlarge: IThumbnailInfo;   // 1200x800
}

/**
 * Image metadata interface
 */
export interface IImageMetadata {
  _id?: Types.ObjectId;
  id?: string;
  establishmentId: Types.ObjectId;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  dimensions: {
    width: number;
    height: number;
  };
  webpUrl: string;      // URL principale stockée dans images[]
  jpegFallbackUrl: string; // URL de fallback
  thumbnails: IThumbnailSet;
  uploadedAt: Date;
  uploadedBy: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Image metadata document interface with methods
 */
export interface IImageMetadataDocument extends Omit<IImageMetadata, '_id' | 'id'>, mongoose.Document<Types.ObjectId> {
  toJSON(): Partial<IImageMetadata>;
}

/**
 * Image metadata model interface with static methods
 */
export interface IImageMetadataModel extends Model<IImageMetadataDocument> {
  findByEstablishment(establishmentId: string): Promise<IImageMetadataDocument[]>;
  findByUploader(uploadedBy: string): Promise<IImageMetadataDocument[]>;
  findByDateRange(startDate: Date, endDate: Date): Promise<IImageMetadataDocument[]>;
  findByUrl(url: string): Promise<IImageMetadataDocument | null>;
}

/**
 * Thumbnail info schema
 */
const ThumbnailInfoSchema = new Schema(
  {
    path: {
      type: String,
      required: [true, 'Thumbnail path is required'],
    },
    width: {
      type: Number,
      required: [true, 'Thumbnail width is required'],
      min: [1, 'Width must be positive'],
    },
    height: {
      type: Number,
      required: [true, 'Thumbnail height is required'],
      min: [1, 'Height must be positive'],
    },
    fileSize: {
      type: Number,
      required: [true, 'Thumbnail file size is required'],
      min: [0, 'File size must be non-negative'],
    },
  },
  { _id: false }
);

/**
 * Thumbnail set schema
 */
const ThumbnailSetSchema = new Schema(
  {
    small: {
      type: ThumbnailInfoSchema,
      required: [true, 'Small thumbnail is required'],
    },
    medium: {
      type: ThumbnailInfoSchema,
      required: [true, 'Medium thumbnail is required'],
    },
    large: {
      type: ThumbnailInfoSchema,
      required: [true, 'Large thumbnail is required'],
    },
    xlarge: {
      type: ThumbnailInfoSchema,
      required: [true, 'XLarge thumbnail is required'],
    },
  },
  { _id: false }
);

/**
 * Dimensions schema
 */
const DimensionsSchema = new Schema(
  {
    width: {
      type: Number,
      required: [true, 'Image width is required'],
      min: [1, 'Width must be positive'],
    },
    height: {
      type: Number,
      required: [true, 'Image height is required'],
      min: [1, 'Height must be positive'],
    },
  },
  { _id: false }
);

/**
 * Image metadata schema
 */
const ImageMetadataSchema = new Schema<IImageMetadataDocument, IImageMetadataModel>(
  {
    establishmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Establishment',
      required: [true, 'Establishment ID is required'],
      index: true,
    },
    originalFilename: {
      type: String,
      required: [true, 'Original filename is required'],
      trim: true,
      maxlength: [255, 'Filename cannot exceed 255 characters'],
    },
    mimeType: {
      type: String,
      required: [true, 'MIME type is required'],
      enum: {
        values: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        message: '{VALUE} is not a supported image type',
      },
    },
    fileSize: {
      type: Number,
      required: [true, 'File size is required'],
      min: [0, 'File size must be non-negative'],
      max: [10485760, 'File size cannot exceed 10MB'], // 10MB limit
    },
    dimensions: {
      type: DimensionsSchema,
      required: [true, 'Image dimensions are required'],
    },
    webpUrl: {
      type: String,
      required: [true, 'WebP URL is required'],
      // Removed index: true to avoid duplicate with schema.index() below
      trim: true,
      index: true,
    },
    jpegFallbackUrl: {
      type: String,
      required: [true, 'JPEG fallback URL is required'],
      trim: true,
    },
    thumbnails: {
      type: ThumbnailSetSchema,
      required: [true, 'Thumbnails are required'],
    },
    uploadedAt: {
      type: Date,
      required: [true, 'Upload date is required'],
      default: Date.now,
      index: true,
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Uploader ID is required'],
      index: true,
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
 * Indexes for performance optimization
 */
ImageMetadataSchema.index({ establishmentId: 1, uploadedAt: -1 });
ImageMetadataSchema.index({ uploadedBy: 1, uploadedAt: -1 });
ImageMetadataSchema.index({ webpUrl: 1 }, { unique: true });
ImageMetadataSchema.index({ jpegFallbackUrl: 1 });
ImageMetadataSchema.index({ uploadedAt: -1 });
ImageMetadataSchema.index({ 'dimensions.width': 1, 'dimensions.height': 1 });

/**
 * Static method: Find metadata by establishment
 */
ImageMetadataSchema.statics.findByEstablishment = function (establishmentId: string) {
  return this.find({ establishmentId }).sort({ uploadedAt: -1 });
};

/**
 * Static method: Find metadata by uploader
 */
ImageMetadataSchema.statics.findByUploader = function (uploadedBy: string) {
  return this.find({ uploadedBy }).sort({ uploadedAt: -1 });
};

/**
 * Static method: Find metadata by date range
 */
ImageMetadataSchema.statics.findByDateRange = function (startDate: Date, endDate: Date) {
  return this.find({
    uploadedAt: {
      $gte: startDate,
      $lte: endDate,
    },
  }).sort({ uploadedAt: -1 });
};

/**
 * Static method: Find metadata by URL
 */
ImageMetadataSchema.statics.findByUrl = function (url: string) {
  return this.findOne({
    $or: [
      { webpUrl: url },
      { jpegFallbackUrl: url },
    ],
  });
};

/**
 * Virtual: Establishment details (populated)
 */
ImageMetadataSchema.virtual('establishment', {
  ref: 'Establishment',
  localField: 'establishmentId',
  foreignField: '_id',
  justOne: true,
});

/**
 * Virtual: Uploader details (populated)
 */
ImageMetadataSchema.virtual('uploader', {
  ref: 'User',
  localField: 'uploadedBy',
  foreignField: '_id',
  justOne: true,
});

/**
 * Export ImageMetadata model
 */
export const ImageMetadataModel =
  (mongoose.models.ImageMetadata as IImageMetadataModel) ||
  mongoose.model<IImageMetadataDocument, IImageMetadataModel>('ImageMetadata', ImageMetadataSchema);

export default ImageMetadataModel;