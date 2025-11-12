export interface LeaveRecord {
  id: string;
  employeeId: string;
  type: 'annual' | 'sick' | 'maternity' | 'paternity' | 'unpaid' | 'other';
  startDate: Date;
  endDate: Date;
  days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  approvedBy?: string;
  approvedAt?: Date;
  rejectionReason?: string;
  attachments?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateLeaveInput {
  employeeId: string;
  type: 'annual' | 'sick' | 'maternity' | 'paternity' | 'unpaid' | 'other';
  startDate: Date;
  endDate: Date;
  reason: string;
  attachments?: string[];
}

export interface LeaveResponse extends LeaveRecord {}

export interface LeaveFilterOptions {
  employeeId?: string;
  establishmentId?: string;
  type?: 'annual' | 'sick' | 'maternity' | 'paternity' | 'unpaid' | 'other';
  status?: 'pending' | 'approved' | 'rejected' | 'cancelled';
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export interface LeaveBalance {
  employeeId: string;
  year: number;
  annual: {
    total: number;
    used: number;
    remaining: number;
  };
  sick: {
    used: number;
  };
  unpaid: {
    used: number;
  };
}

export interface LeaveSummary {
  totalRequests: number;
  pending: number;
  approved: number;
  rejected: number;
  totalDays: number;
}
