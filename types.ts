export type AppointmentStatus = 'scheduled' | 'completed';

export interface Appointment {
  id: number;
  clientName: string;
  clientPhone: string;
  services: { name: string; value: number; duration: number }[];
  datetime: Date; // Start time
  endTime: Date; // End time
  status: AppointmentStatus;
  observations?: string;
  reminderSent?: boolean;
}

export interface ModalInfo {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm?: () => void;
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