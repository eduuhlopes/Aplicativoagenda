export type AppointmentStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'delayed';

export interface Appointment {
  id: number;
  clientName: string;
  clientPhone: string;
  services: { name: string; value: number; duration: number; category: string }[];
  datetime: Date; // Start time
  endTime: Date; // End time
  status: AppointmentStatus;
  category?: string;
  observations?: string;
  reminderSent?: boolean;
}

export interface ModalInfo {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm?: () => void;
}

// Fix: Add missing User type export for LoginScreen.
export interface User {
  username: string;
  name: string;
}

// Represents the client data as it's stored
export interface Client {
  id: number;
  name: string;
  phone: string;
  observations?: string;
}

// Represents the client data combined with calculated stats from appointments for display
export interface EnrichedClient extends Client {
  totalSpent: number;
  daysSinceLastVisit: number | null;
  cancellationCount: number;
}


export interface BlockedSlot {
  id: number;
  date: Date;
  startTime?: string;
  endTime?: string;
  isFullDay: boolean;
}

export interface Service {
  name: string;
  value: number;
  duration: number;
  category: string;
}

export interface MonthlyPackage {
  serviceName: 'Pé+Mão';
  price: number;
}