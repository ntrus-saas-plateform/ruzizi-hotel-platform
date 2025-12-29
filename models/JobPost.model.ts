import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IJobPost extends Document {
  title: string;
  department: string;
  position: string;
  establishmentId: mongoose.Types.ObjectId;
  description: string;
  requirements: string[];
  responsibilities: string[];
  qualifications: {
    education: string;
    experience: string;
    skills: string[];
  };
  employmentType: 'full_time' | 'part_time' | 'contract' | 'temporary';
  salaryRange: {
    min: number;
    max: number;
    currency: string;
  };
  location: string;
  postedBy: mongoose.Types.ObjectId;
  status: 'draft' | 'published' | 'closed' | 'filled';
  applicationDeadline?: Date;
  applicationsCount: number;
  viewsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IJobPostModel extends Model<IJobPost> {
  findByEstablishment(establishmentId: string): Promise<IJobPost[]>;
  findActive(): Promise<IJobPost[]>;
}

const JobPostSchema = new Schema<IJobPost, IJobPostModel>(
  {
    title: { type: String, required: true },
    department: { type: String, required: true },
    position: { type: String, required: true },
    establishmentId: { type: Schema.Types.ObjectId, ref: 'Establishment', required: true },
    description: { type: String, required: true },
    requirements: [{ type: String }],
    responsibilities: [{ type: String }],
    qualifications: {
      education: { type: String, required: true },
      experience: { type: String, required: true },
      skills: [{ type: String }]
    },
    employmentType: {
      type: String,
      enum: ['full_time', 'part_time', 'contract', 'temporary'],
      required: true
    },
    salaryRange: {
      min: { type: Number, required: true },
      max: { type: Number, required: true },
      currency: { type: String, default: 'BIF' }
    },
    location: { type: String, required: true },
    postedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['draft', 'published', 'closed', 'filled'],
      default: 'draft'
    },
    applicationDeadline: { type: Date },
    applicationsCount: { type: Number, default: 0 },
    viewsCount: { type: Number, default: 0 }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret: any) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

JobPostSchema.index({ establishmentId: 1, status: 1 });
JobPostSchema.index({ status: 1, applicationDeadline: 1 });

JobPostSchema.statics.findByEstablishment = function (establishmentId: string) {
  return this.find({ establishmentId: new mongoose.Types.ObjectId(establishmentId) });
};

JobPostSchema.statics.findActive = function () {
  return this.find({
    status: 'published',
    $or: [
      { applicationDeadline: { $exists: false } },
      { applicationDeadline: { $gte: new Date() } }
    ]
  });
};

export const JobPostModel =
  (mongoose.models.JobPost as IJobPostModel) ||
  mongoose.model<IJobPost, IJobPostModel>('JobPost', JobPostSchema);