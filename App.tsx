

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
import RevenueDashboard from './components/RevenueDashboard';
import ServicesView from './components/ServicesView';
import Toast from './components/Toast';
import ThemeSwitcher, { themes } from './components/ThemeSwitcher';
import BackupRestore from './components/BackupRestore';
import LogoUploader from './components/LogoUploader';
import NotificationManager from './components/NotificationManager';
import UserManagement from './components/UserManagement';

// Utils, Types, and Constants
import { getAverageColor, getContrastColor, generateGradient } from './components/colorUtils';
import { Appointment, Client, User, BlockedSlot, Service, MonthlyPackage, EnrichedClient, ModalInfo, AppointmentStatus } from './types';
import { SERVICES } from './constants';

const PlusIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
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
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const storageKeyPrefix = useMemo(() => currentUser ? `spaco-delas-${currentUser.username}` : 'spaco-delas-global', [currentUser]);

    // Data State
    const [appointments, setAppointments] = usePersistentState<Appointment[]>(`${storageKeyPrefix}-appointments`, []);
    const [clients, setClients] = usePersistentState<Client[]>(`${storageKeyPrefix}-clients`, []);
    const [blockedSlots, setBlockedSlots] = usePersistentState<BlockedSlot[]>(`${storageKeyPrefix}-blockedSlots`, []);
    const [services, setServices] = usePersistentState<Service[]>(`${storageKeyPrefix}-services`, SERVICES);
    const [monthlyPackage, setMonthlyPackage] = usePersistentState<MonthlyPackage>(`${storageKeyPrefix}-package`, { serviceName: 'Pé+Mão', price: 180 });
    
    // Global/UI State (some are user-specific, some are global)
    const [logoUrl, setLogoUrl] = usePersistentState<string>('spaco-delas-global-logo', '/logo.png');
    const [currentTheme, setCurrentTheme] = usePersistentState<string>('spaco-delas-global-theme', 'pink');
    const [activeView, setActiveView] = useState<'agenda' | 'calendar' | 'clients' | 'services' | 'settings'>('agenda');
    
    // Form & Modal Visibility State
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [isClientFormVisible, setIsClientFormVisible] = useState(false);
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
    
    // Apply theme and generate header style from logo
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', currentTheme);
        
        const setFallbackHeader = () => {
            const theme = themes.find(t => t.name === currentTheme);
            const primaryColor = theme ? theme.color : '#C77D93'; // Default pink
            
            const r = parseInt(primaryColor.slice(1, 3), 16);
            const g = parseInt(primaryColor.slice(3, 5), 16);
            const b = parseInt(primaryColor.slice(5, 7), 16);
            
            setHeaderStyle({
                background: generateGradient(r, g, b),
                color: getContrastColor(r, g, b),
                notificationBg: `rgba(${Math.max(0, r-20)}, ${Math.max(0, g-20)}, ${Math.max(0, b-20)}, 0.5)`
            });
        };

        if (!logoUrl) {
            console.warn('logoUrl is not set, using fallback header style.');
            setFallbackHeader();
            return;
        }

        getAverageColor(logoUrl)
            .then(color => {
                const contrastColor = getContrastColor(color.r, color.g, color.b);
                const notificationBg = `rgba(${Math.max(0, color.r - 20)}, ${Math.max(0, color.g - 20)}, ${Math.max(0, color.b - 20)}, 0.5)`;
                setHeaderStyle({
                    background: generateGradient(color.r, color.g, color.b),
                    color: contrastColor,
                    notificationBg: notificationBg,
                });
            })
            .catch(err => {
                // This is a handled error (e.g., invalid logo URL), so we just apply the fallback.
                // Logging it as an error can be alarming when the app functions as intended.
                setFallbackHeader();
            });
    }, [currentTheme, logoUrl]);
    
    // --- DERIVED STATE & MEMOS ---
    
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
    
     // Calculate revenue
    const { projectedRevenue, monthlyRevenue } = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        return appointments.reduce((acc, appt) => {
            const value = appt.services.reduce((sum, s) => sum + s.value, 0);
            const apptMonth = appt.datetime.getMonth();
            const apptYear = appt.datetime.getFullYear();

            if (appt.status === 'scheduled' || appt.status === 'confirmed' || appt.status === 'delayed') {
                acc.projectedRevenue += value;
            }
            if (appt.status === 'completed' && apptMonth === currentMonth && apptYear === currentYear) {
                acc.monthlyRevenue += value;
            }
            return acc;
        }, { projectedRevenue: 0, monthlyRevenue: 0 });
    }, [appointments]);

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
    const handleLogin = useCallback((user: User) => {
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
        handleCloseForm();
        showToast('Agendamento criado com sucesso!', 'success');
        openWhatsApp(newAppointment, 'new');
    }, [handleCloseForm, showToast, setAppointments]);

    const handleUpdateAppointment = useCallback((updatedAppointment: Appointment) => {
        setAppointments(prev => prev.map(a => a.id === updatedAppointment.id ? updatedAppointment : a));
        handleCloseForm();
        showToast('Agendamento atualizado!', 'success');
        showModal('Notificar Cliente?', 'Deseja enviar uma mensagem no WhatsApp com as alterações?', () => {
            const messageType = updatedAppointment.status === 'cancelled' ? 'cancel' : 'update';
            openWhatsApp(updatedAppointment, messageType);
        });
    }, [handleCloseForm, showToast, showModal, setAppointments]);

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
    
    // Fix: Create a handler for updating a single service to pass to ServicesView.
    // This resolves the type mismatch where setServices (expecting Service[]) was
    // passed to a prop expecting a function that takes a single Service.
    const handleUpdateService = useCallback((updatedService: Service) => {
        setServices(prevServices =>
            prevServices.map(service =>
                service.name === updatedService.name ? updatedService : service
            )
        );
        showToast('Serviço atualizado com sucesso!', 'success');
    }, [setServices, showToast]);

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
    }, [appointments, clients, blockedSlots, services, monthlyPackage, logoUrl, currentTheme, showToast, showModal]);

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
                showToast('Dados restaurados com sucesso!', 'success');
            } else {
                 throw new Error("Formato de arquivo inválido.");
            }
        } catch(e: any) {
             showModal('Erro de Importação', `Falha ao restaurar dados. Detalhe: ${e.message}`);
        }
    }, [setAppointments, setClients, setBlockedSlots, setServices, setMonthlyPackage, setLogoUrl, setCurrentTheme, showToast, showModal]);
    

    // --- RENDER LOGIC ---

    const renderActiveView = () => {
        switch (activeView) {
            case 'agenda':
                return (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-6">
                            <div className="flex justify-between items-center">
                                <h2 className="text-3xl font-bold text-[var(--text-dark)]">Agenda do Dia</h2>
                                <button
                                    onClick={() => handleOpenForm(null)}
                                    className="flex items-center px-6 py-3 bg-[var(--primary)] text-white font-bold rounded-lg shadow-md hover:bg-[var(--primary-hover)] transition-transform transform hover:scale-105 active:scale-95"
                                >
                                    <PlusIcon />
                                    Novo Agendamento
                                </button>
                            </div>
                            <CalendarView appointments={appointments} blockedSlots={blockedSlots} onEditAppointment={handleOpenForm} />
                        </div>
                        <div className="lg:col-span-1">
                            <RevenueDashboard projectedRevenue={projectedRevenue} monthlyRevenue={monthlyRevenue} />
                        </div>
                    </div>
                );
            case 'calendar':
                return <CalendarView appointments={appointments} blockedSlots={blockedSlots} onEditAppointment={handleOpenForm} />;
            case 'clients':
                return <ClientList clients={enrichedClients} onAddClient={() => handleOpenClientForm(null)} onEditClient={client => handleOpenClientForm(client)} />;
            case 'services':
                return <ServicesView services={services} onUpdateService={handleUpdateService} monthlyPackage={monthlyPackage} onUpdatePackage={setMonthlyPackage} />;
            case 'settings':
                return (
                    <div className="max-w-4xl mx-auto space-y-8">
                        <h2 className="text-4xl font-bold text-[var(--text-dark)] text-center">Configurações</h2>
                        <ThemeSwitcher currentTheme={currentTheme} onThemeChange={setCurrentTheme} />
                        <LogoUploader currentLogo={logoUrl} onLogoChange={(url) => setLogoUrl(url || '/logo.png')} onError={showModal} />
                        <CollapsibleSection title="Backup e Restauração">
                            <BackupRestore onExport={handleExportData} onImport={handleImportData} onError={showModal} />
                        </CollapsibleSection>
                         <CollapsibleSection title="Gerenciar Usuários">
                            <UserManagement showToast={showToast} showModal={showModal} />
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
        <div ref={appContainerRef} className="bg-[var(--background)] min-h-screen text-[var(--text-body)] transition-colors duration-500">
            <div className={`p-4 sm:p-6 transition-all duration-500 ${headerStyle ? '' : 'bg-[var(--primary)]'}`}>
                <Header 
                    logoUrl={logoUrl} 
                    headerStyle={headerStyle}
                    notificationAppointments={notificationAppointments}
                    isNotificationPopoverOpen={isNotificationPopoverOpen}
                    onToggleNotificationPopover={() => setIsNotificationPopoverOpen(prev => !prev)}
                    currentUser={currentUser}
                    onLogout={handleLogout}
                />
            </div>

            {/* Navigation */}
            <nav className="flex justify-center bg-white/50 backdrop-blur-sm shadow-md sticky top-0 z-30">
                {([
                    { label: 'Agenda', view: 'agenda' }, 
                    { label: 'Calendário', view: 'calendar' }, 
                    { label: 'Clientes', view: 'clients' }, 
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
                {renderActiveView()}
            </main>

            {/* Modals and Forms as Overlays */}
            {(isFormVisible || isClientFormVisible) && <div className="fixed inset-0 bg-black bg-opacity-50 z-40 animate-backdrop-in" onClick={isFormVisible ? handleCloseForm : handleCloseClientForm}></div>}
            
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