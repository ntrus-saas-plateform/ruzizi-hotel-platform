import mongoose, { Schema, Document, Model } from 'mongoose';
import { generateIncrementalEmployeeNumber } from '@/lib/utils/employee-number';

export interface IEmployeePersonalInfo {
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other';
  nationality: string;
  idNumber: string;
  phone: string;
  email: string;
  address: string;
}

export interface IEmployeeEmploymentInfo {
  employeeNumber?: string; // Optionnel lors de la création, généré automatiquement
  position: string;
  department: string;
  establishmentId: mongoose.Types.ObjectId;
  hireDate: Date;
  contractType: 'permanent' | 'temporary' | 'contract';
  salary: number;
  status: 'active' | 'inactive' | 'terminated';
  managerId?: mongoose.Types.ObjectId; // Référence au manager
  probationEndDate?: Date; // Date de fin de période d'essai
  noticePeriod: number; // Période de préavis en jours
  workSchedule: {
    type: 'full_time' | 'part_time' | 'shift';
    hoursPerWeek: number;
    shiftPattern?: string;
  };
  benefits: {
    healthInsurance: boolean;
    retirementPlan: boolean;
    paidLeaveDays: number;
    sickLeaveDays: number;
  };
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    iban?: string;
  };
}

export interface IEmployee extends Document {
  personalInfo: IEmployeePersonalInfo;
  employmentInfo: IEmployeeEmploymentInfo;
  documents: string[];
  userId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IEmployeeModel extends Model<IEmployee> {
  findByEmployeeNumber(employeeNumber: string): Promise<IEmployee | null>;
  findByEstablishment(establishmentId: string): Promise<IEmployee[]>;
}

const EmployeePersonalInfoSchema = new Schema<IEmployeePersonalInfo>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    gender: { type: String, required: true, enum: ['male', 'female', 'other'] },
    nationality: { type: String, required: true },
    idNumber: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    address: { type: String, required: true },
  },
  { _id: false }
);

const EmployeeEmploymentInfoSchema = new Schema<IEmployeeEmploymentInfo>(
  {
    employeeNumber: { type: String, required: false, unique: true }, // Généré automatiquement
    position: { type: String, required: true },
    department: { type: String, required: true },
    establishmentId: { type: Schema.Types.ObjectId, ref: 'Establishment', required: true },
    hireDate: { type: Date, required: true },
    contractType: { type: String, required: true, enum: ['permanent', 'temporary', 'contract'] },
    salary: { type: Number, required: true, min: 0 },
    status: { type: String, required: true, enum: ['active', 'inactive', 'terminated'], default: 'active' },
    managerId: { type: Schema.Types.ObjectId, ref: 'Employee' },
    probationEndDate: { type: Date },
    noticePeriod: { type: Number, default: 30 },
    workSchedule: {
      type: {
        type: String,
        enum: ['full_time', 'part_time', 'shift'],
        default: 'full_time'
      },
      hoursPerWeek: { type: Number, default: 40 },
      shiftPattern: { type: String }
    },
    benefits: {
      healthInsurance: { type: Boolean, default: false },
      retirementPlan: { type: Boolean, default: false },
      paidLeaveDays: { type: Number, default: 25 },
      sickLeaveDays: { type: Number, default: 10 }
    },
    emergencyContact: {
      name: { type: String, required: true },
      relationship: { type: String, required: true },
      phone: { type: String, required: true }
    },
    bankDetails: {
      bankName: { type: String },
      accountNumber: { type: String },
      iban: { type: String }
    }
  },
  { _id: false }
);

const EmployeeSchema = new Schema<IEmployee, IEmployeeModel>(
  {
    personalInfo: { type: EmployeePersonalInfoSchema, required: true },
    employmentInfo: { type: EmployeeEmploymentInfoSchema, required: true },
    documents: { type: [String], default: [] },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
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

EmployeeSchema.index({ 'employmentInfo.establishmentId': 1 });
EmployeeSchema.index({ 'employmentInfo.status': 1 });
EmployeeSchema.index({ 'personalInfo.email': 1 });

EmployeeSchema.pre('save', async function (next) {
  // Always generate employee number if it's missing (for new documents)
  if (!this.employmentInfo.employeeNumber) {
    try {
      const currentYear = new Date().getFullYear();
      
      // Function to find the last employee number for the given year
      const findLastEmployeeNumber = async (year: number): Promise<string | null> => {
        const lastEmployee = await mongoose.models.Employee
          .findOne({
            'employmentInfo.employeeNumber': new RegExp(`^EMP-${year}-\\d{4}$`)
          })
          .sort({ 'employmentInfo.employeeNumber': -1 })
          .select('employmentInfo.employeeNumber')
          .lean() as { employmentInfo?: { employeeNumber?: string } } | null;
        
        return lastEmployee?.employmentInfo?.employeeNumber || null;
      };

      // Generate incremental employee number
      const employeeNumber = await generateIncrementalEmployeeNumber(
        currentYear,
        findLastEmployeeNumber
      );
      
      console.log('🔢 Generated employee number:', employeeNumber);
      this.employmentInfo.employeeNumber = employeeNumber;
    } catch (error) {
      console.error('Error generating employee number:', error);
      return next(error as Error);
    }
  }

  next();
});

EmployeeSchema.statics.findByEmployeeNumber = function (employeeNumber: string) {
  return this.findOne({ 'employmentInfo.employeeNumber': employeeNumber });
};

EmployeeSchema.statics.findByEstablishment = function (establishmentId: string) {
  return this.find({ 'employmentInfo.establishmentId': new mongoose.Types.ObjectId(establishmentId) });
};

export const EmployeeModel =
  (mongoose.models.Employee as IEmployeeModel) ||
  mongoose.model<IEmployee, IEmployeeModel>('Employee', EmployeeSchema);
