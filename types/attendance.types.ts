export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: Date;
  checkIn?: Date;
  checkOut?: Date;
  breakStart?: Date;
  breakEnd?: Date;
  totalHours: number;
  status: 'present' | 'absent' | 'late' | 'half_day' | 'overtime';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAttendanceInput {
  employeeId: string;
  date: Date;
  checkIn?: Date;
  checkOut?: Date;
  breakStart?: Date;
  breakEnd?: Date;
  status: 'present' | 'absent' | 'late' | 'half_day' | 'overtime';
  notes?: string;
}

export interface AttendanceResponse extends AttendanceRecord {}

export interface AttendanceFilterOptions {
  employeeId?: string;
  establishmentId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  status?: 'present' | 'absent' | 'late' | 'half_day' | 'overtime';
  page?: number;
  limit?: number;
}

export interface AttendanceSummary {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  totalHours: number;
  averageHours: number;
}
