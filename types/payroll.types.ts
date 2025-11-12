export interface PayrollRecord {
  id: string;
  employeeId: string;
  period: {
    month: number;
    year: number;
  };
  baseSalary: number;
  allowances: {
    type: string;
    amount: number;
  }[];
  deductions: {
    type: string;
    amount: number;
  }[];
  bonuses: {
    type: string;
    amount: number;
  }[];
  overtimeHours: number;
  overtimeRate: number;
  totalGross: number;
  totalDeductions: number;
  netSalary: number;
  status: 'draft' | 'pending' | 'approved' | 'paid';
  paidAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePayrollInput {
  employeeId: string;
  period: {
    month: number;
    year: number;
  };
  baseSalary: number;
  allowances?: {
    type: string;
    amount: number;
  }[];
  deductions?: {
    type: string;
    amount: number;
  }[];
  bonuses?: {
    type: string;
    amount: number;
  }[];
  overtimeHours?: number;
  overtimeRate?: number;
  notes?: string;
}

export interface PayrollResponse extends PayrollRecord {}

export interface PayrollFilterOptions {
  employeeId?: string;
  establishmentId?: string;
  month?: number;
  year?: number;
  status?: 'draft' | 'pending' | 'approved' | 'paid';
  page?: number;
  limit?: number;
}

export interface PayrollSummary {
  totalEmployees: number;
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  averageSalary: number;
}
