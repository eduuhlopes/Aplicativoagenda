

export interface Service {
  name: string;
  value: number;
  duration: number; // in minutes
  category: string;
}

export type AppointmentStatus = 'pending' | 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'delayed';

export interface Appointment {
  id: number;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  services: { name: string; value: number; duration: number; category: string }[];
  datetime: Date; // Start time
  endTime: Date; // End time
  status: AppointmentStatus;
  professionalUsername: string; // New field to link appointment to a professional
  category?: string;
  observations?: string;
  reminderSent?: boolean;
  isPackageAppointment?: boolean;
  packageId?: string;
  paymentStatus?: 'paid' | 'pending';
}

export interface ModalButton {
    text: string;
    onClick: () => void;
    style?: 'primary' | 'secondary' | 'danger';
}

export interface ModalInfo {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm?: () => void;
  buttons?: ModalButton[];
}

export interface WorkDay {
    start: string; // "HH:mm"
    end: string;   // "HH:mm"
}

// Represents the schedule for a professional, where keys are days of the week (0=Sun, 1=Mon, etc.)
export type WorkSchedule = {
    [day in 0 | 1 | 2 | 3 | 4 | 5 | 6]?: WorkDay | null; // null means day off
};

// Renamed from User to Professional and expanded
export interface Professional {
  username: string;
  name: string;
  role: 'admin' | 'professional';
  assignedServices: string[]; // Array of service names this professional provides
  // New professional enhancement fields
  bio?: string;
  avatarUrl?: string;
  color?: string; // Hex color code
  workSchedule?: WorkSchedule;
}

// FIX: Add StoredProfessional type to correctly model user data with password from localStorage.
// This type reflects the data structure that includes sensitive information like a password
// and accounts for fields that might be optional before data migration handled in LoginScreen.
export interface StoredProfessional {
  name: string;
  password?: string;
  role?: 'admin' | 'professional';
  assignedServices?: string[];
  // New professional enhancement fields
  bio?: string;
  avatarUrl?: string;
  color?: string; // Hex color code
  workSchedule?: WorkSchedule;
}

// Represents the client data as it's stored
export interface Client {
  id: number;
  name: string;
  phone: string;
  email?: string;
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
  // New detailed financial metrics
  revenueByService: { [serviceName: string]: number };
  revenueByProfessional: { [professionalName: string]: number };
}

// --- New types for Public Payment Links ---

// Represents the mapping of a public link ID to a client's specific pending appointments
export interface PaymentLink {
    id: string; // Unique ID for the link URL
    clientId: number;
    appointmentIds: number[]; // The specific appointments included in this payment link
    totalDue: number;
    createdAt: Date;
}

// Represents an uploaded payment proof for validation
export interface PaymentProof {
    id: string; // Corresponds to the PaymentLink ID
    clientId: number;
    appointmentIds: number[];
    totalDue: number;
    imageDataUrl: string; // The uploaded image as a Base64 Data URL
    status: 'pending_validation' | 'validated' | 'rejected' | 'manual_approval';
    validatedAt?: Date;
    extractedValue?: number; // The value extracted by the AI
    clientEnteredValue?: number; // The value entered by the client on the public page
}