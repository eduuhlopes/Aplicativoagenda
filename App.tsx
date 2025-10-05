import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';

// Components
import AppointmentForm from './components/AppointmentForm';
import CalendarView from './components/CalendarView';
import ClientForm from './components/ClientForm';
import ClientList from './components/ClientList';
import CollapsibleSection from './components/CollapsibleSection';
import Header from './components/Header';
import LoginScreen from './components/LoginScreen';
import Modal from './components/Modal';
import FinancialsView from './components/FinancialsView';
import ServicesView from './components/ServicesView';
import Toast from './components/Toast';
import ThemeSwitcher, { themes } from './components/ThemeSwitcher';
import BackupRestore from './components/BackupRestore';
import LogoUploader from './components/LogoUploader';
import NotificationManager from './components/NotificationManager';
import UserManagement from './components/UserManagement';
import BookingRequestManager from './components/BookingRequestManager';
import DateTimePickerModal from './components/DateTimePickerModal';


// Utils, Types, and Constants
import { getAverageColor, getContrastColor, generateGradient, hexToRgb } from './components/colorUtils';
// FIX: Imported StoredProfessional type to correctly type the 'professionals' state.
import { Appointment, Client, Professional, BlockedSlot, Service, MonthlyPackage, EnrichedClient, ModalInfo, AppointmentStatus, FinancialData, StoredProfessional } from './types';
import { SERVICES } from './constants';

const PlusIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5 mr-2"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </svg>
);

const BlockTimeIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5 mr-2"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2zM16 14.5l-8-8" />
    </svg>
);


// Helper to parse dates from JSON
const dateTimeReviver = (key: string, value: any) => {
    if ((key === 'datetime' || key === 'endTime' || key === 'date') && typeof value === 'string') {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
            return date;
        }
    }
    return value;
};

// Generic hook for using localStorage
const usePersistentState = <T,>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
    const [state, setState] = useState<T>(() => {
        try {
            const storedValue = localStorage.getItem(key);
            return storedValue ? JSON.parse(storedValue, dateTimeReviver) : defaultValue;
        } catch (error) {
            console.error("Error reading from localStorage for key:", key, error);
            return defaultValue;
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem(key, JSON.stringify(state));
        } catch (error) {
            console.error("Error writing to localStorage for key:", key, error);
        }
    }, [key, state]);

    return [state, setState];
};


const App: React.FC = () => {
    // --- STATE MANAGEMENT ---
    const [currentUser, setCurrentUser] = useState<Professional | null>(null);
    
    // Data State (now global for the whole application)
    const [appointments, setAppointments] = usePersistentState<Appointment[]>('spaco-delas-appointments', []);
    const [clients, setClients] = usePersistentState<Client[]>('spaco-delas-clients', []);
    const [blockedSlots, setBlockedSlots] = usePersistentState<BlockedSlot[]>('spaco-delas-blockedSlots', []);
    const [services, setServices] = usePersistentState<Service[]>('spaco-delas-services', SERVICES);
    const [monthlyPackage, setMonthlyPackage] = usePersistentState<MonthlyPackage>('spaco-delas-package', { serviceName: 'Pé+Mão', price: 180 });
    // FIX: Changed type to Record<string, StoredProfessional> to correctly handle password data.
    const [professionals, setProfessionals] = usePersistentState<Record<string, StoredProfessional>>('spaco-delas-users', {});
    const [appointmentRequests, setAppointmentRequests] = usePersistentState<Appointment[]>('spaco-delas-appointment-requests', []);
    
    // Global/UI State
    const [logoUrl, setLogoUrl] = usePersistentState<string>('spaco-delas-global-logo', '/logo.png');
    const [currentTheme, setCurrentTheme] = usePersistentState<string>('app-theme', 'pink');
    const [activeView, setActiveView] = useState<'agenda' | 'clients' | 'financeiro' | 'services' | 'settings'>('agenda');
    const [newlyAddedAppointmentId, setNewlyAddedAppointmentId] = useState<number | null>(null);
    const [viewingClientHistory, setViewingClientHistory] = useState<Client | null>(null);
    
    // Form & Modal Visibility State
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [isClientFormVisible, setIsClientFormVisible] = useState(false);
    const [isBookingRequestModalOpen, setIsBookingRequestModalOpen] = useState(false);
    const [isBlockerModalOpen, setIsBlockerModalOpen] = useState(false);
    const [appointmentToEdit, setAppointmentToEdit] = useState<Appointment | null>(null);
    const [clientToEdit, setClientToEdit] = useState<Client | null>(null);
    const [modalInfo, setModalInfo] = useState<ModalInfo>({ isOpen: false, title: '', message: '' });
    const [toastInfo, setToastInfo] = useState<{ id: number; message: string; type: 'success' | 'error' } | null>(null);
    const [isNotificationPopoverOpen, setIsNotificationPopoverOpen] = useState(false);
    const [headerStyle, setHeaderStyle] = useState<{ background: string; color: string; notificationBg: string; } | null>(null);
    const appContainerRef = useRef<HTMLDivElement>(null);

    // --- EFFECTS ---

    // Check for logged-in user in session storage
    useEffect(() => {
        try {
            const storedUser = sessionStorage.getItem('spaco-delas-currentUser');
            if (storedUser) {
                setCurrentUser(JSON.parse(storedUser));
            }
        } catch (e) {
            console.error("Failed to load user from session storage", e);
        }
    }, []);
    
    // Helper to generate lighter/darker shades for CSS variables.
    const adjustRgbColor = (color: {r: number, g: number, b: number}, amount: number) => {
        const clamp = (val: number) => Math.max(0, Math.min(255, val));
        return `rgb(${clamp(color.r + amount)}, ${clamp(color.g + amount)}, ${clamp(color.b + amount)})`;
    };

    // Apply theme based on user profile color or global theme setting
    useEffect(() => {
        const root = document.documentElement;

        const applyDynamicTheme = (hexColor: string) => {
            const rgb = hexToRgb(hexColor);
            if (!rgb) {
                applyStaticTheme(currentTheme); // Fallback if color is invalid
                return;
            }

            // Set CSS variables for a cohesive theme
            root.style.setProperty('--primary', hexColor);
            root.style.setProperty('--primary-light', adjustRgbColor(rgb, 30));
            root.style.setProperty('--primary-hover', adjustRgbColor(rgb, -20));
            root.style.setProperty('--accent', adjustRgbColor(rgb, 30));

            // Remove data-theme to ensure our variables take precedence
            root.removeAttribute('data-theme');
            
            // Set header style (which can use a gradient)
            setHeaderStyle({
                background: generateGradient(rgb.r, rgb.g, rgb.b),
                color: getContrastColor(rgb.r, rgb.g, rgb.b),
                notificationBg: `rgba(${Math.max(0, rgb.r - 20)}, ${Math.max(0, rgb.g - 20)}, ${Math.max(0, rgb.b - 20)}, 0.5)`
            });
        };

        const applyStaticTheme = (themeName: string) => {
            // Clear any dynamically set properties
            root.style.removeProperty('--primary');
            root.style.removeProperty('--primary-light');
            root.style.removeProperty('--primary-hover');
            root.style.removeProperty('--accent');
            
            // Set the theme using the pre-defined class
            root.setAttribute('data-theme', themeName);

            // Set the header based on the theme's primary color
            const theme = themes.find(t => t.name === themeName);
            const primaryColor = theme ? theme.color : '#C77D93';
            const rgb = hexToRgb(primaryColor);
            if (rgb) {
                setHeaderStyle({
                    background: generateGradient(rgb.r, rgb.g, rgb.b),
                    color: getContrastColor(rgb.r, rgb.g, rgb.b),
                    notificationBg: `rgba(${Math.max(0, rgb.r - 20)}, ${Math.max(0, rgb.g - 20)}, ${Math.max(0, rgb.b - 20)}, 0.5)`
                });
            }
        };

        // Priority: Professional Color > Global Theme
        if (currentUser?.color) {
            applyDynamicTheme(currentUser.color);
        } else {
            applyStaticTheme(currentTheme);
        }

    }, [currentTheme, currentUser]);
    
    // --- DERIVED STATE & MEMOS ---
    
    // Transform professionals record into an array for easier use in components
    const professionalsList = useMemo((): Professional[] => {
        // FIX: Safely construct Professional[] from StoredProfessional data, omitting passwords and providing fallbacks for optional fields.
        return Object.entries(professionals).map(([username, data]) => ({
            username,
            name: data.name,
            role: data.role || 'professional',
            assignedServices: data.assignedServices || [],
            bio: data.bio || '',
            avatarUrl: data.avatarUrl || '',
            color: data.color || '#C77D93',
            workSchedule: data.workSchedule || {},
        }));
    }, [professionals]);

    // Calculate client stats
    const enrichedClients = useMemo((): EnrichedClient[] => {
        return clients.map(client => {
            const clientAppointments = appointments.filter(a => a.clientPhone === client.phone);
            const totalSpent = clientAppointments
                .filter(a => a.status === 'completed')
                .reduce((sum, a) => sum + a.services.reduce((s, serv) => s + serv.value, 0), 0);

            const lastVisit = clientAppointments
                .filter(a => a.status === 'completed')
                .sort((a, b) => b.datetime.getTime() - a.datetime.getTime())[0];
            
            let daysSinceLastVisit: number | null = null;
            if(lastVisit) {
                const diffTime = Math.abs(new Date().getTime() - lastVisit.datetime.getTime());
                daysSinceLastVisit = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            }

            const cancellationCount = clientAppointments.filter(a => a.status === 'cancelled').length;
            
            return { ...client, totalSpent, daysSinceLastVisit, cancellationCount };
        }).sort((a, b) => b.totalSpent - a.totalSpent);
    }, [clients, appointments]);

    // Get appointments for notification popover (next 24 hours)
    const notificationAppointments = useMemo(() => {
        const now = new Date();
        const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        return appointments
            .filter(a => a.datetime > now && a.datetime <= next24Hours && a.status === 'scheduled')
            .sort((a, b) => a.datetime.getTime() - b.datetime.getTime());
    }, [appointments]);
    
     // Calculate comprehensive financial data
    const financialData = useMemo((): FinancialData => {
        const monthlyRevenue: { [key: string]: number } = {};
        const revenueByService: { [serviceName: string]: number } = {};
        const revenueByProfessional: { [professionalName: string]: number } = {};

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const currentMonthKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
        
        let projectedRevenueCurrentMonth = 0;
        let totalAnnualRevenue = 0;

        for (const appt of appointments) {
            const apptDate = appt.datetime;
            const value = appt.services.reduce((sum, s) => sum + s.value, 0);

            // Completed appointments contribute to historical monthly revenue and detailed breakdowns
            if (appt.status === 'completed') {
                const monthKey = `${apptDate.getFullYear()}-${String(apptDate.getMonth()).padStart(2, '0')}`;
                monthlyRevenue[monthKey] = (monthlyRevenue[monthKey] || 0) + value;
                if (apptDate.getFullYear() === currentYear) {
                    totalAnnualRevenue += value;
                }
                // Breakdown calculations
                appt.services.forEach(service => {
                    revenueByService[service.name] = (revenueByService[service.name] || 0) + service.value;
                });
                const professionalName = professionals[appt.professionalUsername]?.name || appt.professionalUsername;
                revenueByProfessional[professionalName] = (revenueByProfessional[professionalName] || 0) + value;
            }

            // Scheduled/Confirmed/Delayed appointments in the current month contribute to projection
            if (apptDate.getFullYear() === currentYear && apptDate.getMonth() === currentMonth) {
                if (['scheduled', 'confirmed', 'delayed'].includes(appt.status)) {
                    projectedRevenueCurrentMonth += value;
                }
            }
        }
        
        const completedMonthsValues = Object.values(monthlyRevenue);
        const averageMonthlyRevenue = completedMonthsValues.length > 0
            ? completedMonthsValues.reduce((a, b) => a + b, 0) / completedMonthsValues.length
            : 0;
            
        const currentMonthRevenue = monthlyRevenue[currentMonthKey] || 0;
        // The total projection includes what's already completed this month
        projectedRevenueCurrentMonth += currentMonthRevenue; 

        return {
            monthlyRevenue,
            currentMonthRevenue,
            projectedRevenueCurrentMonth,
            averageMonthlyRevenue,
            totalAnnualRevenue,
            revenueByService,
            revenueByProfessional,
        };
    }, [appointments, professionals]);

    // --- HANDLERS ---
    
    // Toast and Modal helpers
    const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
        setToastInfo({ id: Date.now(), message, type });
        setTimeout(() => setToastInfo(null), 3000);
    }, []);

    const showModal = useCallback((title: string, message: string, onConfirm?: () => void) => {
        setModalInfo({ isOpen: true, title, message, onConfirm });
    }, []);

    const closeModal = useCallback(() => setModalInfo({ isOpen: false, title: '', message: '' }), []);
    
    // Auth
    const handleLogin = useCallback((user: Professional) => {
        setCurrentUser(user);
        sessionStorage.setItem('spaco-delas-currentUser', JSON.stringify(user));
        showToast(`Bem-vinda, ${user.name}!`, 'success');
    }, [showToast]);

    const handleLogout = useCallback(() => {
        showModal('Sair do Sistema', 'Você tem certeza que deseja sair?', () => {
            setCurrentUser(null);
            sessionStorage.removeItem('spaco-delas-currentUser');
            closeModal();
        });
    }, [showModal, closeModal]);

    // Appointment Form
    const handleOpenForm = (appt: Appointment | null) => {
        setAppointmentToEdit(appt);
        setIsFormVisible(true);
    };

    const handleCloseForm = useCallback(() => {
        setIsFormVisible(false);
        setAppointmentToEdit(null);
    }, []);

    // Client Form
    const handleOpenClientForm = (client: Client | null) => {
        setClientToEdit(client);
        setIsClientFormVisible(true);
    };

    const handleCloseClientForm = useCallback(() => {
        setIsClientFormVisible(false);
        setClientToEdit(null);
    }, []);
    
    const handleViewClientHistory = useCallback((client: Client) => {
        handleCloseForm();
        // Delay allows form to animate out before view switch
        setTimeout(() => {
            setViewingClientHistory(client);
            setActiveView('clients');
        }, 150);
    }, [handleCloseForm]);

    // Generate WhatsApp message and open link
    const openWhatsApp = (appointment: Appointment, messageType: 'new' | 'update' | 'cancel') => {
        const phone = appointment.clientPhone.replace(/\D/g, '');
        const services = appointment.services.map(s => s.name).join(', ');
        const date = appointment.datetime.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' });
        const time = appointment.datetime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        
        let message = '';
        switch(messageType) {
            case 'new':
                message = `Olá ${appointment.clientName}! 😊 Seu agendamento para *${services}* foi confirmado para o dia *${date}* às *${time}*. Mal podemos esperar para te ver! ✨`;
                break;
            case 'update':
                message = `Olá ${appointment.clientName}! Informamos que seu agendamento foi alterado. O novo horário para *${services}* é *${date}* às *${time}*. Por favor, confirme se está tudo certo.`;
                break;
            case 'cancel':
                message = `Olá ${appointment.clientName}, confirmando o cancelamento do seu agendamento de *${services}* do dia *${date}* às *${time}*. Se precisar, é só chamar para reagendar.`;
                break;
        }

        window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(message)}`, '_blank');
    };

    // CRUD Handlers
    const handleScheduleAppointment = useCallback((newAppointmentData: Omit<Appointment, 'id' | 'status'>) => {
        const newAppointment: Appointment = {
            ...newAppointmentData,
            id: Date.now(),
            status: 'scheduled',
        };
        setAppointments(prev => [...prev, newAppointment].sort((a,b) => a.datetime.getTime() - b.datetime.getTime()));
        setNewlyAddedAppointmentId(newAppointment.id);
        setTimeout(() => setNewlyAddedAppointmentId(null), 2000); // Animation duration is 1.5s
        showToast('Agendamento criado com sucesso!', 'success');
        
        // Instead of calling openWhatsApp directly, show a modal to confirm.
        // This makes the action more explicit for the user and more robust against popup blockers.
        showModal(
            'Notificar Cliente?',
            `Deseja enviar uma mensagem de confirmação para ${newAppointment.clientName} no WhatsApp?`,
            () => {
                openWhatsApp(newAppointment, 'new');
                closeModal(); // Explicitly close the modal after action
            }
        );
    }, [showToast, setAppointments, showModal, closeModal]);

    const handleUpdateAppointment = useCallback((updatedAppointment: Appointment) => {
        setAppointments(prev => prev.map(a => a.id === updatedAppointment.id ? updatedAppointment : a));
        showToast('Agendamento atualizado!', 'success');
        showModal('Notificar Cliente?', 'Deseja enviar uma mensagem no WhatsApp com as alterações?', () => {
            const messageType = updatedAppointment.status === 'cancelled' ? 'cancel' : 'update';
            openWhatsApp(updatedAppointment, messageType);
            closeModal(); // Explicitly close the modal after action
        });
    }, [showToast, showModal, setAppointments, closeModal]);

    const handleMarkAsDelayed = useCallback((appointment: Appointment) => {
        setAppointments(prev => prev.map(a => a.id === appointment.id ? { ...a, status: 'delayed' } : a));
        showToast(`${appointment.clientName} marcada como atrasada.`, 'success');
    }, [setAppointments, showToast]);

    const handleSaveClient = useCallback((clientData: Omit<Client, 'id'> | Client) => {
        if ('id' in clientData) { // Editing existing client
            setClients(prev => prev.map(c => c.id === clientData.id ? clientData : c));
            showToast('Cliente atualizada com sucesso!', 'success');
        } else { // Adding new client
            const newClient: Client = { ...clientData, id: Date.now() };
            setClients(prev => [...prev, newClient]);
            showToast('Cliente adicionada com sucesso!', 'success');
        }
        handleCloseClientForm();
    }, [handleCloseClientForm, showToast, setClients]);
    
    const handleUpdateService = useCallback((updatedService: Service) => {
        setServices(prevServices =>
            prevServices.map(service =>
                service.name === updatedService.name ? updatedService : service
            )
        );
        showToast('Serviço atualizado com sucesso!', 'success');
    }, [setServices, showToast]);

    const handleBlockSlot = useCallback((data: { date: Date, isFullDay?: boolean, startTime?: string, endTime?: string }) => {
        const newBlockedSlot: BlockedSlot = {
            id: Date.now(),
            date: data.date,
            isFullDay: data.isFullDay ?? false,
            startTime: data.startTime,
            endTime: data.endTime,
        };
        setBlockedSlots(prev => [...prev, newBlockedSlot]);
        showToast('Horário bloqueado com sucesso!', 'success');
        setIsBlockerModalOpen(false);
    }, [setBlockedSlots, showToast]);

    // Booking Request Handlers
    const handleApproveRequest = useCallback((requestToApprove: Appointment) => {
        // Change status to 'scheduled' and add to main appointments
        const approvedAppointment = { ...requestToApprove, status: 'scheduled' as const };
        setAppointments(prev => [...prev, approvedAppointment].sort((a,b) => a.datetime.getTime() - b.datetime.getTime()));

        // Remove from requests
        setAppointmentRequests(prev => prev.filter(req => req.id !== requestToApprove.id));
        
        showToast('Solicitação aprovada e adicionada à agenda!', 'success');
        showModal('Notificar Cliente?', `Deseja enviar uma confirmação para ${requestToApprove.clientName} no WhatsApp?`, () => {
            openWhatsApp(approvedAppointment, 'new');
        });
    }, [setAppointments, setAppointmentRequests, showToast, showModal]);

    const handleRejectRequest = useCallback((requestId: number) => {
        setAppointmentRequests(prev => prev.filter(req => req.id !== requestId));
        showToast('Solicitação rejeitada.', 'success');
    }, [setAppointmentRequests, showToast]);


    // Settings Handlers
    const handleExportData = useCallback(() => {
        try {
            const dataToExport = {
                appointments,
                clients,
                blockedSlots,
                services,
                monthlyPackage,
                logoUrl,
                currentTheme,
                professionals,
            };
            const dataStr = JSON.stringify(dataToExport, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `spaco_delas_backup_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            showToast('Backup exportado com sucesso!', 'success');
        } catch (e) {
            console.error(e);
            showModal('Erro de Exportação', 'Não foi possível gerar o arquivo de backup.');
        }
    }, [appointments, clients, blockedSlots, services, monthlyPackage, logoUrl, currentTheme, professionals, showToast, showModal]);

    const handleImportData = useCallback((data: any) => {
        try {
            // Add basic validation
            if (data && Array.isArray(data.appointments) && Array.isArray(data.clients)) {
                setAppointments(data.appointments || []);
                setClients(data.clients || []);
                setBlockedSlots(data.blockedSlots || []);
                setServices(data.services || SERVICES);
                setMonthlyPackage(data.monthlyPackage || { serviceName: 'Pé+Mão', price: 180 });
                setLogoUrl(data.logoUrl || '/logo.png');
                setCurrentTheme(data.currentTheme || 'pink');
                setProfessionals(data.professionals || {});
                showToast('Dados restaurados com sucesso!', 'success');
            } else {
                 throw new Error("Formato de arquivo inválido.");
            }
        } catch(e: any) {
             showModal('Erro de Importação', `Falha ao restaurar dados. Detalhe: ${e.message}`);
        }
    }, [setAppointments, setClients, setBlockedSlots, setServices, setMonthlyPackage, setLogoUrl, setCurrentTheme, setProfessionals, showToast, showModal]);
    

    // --- RENDER LOGIC ---

    const renderActiveView = () => {
        if (!currentUser) return null; // Should not happen if LoginScreen guard is working
        switch (activeView) {
            case 'agenda':
                return (
                    <div>
                        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-2">
                            <h2 className="text-3xl font-bold text-[var(--text-dark)]">Agenda</h2>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setIsBlockerModalOpen(true)}
                                    className="flex items-center px-4 py-2 bg-white border border-[var(--border)] text-[var(--secondary)] font-bold rounded-lg shadow-sm hover:bg-[var(--highlight)] transition-all active:scale-95"
                                >
                                    <BlockTimeIcon />
                                    Bloquear Horário
                                </button>
                                <button
                                    onClick={() => handleOpenForm(null)}
                                    className="flex items-center px-4 py-2 bg-[var(--primary)] text-white font-bold rounded-lg shadow-md hover:bg-[var(--primary-hover)] transition-transform transform hover:scale-105 active:scale-95"
                                >
                                    <PlusIcon />
                                    Agendamento
                                </button>
                            </div>
                        </div>
                        <CalendarView 
                            appointments={appointments} 
                            blockedSlots={blockedSlots} 
                            onEditAppointment={handleOpenForm} 
                            newlyAddedAppointmentId={newlyAddedAppointmentId}
                            professionals={professionalsList}
                            currentUser={currentUser}
                        />
                    </div>
                );
            case 'clients':
                return (
                    <ClientList 
                        clients={enrichedClients} 
                        appointments={appointments}
                        onAddClient={() => handleOpenClientForm(null)} 
                        onEditClient={client => handleOpenClientForm(client)} 
                        viewingHistoryFor={viewingClientHistory}
                        onClearHistoryView={() => setViewingClientHistory(null)}
                    />
                );
            case 'financeiro':
                return <FinancialsView financialData={financialData} />;
            case 'services':
                return <ServicesView services={services} onUpdateService={handleUpdateService} monthlyPackage={monthlyPackage} onUpdatePackage={setMonthlyPackage} />;
            case 'settings':
                return (
                    <div className="max-w-4xl mx-auto space-y-8">
                        <h2 className="text-4xl font-bold text-[var(--text-dark)] text-center">Configurações</h2>
                        
                        <div className="text-center">
                            <h3 className="text-xl font-bold text-[var(--text-dark)]">Link Público para Agendamento</h3>
                            <p className="text-md text-[var(--text-body)] mb-2">Compartilhe este link com suas clientes:</p>
                            <div className="flex items-center justify-center gap-2 p-2 bg-[var(--highlight)] border border-dashed border-[var(--border)] rounded-lg">
                                <a href="/agendar" target="_blank" className="font-mono text-[var(--primary)] font-bold hover:underline">
                                    {window.location.origin}/agendar
                                </a>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(`${window.location.origin}/agendar`);
                                        showToast('Link copiado!', 'success');
                                    }}
                                    className="p-2 text-[var(--secondary)] hover:bg-[var(--border)] rounded-md transition-colors"
                                    title="Copiar link"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z" /><path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V4a2 2 0 00-2-2H4z" /></svg>
                                </button>
                            </div>
                        </div>

                        <ThemeSwitcher currentTheme={currentTheme} onThemeChange={setCurrentTheme} />
                        <LogoUploader currentLogo={logoUrl} onLogoChange={(url) => setLogoUrl(url || '/logo.png')} onError={showModal} />
                        <CollapsibleSection title="Backup e Restauração">
                            <BackupRestore onExport={handleExportData} onImport={handleImportData} onError={showModal} />
                        </CollapsibleSection>
                         <CollapsibleSection title="Gerenciar Profissionais">
                            <UserManagement showToast={showToast} showModal={showModal} services={services} professionals={professionals} onUsersChange={setProfessionals} />
                        </CollapsibleSection>
                        <CollapsibleSection title="Notificações Push">
                            <NotificationManager />
                        </CollapsibleSection>
                    </div>
                );
        }
    };
    
    // Login Screen Guard
    if (!currentUser) {
        return <LoginScreen onLogin={handleLogin} showToast={showToast} />;
    }

    // Main App Layout
    return (
        <div ref={appContainerRef} className="bg-[var(--background)] min-h-screen text-[var(--text-body)] transition-colors duration-500 pb-20">
            <div className={`p-4 sm:p-6 transition-all duration-500 ${headerStyle ? '' : 'bg-[var(--primary)]'}`}>
                <Header 
                    logoUrl={logoUrl} 
                    headerStyle={headerStyle}
                    notificationAppointments={notificationAppointments}
                    bookingRequests={appointmentRequests}
                    isNotificationPopoverOpen={isNotificationPopoverOpen}
                    onToggleNotificationPopover={() => setIsNotificationPopoverOpen(prev => !prev)}
                    onOpenBookingRequestModal={() => setIsBookingRequestModalOpen(true)}
                    currentUser={currentUser}
                    onLogout={handleLogout}
                />
            </div>

            {/* Navigation */}
            <nav className="flex justify-center bg-[var(--surface-opaque)]/80 backdrop-blur-sm shadow-md sticky top-0 z-30 border-b border-[var(--border)]">
                {([
                    { label: 'Agenda', view: 'agenda' },
                    { label: 'Clientes', view: 'clients' }, 
                    { label: 'Financeiro', view: 'financeiro' },
                    { label: 'Serviços', view: 'services' }, 
                    { label: 'Configurações', view: 'settings' }
                ] as const).map(item => (
                    <button 
                        key={item.view}
                        onClick={() => setActiveView(item.view)}
                        className={`px-3 sm:px-6 py-4 text-sm sm:text-base font-bold transition-all border-b-4 ${
                            activeView === item.view 
                                ? 'text-[var(--primary)] border-[var(--primary)]' 
                                : 'text-[var(--text-body)] border-transparent hover:bg-[var(--highlight)]'
                        }`}
                    >
                        {item.label}
                    </button>
                ))}
            </nav>
            
            <main className="p-4 sm:p-8">
                <div key={activeView} className="animate-view-in">
                    {renderActiveView()}
                </div>
            </main>

            {/* Floating Action Button */}
            {!['settings', 'services', 'financeiro'].includes(activeView) && !isFormVisible && !isClientFormVisible && (
                <button
                    onClick={() => activeView === 'clients' ? handleOpenClientForm(null) : handleOpenForm(null)}
                    className="fab"
                    aria-label={activeView === 'clients' ? "Nova Cliente" : "Novo Agendamento"}
                >
                    <PlusIcon className="h-8 w-8" />
                </button>
            )}

            {/* Modals and Forms as Overlays */}
            {(isFormVisible || isClientFormVisible) && <div className="fixed inset-0 bg-black bg-opacity-50 z-50 animate-backdrop-in" onClick={isFormVisible ? handleCloseForm : handleCloseClientForm}></div>}
            
            <div className={`form-container ${isFormVisible ? 'visible' : ''}`}>
                 {isFormVisible && 
                    <AppointmentForm 
                        onSchedule={handleScheduleAppointment} 
                        appointmentToEdit={appointmentToEdit}
                        onUpdate={handleUpdateAppointment}
                        onCancelEdit={handleCloseForm}
                        appointments={appointments}
                        blockedSlots={blockedSlots}
                        onMarkAsDelayed={handleMarkAsDelayed}
                        services={services}
                        clients={clients}
                        onViewClientHistory={handleViewClientHistory}
                        professionals={professionalsList}
                        currentUser={currentUser}
                    />
                }
            </div>

            <div className={`form-container ${isClientFormVisible ? 'visible' : ''}`}>
                 {isClientFormVisible && 
                    <ClientForm
                        onSave={handleSaveClient}
                        clientToEdit={clientToEdit}
                        onCancel={handleCloseClientForm}
                        existingClients={clients}
                    />
                }
            </div>
            
            <BookingRequestManager
                isOpen={isBookingRequestModalOpen}
                onClose={() => setIsBookingRequestModalOpen(false)}
                requests={appointmentRequests}
                professionals={professionalsList}
                onApprove={handleApproveRequest}
                onReject={handleRejectRequest}
            />

            <DateTimePickerModal
                isOpen={isBlockerModalOpen}
                onClose={() => setIsBlockerModalOpen(false)}
                onConfirm={handleBlockSlot}
                showBlockDayToggle={true}
                blockedSlots={blockedSlots}
            />

            <Modal {...modalInfo} onClose={() => setModalInfo({ ...modalInfo, isOpen: false })} />
            
            {toastInfo && (
                <div key={toastInfo.id} className="toast-container">
                    <Toast message={toastInfo.message} type={toastInfo.type} />
                </div>
            )}
        </div>
    );
};

export default App;