export type AppointmentStatus = 'scheduled' | 'completed';

export interface Appointment {
  id: number;
  clientName: string;
  clientPhone: string;
  service: string;
  datetime: Date;
  value: number;
  status: AppointmentStatus;
  observations?: string;
  reminderSent?: boolean;
}

export interface ModalInfo {
  isOpen: boolean;
  title: string;
  message: string;
}

export interface Client {
  name: string;
  phone: string;
  totalSpent: number;
  daysSinceLastVisit: number | null;
}

export interface BlockedSlot {
  id: number;
  date: Date;
  startTime?: string;
  endTime?: string;
  isFullDay: boolean;
}

export interface User {
  id?: number;
  username: string;
}