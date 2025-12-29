export interface EmployeePersonalInfo {
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

export interface EmployeeEmploymentInfo {
  employeeNumber: string;
  position: string;
  department: string;
  establishmentId: string;
  hireDate: Date;
  contractType: 'permanent' | 'temporary' | 'contract';
  salary: number;
  status: 'active' | 'inactive' | 'terminated';
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
}

export interface Employee {
  id: string;
  personalInfo: EmployeePersonalInfo;
  employmentInfo: EmployeeEmploymentInfo;
  documents: string[];
  userId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateEmployeeInput {
  personalInfo: EmployeePersonalInfo;
  employmentInfo: Omit<EmployeeEmploymentInfo, 'employeeNumber'>;
  documents?: string[];
  userId?: string;
}

export interface UpdateEmployeeInput {
  personalInfo?: Partial<EmployeePersonalInfo>;
  employmentInfo?: Partial<Omit<EmployeeEmploymentInfo, 'employeeNumber'>>;
  documents?: string[];
}

export interface EmployeeResponse extends Employee {}

export interface EmployeeFilterOptions {
  establishmentId?: string;
  status?: 'active' | 'inactive' | 'terminated';
  department?: string;
  search?: string;
  page?: number;
  limit?: number;
}
