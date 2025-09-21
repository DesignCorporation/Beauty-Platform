// Calendar types for CRM API
// These types match the frontend calendar interface

export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELED';

export type CalendarView = 'day' | 'week' | 'month' | 'staff';

export interface AppointmentFilters {
  staffIds: string[];
  statuses: AppointmentStatus[];
}

export interface CalendarAppointment {
  id: string;
  clientId: string;
  clientName: string;
  serviceIds: string[];
  serviceNames: string[];
  staffId: string;
  staffName: string;
  staffColor?: string;
  staffAvatarUrl?: string;
  startAt: string; // ISO string
  endAt: string;   // ISO string
  status: AppointmentStatus;
  price: number | string; // API может возвращать строку
  currency: string;
  notes: string;
}

// Legacy appointment types for hooks compatibility
export interface Appointment {
  id: string;
  clientId: string;
  clientName: string;
  serviceIds: string[];
  serviceNames: string[];
  staffId: string;
  staffName: string;
  startAt: string;
  endAt: string;
  status: AppointmentStatus;
  price: number | string;
  currency: string;
  notes: string;
}

// Form data interface for appointment creation/editing
export interface AppointmentFormData {
  date: string;          // Date in YYYY-MM-DD format
  startTime: string;     // Time in HH:MM format
  endTime: string;       // Time in HH:MM format
  clientId: string;
  clientName?: string;   // Optional for display
  serviceId: string;     // Single service ID
  serviceIds?: string[]; // Optional multiple service IDs
  serviceNames?: string[]; // Optional for display
  assignedToId: string;  // Staff ID
  staffId?: string;      // Alternative name for assignedToId
  staffName?: string;    // Optional for display
  status?: AppointmentStatus; // Optional, defaults to PENDING
  price?: number | string;    // Optional
  currency?: string;     // Optional
  notes?: string;        // Optional notes
}

// API payload interface for creating appointments
export interface CreateAppointmentData {
  clientId: string;
  serviceIds: string[];
  staffId: string;
  startAt: string;       // ISO string
  endAt: string;         // ISO string
  status: AppointmentStatus;
  notes?: string;
}