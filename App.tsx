

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import CalendarView from './components/CalendarView';
import AppointmentForm from './components/AppointmentForm';
import ClientList from './components/ClientList';
import ClientForm from './components/ClientForm';
import Settings from './components/Settings';
import Header from './components/Header';
import Modal from './components/Modal';
import Toast from './components/Toast';
import LoginScreen from './components/LoginScreen';
import ServicesView from './components/ServicesView';
import FinancialsView from './components/FinancialsView';
import PaymentsView from './components/PaymentsView';
import BackupRestore from './components/BackupRestore';
import UserManagement from './components/UserManagement';
import SmartSchedulerModal from './components/SmartSchedulerModal';
import BookingRequestManager from './components/BookingRequestManager';
import CollapsibleSection from './components/CollapsibleSection';
import LogoUploader from './components/LogoUploader';
// FIX: Import ThemeSwitcher to resolve 'Cannot find name' error.
import ThemeSwitcher from './components/ThemeSwitcher';
import { Appointment, Client, EnrichedClient, BlockedSlot, Service, ModalInfo, Professional, StoredProfessional, MonthlyPackage, PaymentLink, PaymentProof } from './types';
import { SERVICES, MONTHS } from './constants';
import * as emailService from './utils/emailService';
import { getAverageColor, getContrastColor, generateGradient } from './components/colorUtils';

type View = 'calendar' | 'clients' | 'services' | 'financials' | 'payments' | 'settings';

const dateTimeReviver = (key: string, value: any) => {
    const isoFormat = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/;
    if (typeof value === 'string' && isoFormat.test(value)) {
        if (key === 'datetime' || key === 'endTime' || key === 'date' || key === 'createdAt' || key === 'validatedAt') {
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
                return date;
            }
        }
    }
    return value;
};

const useStickyState = <T,>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
    const [value, setValue] = useState<T>(() => {
        try {
            const stickyValue = window.localStorage.getItem(key);
            return stickyValue !== null ? JSON.parse(stickyValue, dateTimeReviver) : defaultValue;
        } catch (error) {
            console.error(`Error reading localStorage key “${key}”:`, error);
            return defaultValue;
        }
    });

    useEffect(() => {
        try {
            window.localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error(`Error setting localStorage key “${key}”:`, error);
        }
    }, [key, value]);

    return [value, setValue];
};

const App: React.FC = () => {
    const [currentUser, setCurrentUser] = useStickyState<Professional | null>('spaco-delas-currentUser', null);
    const [currentView, setCurrentView] = useStickyState<View>('spaco-delas-currentView', 'calendar');

    const [appointments, setAppointments] = useStickyState<Appointment[]>('spaco-delas-appointments', []);
    const [clients, setClients] = useStickyState<Client[]>('spaco-delas-clients', []);
    const [services, setServices] = useStickyState<Service[]>('spaco-delas-services', SERVICES);
    const [blockedSlots, setBlockedSlots] = useStickyState<BlockedSlot[]>('spaco-delas-blockedSlots', []);
    const [users, setUsers] = useStickyState<Record<string, StoredProfessional>>('spaco-delas-users', {});
    const [monthlyPackage, setMonthlyPackage] = useStickyState<MonthlyPackage>('spaco-delas-monthly-package', { serviceName: 'Pé+Mão', price: 180 });
    const [appointmentRequests, setAppointmentRequests] = useStickyState<Appointment[]>('spaco-delas-appointment-requests', []);
    const [paymentLinks, setPaymentLinks] = useStickyState<Record<string, PaymentLink>>('spaco-delas-payment-links', {});
    const [paymentProofs, setPaymentProofs] = useStickyState<PaymentProof[]>('spaco-delas-payment-proofs', []);
    const [logoUrl, setLogoUrl] = useStickyState<string>('spaco-delas-global-logo', '/logo.png');
    const [theme, setTheme] = useStickyState<string>('app-theme', 'pink');
    
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [appointmentToEdit, setAppointmentToEdit] = useState<Appointment | null>(null);
    const [clientToEdit, setClientToEdit] = useState<Client | null>(null);
    const [isClientFormOpen, setIsClientFormOpen] = useState(false);
    const [isSmartSchedulerOpen, setIsSmartSchedulerOpen] = useState(false);
    const [isBookingRequestModalOpen, setIsBookingRequestModalOpen] = useState(false);
    
    const [newlyAddedAppointmentId, setNewlyAddedAppointmentId] = useState<number | null>(null);
    const [prefilledAppointmentData, setPrefilledAppointmentData] = useState<Partial<Appointment> | null>(null);
    
    const [modalInfo, setModalInfo] = useState<ModalInfo>({ isOpen: false, title: '', message: '' });
    const [toastInfo, setToastInfo] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const [isNotificationPopoverOpen, setIsNotificationPopoverOpen] = useState(false);
    const [headerStyle, setHeaderStyle] = useState<{ background: string; color: string; notificationBg: string; } | null>(null);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);
    
    useEffect(() => {
        if (newlyAddedAppointmentId) {
            const timer = setTimeout(() => setNewlyAddedAppointmentId(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [newlyAddedAppointmentId]);

    useEffect(() => {
        if (toastInfo) {
            const timer = setTimeout(() => setToastInfo(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toastInfo]);

     useEffect(() => {
        const fetchHeaderStyle = async () => {
            if (logoUrl) {
                try {
                    const { r, g, b } = await getAverageColor(logoUrl);
                    const textColor = getContrastColor(r, g, b);
                    const gradient = generateGradient(r, g, b);
                    const notificationBg = `rgba(${textColor === '#FFFFFF' ? '255,255,255' : '0,0,0'}, 0.1)`;
                    setHeaderStyle({ background: gradient, color: textColor, notificationBg });
                } catch (error) {
                    console.error("Failed to generate header style from logo:", error);
                    setHeaderStyle(null); // Reset to default if error
                }
            } else {
                 setHeaderStyle(null);
            }
        };
        fetchHeaderStyle();
    }, [logoUrl]);

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
    
    const enrichedClients = useMemo((): EnrichedClient[] => {
        return clients.map(client => {
            const clientAppointments = appointments.filter(a => a.clientPhone === client.phone);
            const completedAppointments = clientAppointments.filter(a => a.status === 'completed');
            
            const totalSpent = completedAppointments.reduce((sum, appt) => sum + appt.services.reduce((s, service) => s + service.value, 0), 0);
            
            let daysSinceLastVisit: number | null = null;
            if (completedAppointments.length > 0) {
                const lastVisit = completedAppointments.reduce((latest, current) => new Date(current.datetime) > new Date(latest.datetime) ? current : latest);
                const diffTime = Math.abs(new Date().getTime() - new Date(lastVisit.datetime).getTime());
                daysSinceLastVisit = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            }
            
            const cancellationCount = clientAppointments.filter(a => a.status === 'cancelled').length;

            return { ...client, totalSpent, daysSinceLastVisit, cancellationCount };
        });
    }, [clients, appointments]);

    const financialData = useMemo(() => {
        const completed = appointments.filter(a => a.status === 'completed' || (a.status === 'confirmed' && new Date(a.datetime) < new Date()));
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();

        const monthlyRevenue: { [key: string]: number } = {};
        const revenueByService: { [serviceName: string]: number } = {};
        const revenueByProfessional: { [profName: string]: number } = {};

        completed.forEach(appt => {
            const apptDate = new Date(appt.datetime);
            const monthKey = `${apptDate.getFullYear()}-${String(apptDate.getMonth()).padStart(2, '0')}`;
            const apptValue = appt.services.reduce((sum, s) => sum + s.value, 0);

            monthlyRevenue[monthKey] = (monthlyRevenue[monthKey] || 0) + apptValue;

            if (apptDate.getFullYear() === currentYear) {
                appt.services.forEach(s => {
                    revenueByService[s.name] = (revenueByService[s.name] || 0) + s.value;
                });
                const prof = professionals.find(p => p.username === appt.professionalUsername);
                if (prof) {
                    revenueByProfessional[prof.name] = (revenueByProfessional[prof.name] || 0) + apptValue;
                }
            }
        });

        const currentMonthKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
        const currentMonthRevenue = monthlyRevenue[currentMonthKey] || 0;
        
        const projectedRevenueCurrentMonth = appointments
            .filter(a => new Date(a.datetime).getFullYear() === currentYear && new Date(a.datetime).getMonth() === currentMonth && a.status !== 'cancelled')
            .reduce((sum, a) => sum + a.services.reduce((s, service) => s + service.value, 0), 0);

        const revenueValues = Object.values(monthlyRevenue);
        const averageMonthlyRevenue = revenueValues.length > 0 ? revenueValues.reduce((a, b) => a + b, 0) / revenueValues.length : 0;
        const totalAnnualRevenue = Object.entries(monthlyRevenue)
            .filter(([key]) => key.startsWith(String(currentYear)))
            .reduce((sum, [, value]) => sum + value, 0);

        return { monthlyRevenue, currentMonthRevenue, projectedRevenueCurrentMonth, averageMonthlyRevenue, totalAnnualRevenue, revenueByService, revenueByProfessional };
    }, [appointments, professionals]);

    const notificationAppointments = useMemo(() => {
        const now = new Date();
        const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        return appointments.filter(a => {
            const apptTime = new Date(a.datetime);
            return (a.status === 'scheduled' || a.status === 'confirmed') && apptTime > now && apptTime < in24Hours;
        }).sort((a,b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());
    }, [appointments]);


    const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
        setToastInfo({ message, type });
    }, []);

    const showModal = useCallback((title: string, message: string, onConfirm?: () => void, buttons?: any[]) => {
        setModalInfo({ isOpen: true, title, message, onConfirm, buttons });
    }, []);
    
    const closeModal = () => setModalInfo({ isOpen: false, title: '', message: '' });

    const handleLogin = (user: Professional) => setCurrentUser(user);
    const handleLogout = () => setCurrentUser(null);
    const handleViewChange = (view: View) => setCurrentView(view);
    
    const handleScheduleAppointment = (newAppointmentData: Omit<Appointment, 'id' | 'status'> & { isPackage?: boolean }) => {
        if (newAppointmentData.isPackage) {
            const packageAppointments: Omit<Appointment, 'id'>[] = [];
            const { isPackage, ...baseAppointment } = newAppointmentData;
            const packageId = `pkg-${Date.now()}`;
            
            for (let i = 0; i < 4; i++) {
                const weekDate = new Date(baseAppointment.datetime);
                weekDate.setDate(weekDate.getDate() + (i * 7));

                const servicesForWeek = (i % 2 === 0) 
                    ? services.filter(s => s.name === 'Manicure') // Week 1 & 3: Manicure
                    : services.filter(s => s.name === 'Pedicure' || s.name === 'Manicure'); // Week 2 & 4: Pedi+Mani
                
                const duration = servicesForWeek.reduce((sum, s) => sum + s.duration, 0);
                const endTime = new Date(weekDate.getTime() + duration * 60000);

                packageAppointments.push({
                    ...baseAppointment,
                    services: servicesForWeek,
                    datetime: weekDate,
                    endTime,
                    status: 'scheduled',
                    isPackageAppointment: true,
                    packageId,
                    paymentStatus: 'pending', // Package implies payment is pending upfront
                });
            }
            
            const newAppointmentsWithIds = packageAppointments.map(appt => ({ ...appt, id: Date.now() + Math.random() }));
            setAppointments(prev => [...prev, ...newAppointmentsWithIds]);
            showToast('Pacote mensal agendado com sucesso!', 'success');
        } else {
            const newAppointment: Appointment = { ...newAppointmentData, id: Date.now(), status: 'scheduled' };
            setAppointments(prev => [...prev, newAppointment]);
            setNewlyAddedAppointmentId(newAppointment.id);
        }
        
        const clientExists = clients.some(c => c.phone === newAppointmentData.clientPhone);
        if (!clientExists) {
            const newClient: Client = {
                id: Date.now(),
                name: newAppointmentData.clientName,
                phone: newAppointmentData.clientPhone,
                email: newAppointmentData.clientEmail,
            };
            setClients(prev => [...prev, newClient]);
        }
        setIsFormOpen(false);
    };

    const handleUpdateAppointment = (updatedAppointment: Appointment) => {
        setAppointments(prev => prev.map(a => a.id === updatedAppointment.id ? updatedAppointment : a));
        setIsFormOpen(false);
        setAppointmentToEdit(null);
        showToast('Agendamento atualizado com sucesso!', 'success');
    };

    const openAppointmentForm = (appointment: Appointment | null = null) => {
        setAppointmentToEdit(appointment);
        setIsFormOpen(true);
    };

    const handleSaveClient = (clientData: Omit<Client, 'id'> | Client) => {
        if ('id' in clientData) {
            setClients(prev => prev.map(c => c.id === clientData.id ? clientData : c));
            showToast('Cliente atualizado com sucesso!', 'success');
        } else {
            const newClient: Client = { ...clientData, id: Date.now() };
            setClients(prev => [...prev, newClient]);
            showToast('Cliente adicionado com sucesso!', 'success');
        }
        setIsClientFormOpen(false);
        setClientToEdit(null);
    };

    const handleApproveBookingRequest = (request: Appointment) => {
        // FIX: Destructure request to omit 'id' and 'status', matching handleScheduleAppointment's expected type.
        const { id, status, ...appointmentData } = request;
        // Treat as a new appointment
        handleScheduleAppointment(appointmentData);
        // Remove from requests list
        setAppointmentRequests(prev => prev.filter(r => r.id !== request.id));
        showToast(`Agendamento para ${request.clientName} aprovado!`, 'success');
    };
    
    const handleRejectBookingRequest = (requestId: number) => {
        setAppointmentRequests(prev => prev.filter(r => r.id !== requestId));
        showToast(`Solicitação rejeitada.`, 'success');
    };
    
    const handleUpdateProof = (updatedProof: PaymentProof) => {
        setPaymentProofs(prev => prev.map(p => p.id === updatedProof.id ? updatedProof : p));
    };

    const handleMarkAppointmentsAsPaid = (appointmentIds: number[]) => {
        setAppointments(prev => prev.map(appt => 
            appointmentIds.includes(appt.id) ? { ...appt, paymentStatus: 'paid' } : appt
        ));
    };

    const handleExportData = () => {
        const data = {
            appointments,
            clients,
            services,
            blockedSlots,
            users,
            monthlyPackage,
            appointmentRequests,
            paymentLinks,
            paymentProofs,
            logoUrl,
            theme,
        };
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `spaco_delas_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Backup exportado com sucesso!', 'success');
    };
    
    const handleImportData = (data: any) => {
        // Add basic validation
        if (data && typeof data === 'object' && ('appointments' in data || 'clients' in data)) {
            setAppointments(data.appointments || []);
            setClients(data.clients || []);
            setServices(data.services || SERVICES);
            setBlockedSlots(data.blockedSlots || []);
            setUsers(data.users || {});
            setMonthlyPackage(data.monthlyPackage || { serviceName: 'Pé+Mão', price: 180 });
            setAppointmentRequests(data.appointmentRequests || []);
            setPaymentLinks(data.paymentLinks || {});
            setPaymentProofs(data.paymentProofs || []);
            setLogoUrl(data.logoUrl || '/logo.png');
            setTheme(data.theme || 'pink');
            showToast('Dados restaurados com sucesso!', 'success');
        } else {
            showModal("Erro de Importação", "O arquivo de backup parece ser inválido ou está corrompido.");
        }
    };

    if (!currentUser) {
        return <LoginScreen onLogin={handleLogin} showToast={showToast} />;
    }

    const renderView = () => {
        switch (currentView) {
            case 'calendar':
                return <CalendarView appointments={appointments} blockedSlots={blockedSlots} onEditAppointment={openAppointmentForm} onUpdateAppointment={handleUpdateAppointment} newlyAddedAppointmentId={newlyAddedAppointmentId} professionals={professionals} currentUser={currentUser} />;
            case 'clients':
                return <ClientList clients={enrichedClients} appointments={appointments} onAddClient={() => setIsClientFormOpen(true)} onEditClient={(c) => { setClientToEdit(c); setIsClientFormOpen(true); }} onImportClients={() => showToast("Sincronização de contatos não implementada.", "error")} viewingHistoryFor={null} onClearHistoryView={() => {}} />;
            case 'services':
                return <ServicesView services={services} onUpdateService={s => setServices(prev => prev.map(ps => ps.name === s.name ? s : ps))} monthlyPackage={monthlyPackage} onUpdatePackage={setMonthlyPackage} />;
            case 'financials':
                return <FinancialsView financialData={financialData} />;
            case 'payments':
                return <PaymentsView proofs={paymentProofs} clients={clients} appointments={appointments} onUpdateProof={handleUpdateProof} onMarkAppointmentsAsPaid={handleMarkAppointmentsAsPaid} showToast={showToast} />;
            case 'settings':
                return (
                    <div className="space-y-8 max-w-4xl mx-auto animate-view-in">
                        <h2 className="text-4xl font-bold text-[var(--text-dark)] text-center">Configurações</h2>
                        <div className="bg-white/80 p-6 rounded-xl shadow-md border border-[var(--border)] space-y-6">
                             <CollapsibleSection title="Aparência" defaultOpen>
                                <ThemeSwitcher currentTheme={theme} onThemeChange={setTheme} />
                                <LogoUploader currentLogo={logoUrl} onLogoChange={(url) => setLogoUrl(url || '/logo.png')} onError={(title, msg) => showModal(title, msg)} />
                            </CollapsibleSection>
                             <CollapsibleSection title="Profissionais">
                                <UserManagement showToast={showToast} showModal={showModal} services={services} professionals={users} onUsersChange={setUsers} />
                            </CollapsibleSection>
                            <CollapsibleSection title="Backup e Restauração">
                                <BackupRestore onExport={handleExportData} onImport={handleImportData} onError={(title, msg) => showModal(title, msg)} />
                            </CollapsibleSection>
                        </div>
                    </div>
                );
            default:
                return <div>View not found</div>;
        }
    };
    
    // FIX: Change JSX.Element to React.ReactNode to resolve 'Cannot find name JSX' error.
    const VIEW_CONFIG: { [key in View]: { label: string; icon: React.ReactNode } } = {
        calendar: { label: 'Agenda', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> },
        clients: { label: 'Clientes', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.124-1.282-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.124-1.282.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm-9 3a2 2 0 11-4 0 2 2 0 014 0z" /></svg> },
        services: { label: 'Serviços', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg> },
        financials: { label: 'Financeiro', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg> },
        payments: { label: 'Pagamentos', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg> },
        settings: { label: 'Ajustes', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
    };

    // FIX: Define SparklesIcon to resolve 'Cannot find name' error.
    const SparklesIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
        <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.293 2.293a1 1 0 010 1.414L10 12l-2.293-2.293a1 1 0 010-1.414L10 6m5 4l2.293-2.293a1 1 0 000-1.414L15 6m-5 4l-2.293 2.293a1 1 0 000 1.414L10 18l2.293-2.293a1 1 0 000-1.414L10 12z" />
        </svg>
    );

    return (
        <div className="flex flex-col h-screen bg-[var(--background)] text-[var(--text-body)] font-sans">
            <div className="p-4 md:p-6">
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

            <div className="flex-grow flex flex-col md:flex-row overflow-hidden px-4 md:px-6 pb-4 md:pb-6 gap-6">
                {/* Sidebar Navigation */}
                <aside className="flex-shrink-0 flex md:flex-col justify-around md:justify-start md:space-y-2 bg-[var(--surface-opaque)] p-2 md:p-3 rounded-full md:rounded-2xl border border-[var(--border)]">
                    {Object.entries(VIEW_CONFIG).map(([viewKey, { label, icon }]) => (
                        <button 
                            key={viewKey}
                            onClick={() => handleViewChange(viewKey as View)} 
                            className={`nav-button ${currentView === viewKey ? 'active' : ''}`}
                            aria-label={label}
                        >
                            {icon}
                            <span className="hidden md:inline-block ml-3">{label}</span>
                        </button>
                    ))}
                    <button onClick={() => setIsSmartSchedulerOpen(true)} className="nav-button-ia" aria-label="Agendamento Rápido com IA">
                        <SparklesIcon />
                        <span className="hidden md:inline-block ml-3">Agendar com IA</span>
                    </button>
                </aside>

                {/* Main Content */}
                <main className="flex-grow bg-[var(--surface-opaque)] p-4 sm:p-6 rounded-2xl shadow-inner border border-[var(--border)] overflow-y-auto">
                    {renderView()}
                </main>
            </div>
            
            {/* FAB for mobile */}
            <button
                onClick={() => openAppointmentForm()}
                className="fixed bottom-20 right-5 md:hidden w-16 h-16 bg-[var(--primary)] text-white rounded-full shadow-lg flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary)] transition-transform transform hover:scale-110 active:scale-95 z-50"
                aria-label="Novo Agendamento"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
            </button>

            {isFormOpen && (
                <Modal isOpen={true} title="" message="" onClose={() => { setIsFormOpen(false); setAppointmentToEdit(null); }}>
                    <AppointmentForm
                        onSchedule={handleScheduleAppointment}
                        appointmentToEdit={appointmentToEdit}
                        onUpdate={handleUpdateAppointment}
                        onCancelEdit={() => { setIsFormOpen(false); setAppointmentToEdit(null); }}
                        appointments={appointments}
                        blockedSlots={blockedSlots}
                        onMarkAsDelayed={(appt) => handleUpdateAppointment({...appt, status: 'delayed'})}
                        onCompleteAppointment={(appt) => handleUpdateAppointment({...appt, status: 'completed'})}
                        services={services}
                        clients={clients}
                        onViewClientHistory={(client) => { setIsFormOpen(false); handleViewChange('clients'); }} // Simplified
                        professionals={professionals}
                        currentUser={currentUser}
                        showToast={showToast}
                        monthlyPackagePrice={monthlyPackage.price}
                        prefilledData={prefilledAppointmentData}
                        onFormReady={() => setPrefilledAppointmentData(null)}
                    />
                </Modal>
            )}
            
            {isClientFormOpen && (
                 <Modal isOpen={true} title="" message="" onClose={() => { setIsClientFormOpen(false); setClientToEdit(null); }}>
                    <ClientForm 
                        onSave={handleSaveClient}
                        clientToEdit={clientToEdit}
                        onCancel={() => { setIsClientFormOpen(false); setClientToEdit(null); }}
                        existingClients={clients}
                    />
                </Modal>
            )}

            <SmartSchedulerModal 
                isOpen={isSmartSchedulerOpen}
                onClose={() => setIsSmartSchedulerOpen(false)}
                onSchedule={(data) => {
                    setIsSmartSchedulerOpen(false);
                    setPrefilledAppointmentData(data);
                    setIsFormOpen(true);
                }}
                services={services}
                professionals={professionals}
                showToast={showToast}
                currentUser={currentUser}
            />

            <BookingRequestManager
                isOpen={isBookingRequestModalOpen}
                onClose={() => setIsBookingRequestModalOpen(false)}
                requests={appointmentRequests}
                professionals={professionals}
                onApprove={handleApproveBookingRequest}
                onReject={handleRejectBookingRequest}
            />

            <Modal {...modalInfo} onClose={closeModal} />

            {toastInfo && <Toast message={toastInfo.message} type={toastInfo.type} />}
        </div>
    );
};

export default App;
