import React, { useState, useEffect, useCallback } from 'react';
import CalendarView from './components/CalendarView';
import ClientList from './components/ClientList';
import FinancialsView from './components/FinancialsView';
import ServicesView from './components/ServicesView';
import Settings from './components/Settings';
import Header from './components/Header';
import LoginScreen from './components/LoginScreen';
import Modal from './components/Modal';
import Toast from './components/Toast';
import AppointmentForm from './components/AppointmentForm';
import ClientForm from './components/ClientForm';
import BookingRequestManager from './components/BookingRequestManager';
import { Appointment, Client, Service, BlockedSlot, EnrichedClient, Professional, StoredProfessional, MonthlyPackage, CustomTheme } from './types';
import { SERVICES } from './constants';
import { hexToRgb, adjustRgbColor, rgbToRgba } from './components/colorUtils';


const defaultCustomTheme: CustomTheme = {
  primary: '#C77D93',
  secondary: '#8A5F8A',
  background: '#FEFBFB',
  surfaceOpaque: '#FDF2F8',
  textDark: '#4A235A',
  textBody: '#57415F',
};


const App: React.FC = () => {
    // State management
    const [currentUser, setCurrentUser] = useState<Professional | null>(null);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
    const [professionals, setProfessionals] = useState<Record<string, StoredProfessional>>({});
    const [monthlyPackage, setMonthlyPackage] = useState<MonthlyPackage>({ price: 200 });
    const [bookingRequests, setBookingRequests] = useState<Appointment[]>([]);

    // UI State
    const [activeView, setActiveView] = useState('calendar');
    const [isAppointmentModalOpen, setAppointmentModalOpen] = useState(false);
    const [isClientModalOpen, setClientModalOpen] = useState(false);
    const [isBookingRequestModalOpen, setBookingRequestModalOpen] = useState(false);
    const [appointmentToEdit, setAppointmentToEdit] = useState<Appointment | null>(null);
    const [clientToEdit, setClientToEdit] = useState<Client | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Theme State
    const [theme, setTheme] = useState(() => {
        try {
            return localStorage.getItem('app-theme') || 'pink';
        } catch {
            return 'pink';
        }
    });
    const [customTheme, setCustomTheme] = useState<CustomTheme>(() => {
        try {
            const stored = localStorage.getItem('app-custom-theme');
            return stored ? JSON.parse(stored) : defaultCustomTheme;
        } catch {
            return defaultCustomTheme;
        }
    });

    // Effect to apply and persist theme
    useEffect(() => {
        const root = document.documentElement;
        const themeVars = ['--background', '--surface', '--surface-opaque', '--primary', '--primary-light', '--primary-hover', '--secondary', '--accent', '--text-dark', '--text-body', '--border', '--highlight'];
        
        const clearCustomThemeStyles = () => {
            themeVars.forEach(v => root.style.removeProperty(v));
        };

        if (theme === 'custom') {
            root.removeAttribute('data-theme');
            const primaryRgb = hexToRgb(customTheme.primary);
            const surfaceOpaqueRgb = hexToRgb(customTheme.surfaceOpaque);

            if (primaryRgb && surfaceOpaqueRgb) {
                root.style.setProperty('--primary', customTheme.primary);
                root.style.setProperty('--secondary', customTheme.secondary);
                root.style.setProperty('--background', customTheme.background);
                root.style.setProperty('--surface-opaque', customTheme.surfaceOpaque);
                root.style.setProperty('--text-dark', customTheme.textDark);
                root.style.setProperty('--text-body', customTheme.textBody);
                root.style.setProperty('--primary-light', adjustRgbColor(primaryRgb, 30));
                root.style.setProperty('--primary-hover', adjustRgbColor(primaryRgb, -20));
                root.style.setProperty('--accent', adjustRgbColor(primaryRgb, 30));
                root.style.setProperty('--surface', rgbToRgba(surfaceOpaqueRgb, 0.85));
                root.style.setProperty('--border', rgbToRgba(primaryRgb, 0.2));
                root.style.setProperty('--highlight', rgbToRgba(surfaceOpaqueRgb, 0.5));
            }
        } else {
            clearCustomThemeStyles();
            root.setAttribute('data-theme', theme);
        }

        try {
            localStorage.setItem('app-theme', theme);
        } catch (e) {
            console.error("Failed to save theme to localStorage", e);
        }
    }, [theme, customTheme]);

    const handleThemeChange = (themeName: string) => {
        setTheme(themeName);
    };

    const handleCustomThemeChange = (newCustomTheme: CustomTheme) => {
        setCustomTheme(newCustomTheme);
        try {
            localStorage.setItem('app-custom-theme', JSON.stringify(newCustomTheme));
        } catch (e) {
            console.error("Failed to save custom theme to localStorage", e);
        }
    };


    // Login
    const handleLogin = (user: Professional) => {
        setCurrentUser(user);
        localStorage.setItem('spaco-delas-currentUser', JSON.stringify(user));
    };

    const handleLogout = () => {
        setCurrentUser(null);
        localStorage.removeItem('spaco-delas-currentUser');
    };

    // Data handling
    useEffect(() => {
        // Load data from localStorage on initial render
        const loggedInUser = localStorage.getItem('spaco-delas-currentUser');
        if (loggedInUser) {
            setCurrentUser(JSON.parse(loggedInUser));
        }
        // You would continue to load other data here...
    }, []);

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const openAppointmentModal = (appointment: Appointment | null = null) => {
        setAppointmentToEdit(appointment);
        setAppointmentModalOpen(true);
    };
    
    const openClientModal = (client: Client | null = null) => {
        setClientToEdit(client);
        setClientModalOpen(true);
    };

    const enrichedClients: EnrichedClient[] = clients.map(client => {
        const clientAppointments = appointments.filter(a => a.clientPhone === client.phone);
        const completedAppointments = clientAppointments.filter(a => a.status === 'completed');
        const totalSpent = completedAppointments.reduce((sum, appt) => sum + appt.services.reduce((s, serv) => s + serv.value, 0), 0);
        const cancellationCount = clientAppointments.filter(a => a.status === 'cancelled').length;
        
        const lastVisit = completedAppointments.sort((a,b) => b.datetime.getTime() - a.datetime.getTime())[0];
        let daysSinceLastVisit: number | null = null;
        if (lastVisit) {
            daysSinceLastVisit = Math.floor((new Date().getTime() - new Date(lastVisit.datetime).getTime()) / (1000 * 3600 * 24));
        }

        return {
            ...client,
            totalSpent,
            cancellationCount,
            daysSinceLastVisit,
        };
    });

    // FIX: Cast `data` from Object.entries to `StoredProfessional` to resolve a TypeScript error where `data` might be inferred as `unknown`.
    // This ensures `data` is treated as an object type for the spread operator.
    const professionalsList: Professional[] = Object.entries(professionals).map(([username, data]) => ({
        username,
        ...(data as StoredProfessional),
    }));

    if (!currentUser) {
        return <LoginScreen onLogin={handleLogin} showToast={showToast} />;
    }
    
    return (
        <div className="app-container">
            {toast && <div className="toast-container"><Toast message={toast.message} type={toast.type} /></div>}
            
            <Header 
                logoUrl={"/logo.png"} 
                headerStyle={null} 
                notificationAppointments={[]} 
                bookingRequests={bookingRequests}
                isNotificationPopoverOpen={false}
                onToggleNotificationPopover={() => {}}
                onOpenBookingRequestModal={() => setBookingRequestModalOpen(true)}
                currentUser={currentUser}
                onLogout={handleLogout}
            />

            <main className="p-4 sm:p-6">
                {/* Modals */}
                {isAppointmentModalOpen && (
                    <AppointmentForm 
                        onSave={() => {}} 
                        onCancel={() => setAppointmentModalOpen(false)} 
                        appointmentToEdit={appointmentToEdit}
                        services={services}
                        clients={clients}
                        professionals={professionalsList}
                        currentUser={currentUser}
                        blockedSlots={blockedSlots}
                    />
                )}
                {isClientModalOpen && (
                    <Modal isOpen={isClientModalOpen} title={clientToEdit ? 'Editar Cliente' : 'Nova Cliente'} message="" onClose={() => setClientModalOpen(false)}>
                        <ClientForm 
                            onSave={() => {}}
                            clientToEdit={clientToEdit}
                            onCancel={() => setClientModalOpen(false)}
                            existingClients={clients}
                        />
                    </Modal>
                )}
                <BookingRequestManager 
                    isOpen={isBookingRequestModalOpen}
                    onClose={() => setBookingRequestModalOpen(false)}
                    requests={bookingRequests}
                    professionals={professionalsList}
                    onApprove={() => {}}
                    onReject={() => {}}
                />

                <nav className="mb-6">
                    {/* Basic Navigation */}
                    <button onClick={() => setActiveView('calendar')}>Calendário</button>
                    <button onClick={() => setActiveView('clients')}>Clientes</button>
                    <button onClick={() => setActiveView('settings')}>Configurações</button>
                    {/* Add more buttons for other views */}
                </nav>

                {/* View Content */}
                {activeView === 'calendar' && (
                    <CalendarView 
                        appointments={appointments} 
                        blockedSlots={blockedSlots} 
                        onEditAppointment={openAppointmentModal}
                        onUpdateAppointment={() => {}}
                        professionals={professionalsList}
                        currentUser={currentUser}
                    />
                )}
                {activeView === 'clients' && (
                    <ClientList 
                        clients={enrichedClients} 
                        appointments={appointments}
                        onAddClient={() => openClientModal(null)}
                        onEditClient={(client) => openClientModal(client)}
                        onClearHistoryView={() => {}}
                        onImportClients={() => {}}
                    />
                )}
                 {activeView === 'settings' && (
                    <Settings
                        currentTheme={theme}
                        onThemeChange={handleThemeChange}
                        customTheme={customTheme}
                        onCustomThemeChange={handleCustomThemeChange}
                        defaultCustomTheme={defaultCustomTheme}
                        showToast={showToast}
                    />
                )}
            </main>
        </div>
    );
};

export default App;