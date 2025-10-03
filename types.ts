export type AppointmentStatus = 'pending' | 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'delayed';

export interface Appointment {
  id: number;
  clientName: string;
  clientPhone: string;
  services: { name: string; value: number; duration: number; category: string }[];
  datetime: Date; // Start time
  endTime: Date; // End time
  status: AppointmentStatus;
  professionalUsername: string; // New field to link appointment to a professional
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

// Renamed from User to Professional and expanded
export interface Professional {
  username: string;
  name: string;
  role: 'admin' | 'professional';
  assignedServices: string[]; // Array of service names this professional provides
}

// FIX: Add StoredProfessional type to correctly model user data with password from localStorage.
// This type reflects the data structure that includes sensitive information like a password
// and accounts for fields that might be optional before data migration handled in LoginScreen.
export interface StoredProfessional {
  name: string;
  password?: string;
  role?: 'admin' | 'professional';
  assignedServices?: string[];
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

// Data structure for the new Financials View
export interface FinancialData {
  monthlyRevenue: { [key: string]: number }; // e.g., {'2024-06': 1500, '2024-07': 2000}
  currentMonthRevenue: number;
  projectedRevenueCurrentMonth: number;
  averageMonthlyRevenue: number;
  totalAnnualRevenue: number;
}