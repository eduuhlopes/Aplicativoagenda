import React, { useState, useEffect, useMemo, useCallback } from 'react';

// Components
import LoginScreen from './components/LoginScreen';
import Header from './components/Header';
import CalendarView from './components/CalendarView';
import ClientList from './components/ClientList';
import FinancialsView from './components/FinancialsView';
import ServicesView from './components/ServicesView';
import UserManagement from './components/UserManagement';
import Settings from './components/Settings';
import BackupRestore from './components/BackupRestore';
import ClientForm from './components/ClientForm';
import AppointmentForm from './components/AppointmentForm';
import Modal from './components/Modal';
import Toast from './components/Toast';
import BookingRequestManager from './components/BookingRequestManager';
import PaymentsView from './components/PaymentsView';
import { getAverageColor, generateGradient, getContrastColor, hexToRgb, adjustRgbColor, rgbToRgba } from './components/colorUtils';

// Types
import { 
    Appointment, 
    Client, 
    Professional, 
    Service, 
    BlockedSlot,
    EnrichedClient,
    MonthlyPackage,
    CustomTheme,
    StoredProfessional,
    FinancialData
} from './types';

// Constants
import { SERVICES } from './constants';

// Helper to parse dates from JSON while loading
const dateTimeReviver = (key: string, value: any) => {
    if ((key === 'datetime' || key === 'endTime' || key === 'date') && typeof value === 'string') {
        const date = new Date(value);
        if (!isNaN(date.getTime())) return date;
    }
    return value;
};


// A custom hook for persisting state to localStorage
function useLocalStorage<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item, dateTimeReviver) : initialValue;
        } catch (error) {
            console.error(`Error reading localStorage key "${key}":`, error);
            return initialValue;
        }
    });

    const setValue: React.Dispatch<React.SetStateAction<T>> = useCallback((value) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
            console.error(`Error setting localStorage key "${key}":`, error);
        }
    }, [key, storedValue]);

    return [storedValue, setValue];
}

const defaultCustomTheme: CustomTheme = {
    primary: '#C77D93',
    secondary: '#8A5F8A',
    background: '#F8F7FA',
    surfaceOpaque: 'rgba(255, 255, 255, 0.85)',
    textDark: '#4A235A',
    textBody: '#5E5E5E',
};

type View = 'calendar' | 'clients' | 'financials' | 'services' | 'users' | 'settings' | 'backup' | 'payments';
type ToastMessage = { id: number; message: string; type: 'success' | 'error' };

const App: React.FC = () => {
    // Authentication
    const [currentUser, setCurrentUser] = useLocalStorage<Professional | null>('spaco-delas-currentUser', null);
    
    // Core Data
    const [users, setUsers] = useLocalStorage<Record<string, StoredProfessional>>('spaco-delas-users', {});
    const [appointments, setAppointments] = useLocalStorage<Appointment[]>('spaco-delas-appointments', []);
    const [clients, setClients] = useLocalStorage<Client[]>('spaco-delas-clients', []);
    const [services, setServices] = useLocalStorage<Service[]>('spaco-delas-services', SERVICES);
    const [blockedSlots, setBlockedSlots] = useLocalStorage<BlockedSlot[]>('spaco-delas-blockedSlots', []);
    const [monthlyPackage, setMonthlyPackage] = useLocalStorage<MonthlyPackage>('spaco-delas-monthlyPackage', { price: 200 });
    const [appointmentRequests, setAppointmentRequests] = useLocalStorage<Appointment[]>('spaco-delas-appointment-requests', []);
    
    // UI State
    const [currentView, setCurrentView] = useState<View>('calendar');
    const [newlyAddedAppointmentId, setNewlyAddedAppointmentId] = useState<number | null>(null);

    // Modal States
    const [isAppointmentFormOpen, setAppointmentFormOpen] = useState(false);
    const [appointmentToEdit, setAppointmentToEdit] = useState<Appointment | null>(null);
    const [isClientFormOpen, setClientFormOpen] = useState(false);
    const [clientToEdit, setClientToEdit] = useState<Client | null>(null);
    const [isBookingRequestModalOpen, setBookingRequestModalOpen] = useState(false);
    const [modalConfig, setModalConfig] = useState<{ isOpen: boolean; title: string; message: string; onConfirm?: () => void; }>({ isOpen: false, title: '', message: '' });
    
    // Toast state
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    // Theme state
    const [theme, setTheme] = useLocalStorage('app-theme', 'pink');
    const [customTheme, setCustomTheme] = useLocalStorage('custom-theme', defaultCustomTheme);
    const [logoUrl, setLogoUrl] = useLocalStorage('spaco-delas-global-logo', '/logo.png');
    const [headerStyle, setHeaderStyle] = useState<{ background: string; color: string; notificationBg: string; } | null>(null);
    
    // Popover state
    const [isNotificationPopoverOpen, setNotificationPopoverOpen] = useState(false);

    const professionals = useMemo((): Professional[] => {
        return Object.entries(users).map(([username, data]) => ({
            username,
            name: data.name,
            role: data.role || 'professional',
            assignedServices: data.assignedServices || [],
            bio: data.bio,
            avatarUrl: data.avatarUrl,
            color: data.color,
            workSchedule: data.workSchedule
        }));
    }, [users]);
    
    const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    }, []);
    
    const handleLogin = (user: Professional) => {
        setCurrentUser(user);
    };

    const handleLogout = () => {
        setCurrentUser(null);
        window.localStorage.removeItem('spaco-delas-currentUser');
    };

    const enrichedClients: EnrichedClient[] = useMemo(() => {
        return clients.map(client => {
            const clientAppointments = appointments.filter(a => a.clientPhone === client.phone);
            const totalSpent = clientAppointments
                .filter(a => a.status === 'completed')
                .reduce((sum, a) => sum + a.services.reduce((s, serv) => s + serv.value, 0), 0);
            
            const completedAppointments = clientAppointments
                .filter(a => a.status === 'completed')
                .sort((a,b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());

            let daysSinceLastVisit: number | null = null;
            if(completedAppointments.length > 0) {
                const lastVisit = completedAppointments[0].datetime;
                daysSinceLastVisit = Math.floor((new Date().getTime() - new Date(lastVisit).getTime()) / (1000 * 3600 * 24));
            }

            const cancellationCount = clientAppointments.filter(a => a.status === 'cancelled').length;
            
            return {
                ...client,
                totalSpent,
                daysSinceLastVisit,
                cancellationCount,
            };
        });
    }, [clients, appointments]);

    const financialData: FinancialData = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        const completedAppointments = appointments.filter(a => a.status === 'completed');
        
        const getRevenue = (appt: Appointment) => appt.services.reduce((sum, s) => sum + s.value, 0);

        const currentMonthRevenue = completedAppointments
            .filter(a => new Date(a.datetime).getFullYear() === currentYear && new Date(a.datetime).getMonth() === currentMonth)
            .reduce((sum, a) => sum + getRevenue(a), 0);
        
        const futureAppointmentsInMonth = appointments
            .filter(a => new Date(a.datetime).getFullYear() === currentYear && new Date(a.datetime).getMonth() === currentMonth && new Date(a.datetime) > now && a.status !== 'cancelled')
            .reduce((sum, a) => sum + getRevenue(a), 0);

        const projectedRevenueCurrentMonth = currentMonthRevenue + futureAppointmentsInMonth;

        const monthlyRevenue: { [key: string]: number } = {};
        completedAppointments.forEach(a => {
            const date = new Date(a.datetime);
            const key = `${date.getFullYear()}-${String(date.getMonth()).padStart(2,'0')}`; // YYYY-MM format
            monthlyRevenue[key] = (monthlyRevenue[key] || 0) + getRevenue(a);
        });

        const revenueValues = Object.values(monthlyRevenue);
        const averageMonthlyRevenue = revenueValues.length > 0 ? revenueValues.reduce((a, b) => a + b, 0) / revenueValues.length : 0;
        
        const totalAnnualRevenue = completedAppointments
            .filter(a => new Date(a.datetime).getFullYear() === currentYear)
            .reduce((sum, a) => sum + getRevenue(a), 0);

        const revenueByService: { [key: string]: number } = {};
        completedAppointments.forEach(a => {
            a.services.forEach(s => {
                revenueByService[s.name] = (revenueByService[s.name] || 0) + s.value;
            });
        });

        const revenueByProfessional: { [key: string]: number } = {};
        completedAppointments.forEach(a => {
            const professional = professionals.find(p => p.username === a.professionalUsername);
            const name = professional?.name || a.professionalUsername;
            revenueByProfessional[name] = (revenueByProfessional[name] || 0) + getRevenue(a);
        });

        return { currentMonthRevenue, projectedRevenueCurrentMonth, averageMonthlyRevenue, totalAnnualRevenue, monthlyRevenue, revenueByService, revenueByProfessional };
    }, [appointments, professionals]);

    const notificationAppointments = useMemo(() => {
        const now = new Date();
        const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        return appointments.filter(a => {
            const apptDate = new Date(a.datetime);
            return apptDate > now && apptDate <= in24Hours && (a.status === 'scheduled' || a.status === 'confirmed');
        }).sort((a,b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());
    }, [appointments]);

    const handleSaveAppointment = (appointmentData: Omit<Appointment, 'id'> | Appointment) => {
        let isNew = !('id' in appointmentData);
        const newId = isNew ? Date.now() : (appointmentData as Appointment).id;

        if (isNew) {
            setAppointments(prev => [...prev, { id: newId, ...appointmentData as Omit<Appointment, 'id'> }]);
            showToast('Agendamento criado com sucesso!');
            setNewlyAddedAppointmentId(newId);
            setTimeout(() => setNewlyAddedAppointmentId(null), 3000);
        } else {
            setAppointments(prev => prev.map(a => a.id === (appointmentData as Appointment).id ? (appointmentData as Appointment) : a));
            showToast('Agendamento atualizado!');
        }
        setAppointmentFormOpen(false);
        setAppointmentToEdit(null);
    };

    const handleSaveClient = (clientData: Omit<Client, 'id'> | Client) => {
        if ('id' in clientData) {
            setClients(prev => prev.map(c => c.id === clientData.id ? clientData : c));
            showToast('Cliente atualizado com sucesso!');
        } else {
            setClients(prev => [...prev, { id: String(Date.now()), ...clientData }]);
            showToast('Cliente adicionado com sucesso!');
        }
        setClientFormOpen(false);
        setClientToEdit(null);
    };
    
    const handleUpdateService = (updatedService: Service) => {
        setServices(prev => prev.map(s => s.name === updatedService.name ? updatedService : s));
        showToast(`Serviço ${updatedService.name} atualizado!`, 'success');
    };

    const handleExport = () => {
        const allData = {
            users, appointments, clients, services, blockedSlots, monthlyPackage,
            theme, customTheme, logoUrl, appointmentRequests
        };
        const dataStr = JSON.stringify(allData, null, 2);
        const blob = new Blob([dataStr], {type: "application/json"});
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `spacodelas_backup_${new Date().toISOString().split('T')[0]}.json`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
        showToast("Backup exportado com sucesso!", "success");
    };

    const handleImport = (data: any) => {
        try {
            // Add validation here if needed
            if (data.users) setUsers(data.users);
            if (data.appointments) setAppointments(data.appointments);
            if (data.clients) setClients(data.clients);
            if (data.services) setServices(data.services);
            if (data.blockedSlots) setBlockedSlots(data.blockedSlots);
            if (data.monthlyPackage) setMonthlyPackage(data.monthlyPackage);
            if (data.theme) setTheme(data.theme);
            if (data.customTheme) setCustomTheme(data.customTheme);
            if (data.logoUrl) setLogoUrl(data.logoUrl);
            if (data.appointmentRequests) setAppointmentRequests(data.appointmentRequests);
            showToast("Dados importados com sucesso!", "success");
        } catch (e) {
            showToast("Falha ao importar dados. O arquivo pode estar corrompido.", "error");
        }
    };

    // Dynamic theme and header style effect
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        if (theme === 'custom') {
            const root = document.documentElement;
            Object.entries(customTheme).forEach(([key, value]) => {
                const cssVar = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
                root.style.setProperty(cssVar, value);
            });
        } else {
             const root = document.documentElement;
             // Clear custom properties if not using custom theme
             Object.keys(defaultCustomTheme).forEach(key => {
                 const cssVar = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
                 root.style.removeProperty(cssVar);
             });
        }
        
        getAverageColor(logoUrl)
            .then(rgb => {
                setHeaderStyle({
                    background: generateGradient(rgb.r, rgb.g, rgb.b),
                    color: getContrastColor(rgb.r, rgb.g, rgb.b),
                    notificationBg: rgbToRgba(rgb, 0.2)
                });
            })
            .catch(() => setHeaderStyle(null)); // Fallback to CSS default

    }, [theme, customTheme, logoUrl]);
    

    if (!currentUser) {
        return <LoginScreen onLogin={handleLogin} showToast={showToast} />;
    }

    const renderView = () => {
        switch (currentView) {
            case 'calendar': return <CalendarView appointments={appointments} blockedSlots={blockedSlots} onEditAppointment={(appt) => { setAppointmentToEdit(appt); setAppointmentFormOpen(true); }} onUpdateAppointment={handleSaveAppointment} newlyAddedAppointmentId={newlyAddedAppointmentId} professionals={professionals} currentUser={currentUser} />;
            case 'clients': return <ClientList clients={enrichedClients} appointments={appointments} onAddClient={() => { setClientToEdit(null); setClientFormOpen(true); }} onEditClient={(client) => { setClientToEdit(client as Client); setClientFormOpen(true); }} onClearHistoryView={() => {}} onImportClients={() => showToast("Importação de contatos em desenvolvimento.")} />;
            case 'financials': return <FinancialsView financialData={financialData} />;
            case 'services': return <ServicesView services={services} onUpdateService={handleUpdateService} monthlyPackage={monthlyPackage} onUpdatePackage={setMonthlyPackage}/>;
            case 'users': return <UserManagement showToast={showToast} showModal={(title, message, onConfirm) => setModalConfig({isOpen: true, title, message, onConfirm})} services={services} professionals={users} onUsersChange={setUsers} />;
            case 'settings': return <Settings currentTheme={theme} onThemeChange={setTheme} customTheme={customTheme} onCustomThemeChange={setCustomTheme} defaultCustomTheme={defaultCustomTheme} showToast={showToast} />;
            case 'backup': return <BackupRestore onExport={handleExport} onImport={handleImport} onError={(title, message) => setModalConfig({isOpen: true, title, message})} />;
            case 'payments': return <PaymentsView />;
            default: return <div>View not found</div>;
        }
    };
    
    return (
        <div className="flex h-screen bg-gray-100 font-sans text-[var(--text-body)]">
             {/* Simple Sidebar */}
            <nav className="w-16 md:w-56 bg-white border-r border-gray-200 flex flex-col">
                <div className="flex items-center justify-center h-20 border-b border-gray-200">
                    <img src={logoUrl} alt="Logo" className="h-10 w-10 rounded-full object-cover"/>
                    <span className="hidden md:block ml-3 font-brand text-2xl font-bold text-[var(--primary)]">Spaço Delas</span>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {/* Navigation items can be mapped here */}
                    <button onClick={() => setCurrentView('calendar')} className={`flex items-center p-4 w-full text-left ${currentView === 'calendar' ? 'bg-pink-100 text-pink-700' : 'hover:bg-gray-100'}`}> <span className="md:ml-3">Agenda</span> </button>
                    <button onClick={() => setCurrentView('clients')} className={`flex items-center p-4 w-full text-left ${currentView === 'clients' ? 'bg-pink-100 text-pink-700' : 'hover:bg-gray-100'}`}> <span className="md:ml-3">Clientes</span> </button>
                    <button onClick={() => setCurrentView('financials')} className={`flex items-center p-4 w-full text-left ${currentView === 'financials' ? 'bg-pink-100 text-pink-700' : 'hover:bg-gray-100'}`}> <span className="md:ml-3">Financeiro</span> </button>
                    <button onClick={() => setCurrentView('services')} className={`flex items-center p-4 w-full text-left ${currentView === 'services' ? 'bg-pink-100 text-pink-700' : 'hover:bg-gray-100'}`}> <span className="md:ml-3">Serviços</span> </button>
                    {currentUser.role === 'admin' && (
                         <button onClick={() => setCurrentView('users')} className={`flex items-center p-4 w-full text-left ${currentView === 'users' ? 'bg-pink-100 text-pink-700' : 'hover:bg-gray-100'}`}> <span className="md:ml-3">Profissionais</span> </button>
                    )}
                    <button onClick={() => setCurrentView('settings')} className={`flex items-center p-4 w-full text-left ${currentView === 'settings' ? 'bg-pink-100 text-pink-700' : 'hover:bg-gray-100'}`}> <span className="md:ml-3">Configurações</span> </button>
                    <button onClick={() => setCurrentView('backup')} className={`flex items-center p-4 w-full text-left ${currentView === 'backup' ? 'bg-pink-100 text-pink-700' : 'hover:bg-gray-100'}`}> <span className="md:ml-3">Backup</span> </button>
                </div>
            </nav>

            <main className="flex-1 flex flex-col overflow-hidden">
                <Header 
                    logoUrl={logoUrl}
                    headerStyle={headerStyle}
                    notificationAppointments={notificationAppointments}
                    bookingRequests={appointmentRequests}
                    isNotificationPopoverOpen={isNotificationPopoverOpen}
                    onToggleNotificationPopover={() => setNotificationPopoverOpen(!isNotificationPopoverOpen)}
                    onOpenBookingRequestModal={() => setBookingRequestModalOpen(true)}
                    currentUser={currentUser}
                    onLogout={handleLogout}
                />
                <div className="flex-1 overflow-x-hidden overflow-y-auto bg-[var(--background)] p-4 sm:p-6 lg:p-8">
                    {renderView()}
                </div>
            </main>

            {/* Modals & Toasts */}
             {isAppointmentFormOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
                        <AppointmentForm onSave={handleSaveAppointment} onCancel={() => { setAppointmentFormOpen(false); setAppointmentToEdit(null); }} appointmentToEdit={appointmentToEdit} services={services} clients={clients} professionals={professionals} currentUser={currentUser} blockedSlots={blockedSlots} />
                    </div>
                </div>
            )}
            
            {isClientFormOpen && (
                 <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                        <ClientForm onSave={handleSaveClient} onCancel={() => { setClientFormOpen(false); setClientToEdit(null); }} clientToEdit={clientToEdit} existingClients={clients} />
                    </div>
                 </div>
            )}
            
            <BookingRequestManager 
                isOpen={isBookingRequestModalOpen}
                onClose={() => setBookingRequestModalOpen(false)}
                requests={appointmentRequests}
                professionals={professionals}
                onApprove={(req) => {
                    const approvedAppointment = { ...req, status: 'scheduled' as const };
                    handleSaveAppointment(approvedAppointment);
                    setAppointmentRequests(prev => prev.filter(r => r.id !== req.id));
                    showToast("Solicitação aprovada e agendada!", 'success');
                }}
                onReject={(id) => {
                    setAppointmentRequests(prev => prev.filter(r => r.id !== id));
                    showToast("Solicitação rejeitada.", 'success');
                }}
            />

            <Modal 
                isOpen={modalConfig.isOpen}
                title={modalConfig.title}
                message={modalConfig.message}
                onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
                onConfirm={modalConfig.onConfirm}
            />

            <div className="fixed bottom-5 right-5 z-[80] space-y-2">
                {toasts.map(toast => (
                    <Toast key={toast.id} message={toast.message} type={toast.type} />
                ))}
            </div>
        </div>
    );
};

export default App;
