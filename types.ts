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
    services: Service[];
    datetime: Date;
    endTime: Date;
    status: AppointmentStatus;
    professionalUsername: string;
    observations?: string;
    isPackageAppointment?: boolean;
}

export interface Client {
    id: string; // Using string to allow for UUIDs or other identifiers
    name: string;
    phone: string;
    email?: string;
    observations?: string;
}

export interface EnrichedClient extends Client {
    totalSpent: number;
    daysSinceLastVisit: number | null;
    cancellationCount: number;
}

export interface BlockedSlot {
    id: number;
    date: Date;
    isFullDay: boolean;
    startTime?: string;
    endTime?: string;
    professionalUsername: string;
}

export interface ModalButton {
    text: string;
    onClick: () => void;
    style: 'primary' | 'secondary' | 'danger';
}

export interface CustomTheme {
    primary: string;
    secondary: string;
    background: string;
    surfaceOpaque: string;
    textDark: string;
    textBody: string;
}

export interface WorkDay {
    start: string;
    end: string;
}

export interface WorkSchedule {
    0?: WorkDay | null; // Sunday
    1?: WorkDay | null; // Monday
    2?: WorkDay | null; // Tuesday
    3?: WorkDay | null; // Wednesday
    4?: WorkDay | null; // Thursday
    5?: WorkDay | null; // Friday
    6?: WorkDay | null; // Saturday
}

// Data stored in localStorage for each user (key is username)
export interface StoredProfessional {
    name: string;
    password?: string;
    role: 'admin' | 'professional';
    assignedServices: string[];
    bio?: string;
    avatarUrl?: string;
    color?: string;
    workSchedule?: WorkSchedule;
}

// Full professional object used in the app
export interface Professional extends StoredProfessional {
    username: string;
}

export interface MonthlyPackage {
    price: number;
}

export interface FinancialData {
    currentMonthRevenue: number;
    projectedRevenueCurrentMonth: number;
    averageMonthlyRevenue: number;
    totalAnnualRevenue: number;
    monthlyRevenue: { [key: string]: number };
    revenueByService: { [key: string]: number };
    revenueByProfessional: { [key: string]: number };
}
