export interface MaintenanceRecord {
  id: string;
  accommodationId: string;
  type: 'cleaning' | 'repair' | 'inspection' | 'upgrade' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  description: string;
  scheduledDate: Date;
  completedDate?: Date;
  assignedTo?: string;
  cost?: number;
  notes?: string;
  checklist?: {
    item: string;
    completed: boolean;
  }[];
  attachments?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMaintenanceInput {
  accommodationId: string;
  type: 'cleaning' | 'repair' | 'inspection' | 'upgrade' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  description: string;
  scheduledDate: Date;
  assignedTo?: string;
  cost?: number;
  notes?: string;
  checklist?: {
    item: string;
    completed: boolean;
  }[];
}

export interface MaintenanceResponse extends MaintenanceRecord {}

export interface MaintenanceFilterOptions {
  accommodationId?: string;
  establishmentId?: string;
  type?: 'cleaning' | 'repair' | 'inspection' | 'upgrade' | 'other';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  assignedTo?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
}

export interface MaintenanceSummary {
  total: number;
  scheduled: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  totalCost: number;
}
