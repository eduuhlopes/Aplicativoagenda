import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Appointment, ModalInfo, Client, BlockedSlot, User } from './types';
import Header from './components/Header';
import AppointmentForm from './components/AppointmentForm';
import AppointmentList from './components/AppointmentList';
import Modal from './components/Modal';
import RevenueDashboard from './components/RevenueDashboard';
import ClientList from './components/ClientList';
import DateTimePickerModal from './components/DateTimePickerModal';
import LoginScreen from './components/LoginScreen';

const API_BASE_URL = '/api';

const AgendaManagementIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 inline-block ml-2 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2zM7 16h.01M12 16h.01M17 16h.01" />
    </svg>
);

const AgendaManagement: React.FC<{
    blockedSlots: BlockedSlot[];
    onBlockSlot: (data: { date: Date, isFullDay: boolean, startTime?: string, endTime?: string }) => void;
    onUnblockSlot: (id: number) => void;
}> = ({ blockedSlots, onBlockSlot, onUnblockSlot }) => {
    const [isPickerOpen, setIsPickerOpen] = useState(false);

    const handleDateSelectAndBlock = (data: { date: Date, isFullDay: boolean, startTime?: string, endTime?: string }) => {
        onBlockSlot(data);
        setIsPickerOpen(false);
    };

    return (
        <>
            <div className="border-t-2 border-pink-200 pt-8 mt-8">
                <h2 className="text-2xl font-bold text-purple-800 text-center mb-4 flex items-center justify-center">
                    Gerenciar Agenda
                    <AgendaManagementIcon />
                </h2>
                <div className="mb-6 text-center">
                    <button
                        onClick={() => setIsPickerOpen(true)}
                        className="w-full py-3 px-4 bg-yellow-500 text-white font-bold text-lg rounded-lg shadow-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-transform transform hover:scale-105"
                    >
                        Bloquear Horário
                    </button>
                </div>
                <div>
                    <h3 className="text-xl font-semibold text-purple-700 mb-3 text-center">Horários Bloqueados</h3>
                     <div className="flex-grow overflow-y-auto pr-2 -mr-2 space-y-2 max-h-48">
                        {blockedSlots.length === 0 ? (
                            <p className="text-purple-600 text-center italic">Nenhum horário bloqueado.</p>
                        ) : (
                            blockedSlots.map(slot => (
                                <div key={slot.id} className="bg-white p-3 rounded-lg shadow flex items-center justify-between">
                                    <p className="font-semibold text-purple-800">
                                        {new Date(slot.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                        {' - '}
                                        {slot.isFullDay ? 'Dia Inteiro' : (slot.endTime ? `${slot.startTime} às ${slot.endTime}` : slot.startTime)}
                                    </p>
                                    <button
                                        onClick={() => onUnblockSlot(slot.id)}
                                        className="px-3 py-1 bg-green-500 text-white font-semibold rounded-lg shadow-sm hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-green-500 transition-colors text-sm"
                                    >
                                        Desbloquear
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
            <DateTimePickerModal
                isOpen={isPickerOpen}
                onClose={() => setIsPickerOpen(false)}
                onConfirm={handleDateSelectAndBlock}
                showBlockDayToggle={true}
                blockedSlots={blockedSlots}
            />
        </>
    );
};


const App: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
    
    const [modalInfo, setModalInfo] = useState<ModalInfo>({
        isOpen: false,
        title: '',
        message: '',
    });

    const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
    const [activeView, setActiveView] = useState<'appointments' | 'clients'>('appointments');
    const [notificationAppointments, setNotificationAppointments] = useState<Appointment[]>([]);
    const [isNotificationPopoverOpen, setIsNotificationPopoverOpen] = useState(false);
    const [highlightedAppointmentId, setHighlightedAppointmentId] = useState<number | null>(null);
    const [removingAppointmentId, setRemovingAppointmentId] = useState<number | null>(null);

    const showModal = (title: string, message: string) => {
        setModalInfo({ isOpen: true, title, message });
    };

    const closeModal = () => {
        setModalInfo({ isOpen: false, title: '', message: '' });
    };

    const handleLogout = useCallback(() => {
        localStorage.removeItem('userToken');
        setUser(null);
        setAppointments([]);
        setBlockedSlots([]);
    }, []);

    const getAuthHeaders = useCallback(() => {
        const token = localStorage.getItem('userToken');
        if (!token) {
            handleLogout();
            return null;
        }
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        };
    }, [handleLogout]);

    useEffect(() => {
        const token = localStorage.getItem('userToken');
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                if (payload.exp * 1000 > Date.now()) {
                    setUser({ username: payload.username, id: payload.userId });
                } else {
                    handleLogout();
                }
            } catch (error) {
                console.error("Failed to parse token", error);
                handleLogout();
            }
        }
    }, [handleLogout]);

    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            const headers = getAuthHeaders();
            if (!headers) return;

            try {
                const [appointmentsRes, blockedSlotsRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/appointments`, { headers }),
                    fetch(`${API_BASE_URL}/blocked-slots`, { headers }),
                ]);

                if (!appointmentsRes.ok || !blockedSlotsRes.ok) {
                    if (appointmentsRes.status === 401 || blockedSlotsRes.status === 401) {
                        handleLogout();
                    }
                    throw new Error('Failed to fetch data from server.');
                }

                const appointmentsData = await appointmentsRes.json();
                const blockedSlotsData = await blockedSlotsRes.json();
                
                setAppointments(appointmentsData.map((appt: any) => ({ ...appt, datetime: new Date(appt.datetime) })));
                setBlockedSlots(blockedSlotsData.map((slot: any) => ({ ...slot, date: new Date(slot.date) })));

            } catch (error) {
                console.error("Error fetching data:", error);
                showModal("Erro de Conexão", "Não foi possível carregar os dados. Verifique se o servidor backend está rodando e tente novamente.");
            }
        };

        fetchData();
    }, [user, getAuthHeaders, handleLogout]);

     useEffect(() => {
        const now = new Date();
        const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        
        const upcoming = appointments.filter(appt => 
            appt.status === 'scheduled' &&
            new Date(appt.datetime) > now &&
            new Date(appt.datetime) <= twentyFourHoursFromNow
        );
        setNotificationAppointments(upcoming);
    }, [appointments]);

    useEffect(() => {
        if (highlightedAppointmentId) {
            const timer = setTimeout(() => setHighlightedAppointmentId(null), 2000);
            return () => clearTimeout(timer);
        }
    }, [highlightedAppointmentId]);

    const handleToggleNotificationPopover = useCallback(() => {
        setIsNotificationPopoverOpen(prev => !prev);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const notificationBell = document.getElementById('notification-bell');
            if (isNotificationPopoverOpen && notificationBell && !notificationBell.contains(event.target as Node)) {
                setIsNotificationPopoverOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isNotificationPopoverOpen]);
    
     const checkAppointmentConflict = useCallback((datetime: Date, appointmentIdToIgnore: number | null = null): string | null => {
        const now = new Date();
        // Allow a small grace period for updates to appointments happening right now
        if (datetime < now && (!appointmentIdToIgnore || (now.getTime() - datetime.getTime()) > 60000)) {
            return "Não é possível agendar horários no passado.";
        }

        const appointmentTime = `${String(datetime.getHours()).padStart(2, '0')}:00`;
        const appointmentDateStr = datetime.toDateString();

        for (const slot of blockedSlots) {
            if (new Date(slot.date).toDateString() !== appointmentDateStr) continue;

            if (slot.isFullDay) {
                return "Este dia está totalmente bloqueado e não aceita novos agendamentos.";
            }

            if (slot.startTime) {
                if (slot.endTime) { // Time range block (e.g., 10:00 to 12:00)
                    if (appointmentTime >= slot.startTime && appointmentTime < slot.endTime) {
                        return `Este horário está indisponível (bloqueado de ${slot.startTime} às ${slot.endTime}).`;
                    }
                } else { // Single time block
                    if (appointmentTime === slot.startTime) {
                        return `O horário das ${slot.startTime} está bloqueado.`;
                    }
                }
            }
        }
        
        for (const appt of appointments) {
            if (appt.id === appointmentIdToIgnore) continue;
            if (appt.datetime.getTime() === datetime.getTime()) {
                 return `Já existe um agendamento para ${appt.clientName} neste mesmo horário.`;
            }
        }

        return null;
    }, [blockedSlots, appointments]);

    const handleBlockSlot = useCallback(async (data: { date: Date, isFullDay: boolean, startTime?: string, endTime?: string }) => {
        const headers = getAuthHeaders();
        if (!headers) return;
        
        const newSlotDateStr = data.date.toDateString();
        const conflict = blockedSlots.some(s => {
            if (new Date(s.date).toDateString() !== newSlotDateStr) return false;

            if (s.isFullDay || data.isFullDay) return true;

            if (data.startTime && s.startTime) {
                const newStart = data.startTime;
                const newEnd = data.endTime || newStart;
                const existingStart = s.startTime;
                const existingEnd = s.endTime || existingStart;
                
                return newStart <= existingEnd && newEnd >= existingStart;
            }
            return false;
        });

        if (conflict) {
            showModal("Conflito de Horário", "O período selecionado entra em conflito com um bloqueio já existente.");
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/blocked-slots`, {
                method: 'POST',
                headers,
                body: JSON.stringify(data),
            });
            const newSlot = await response.json();
            if (!response.ok) throw new Error(newSlot.message || 'Falha ao bloquear horário.');

            setBlockedSlots(prev => {
                const updated = [...prev, { ...newSlot, date: new Date(newSlot.date) }];
                updated.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime() || (a.startTime || "").localeCompare(b.startTime || ""));
                return updated;
            });
            showModal("Sucesso", "Horário bloqueado com sucesso.");
        } catch (error) {
            console.error(error);
            showModal("Erro", error instanceof Error ? error.message : "Não foi possível bloquear o horário.");
        }
    }, [blockedSlots, getAuthHeaders]);

    const handleUnblockSlot = useCallback(async (id: number) => {
        const headers = getAuthHeaders();
        if (!headers) return;

        try {
            const response = await fetch(`${API_BASE_URL}/blocked-slots/${id}`, {
                method: 'DELETE',
                headers,
            });
            if (!response.ok) throw new Error('Falha ao desbloquear horário.');

            const slotToUnblock = blockedSlots.find(s => s.id === id);
            setBlockedSlots(prev => prev.filter(s => s.id !== id));
            showModal("Sucesso", `O bloqueio para ${slotToUnblock ? new Date(slotToUnblock.date).toLocaleDateString('pt-BR') : ''} foi removido.`);
        } catch (error) {
            console.error(error);
            showModal("Erro", error instanceof Error ? error.message : "Não foi possível desbloquear o horário.");
        }
    }, [blockedSlots, getAuthHeaders]);


    const handleScheduleAppointment = useCallback(async (newAppointmentData: Omit<Appointment, 'id' | 'status'>): Promise<boolean> => {
        const headers = getAuthHeaders();
        if (!headers) return false;

        const conflictMessage = checkAppointmentConflict(newAppointmentData.datetime);
        if (conflictMessage) {
            showModal("Horário Indisponível", conflictMessage);
            return false;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/appointments`, {
                method: 'POST',
                headers,
                body: JSON.stringify(newAppointmentData),
            });
            const newAppointment = await response.json();
            if (!response.ok) throw new Error(newAppointment.message || 'Falha ao agendar.');

            setAppointments(prev => {
                const updated = [...prev, { ...newAppointment, datetime: new Date(newAppointment.datetime) }];
                updated.sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());
                return updated;
            });
            
            setHighlightedAppointmentId(newAppointment.id);
            showModal("Sucesso", `Agendamento para ${newAppointment.clientName} marcado com sucesso.`);
            
            const sanitizedClientPhone = newAppointment.clientPhone.replace(/\D/g, '');
            const clientMessage = `Olá, ${newAppointment.clientName}! ✨\n\nSeu agendamento no salão foi confirmado com sucesso!\n\n*Serviço:* ${newAppointment.service}\n*Valor:* R$ ${newAppointment.value.toFixed(2)}\n*Data:* ${new Date(newAppointment.datetime).toLocaleDateString('pt-BR')}\n*Hora:* ${new Date(newAppointment.datetime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}\n\nMal podemos esperar para te ver! 🌸`;
            window.open(`https://wa.me/55${sanitizedClientPhone}?text=${encodeURIComponent(clientMessage)}`, '_blank');
            return true;

        } catch (error) {
            console.error(error);
            showModal("Erro", error instanceof Error ? error.message : "Não foi possível agendar.");
            return false;
        }
    }, [getAuthHeaders, checkAppointmentConflict, appointments]);

    const handleCancelAppointment = useCallback(async (appointmentId: number) => {
        const headers = getAuthHeaders();
        if (!headers) return;

        const appointmentToCancel = appointments.find(appt => appt.id === appointmentId);
        if (appointmentToCancel) {
             try {
                const response = await fetch(`${API_BASE_URL}/appointments/${appointmentId}`, { method: 'DELETE', headers });
                if (!response.ok) throw new Error('Falha ao cancelar no servidor.');

                setRemovingAppointmentId(appointmentId);
                setTimeout(() => {
                    setAppointments(prev => prev.filter(appt => appt.id !== appointmentId));
                    setRemovingAppointmentId(null);
                    showModal("Cancelado", `O agendamento de ${appointmentToCancel.clientName} foi cancelado.`);
                }, 500);
            } catch (error) {
                console.error(error);
                showModal("Erro", "Não foi possível cancelar o agendamento.");
            }
        }
    }, [appointments, getAuthHeaders]);

    const handleStartEdit = useCallback((appointment: Appointment) => {
        setEditingAppointment(appointment);
        setActiveView('appointments'); 
    }, []);

    const handleCancelEdit = useCallback(() => {
        setEditingAppointment(null);
    }, []);

    const handleUpdateAppointment = useCallback(async (updatedAppointment: Appointment): Promise<boolean> => {
        const headers = getAuthHeaders();
        if (!headers) return false;

        const conflictMessage = checkAppointmentConflict(updatedAppointment.datetime, updatedAppointment.id);
        if (conflictMessage) {
            showModal("Horário Indisponível", conflictMessage);
            return false;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/appointments/${updatedAppointment.id}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify(updatedAppointment),
            });
            const returnedAppointment = await response.json();
            if (!response.ok) throw new Error(returnedAppointment.message || 'Falha ao atualizar.');

            setAppointments(prev => {
                const updatedList = prev.map(appt =>
                    appt.id === returnedAppointment.id ? { ...returnedAppointment, datetime: new Date(returnedAppointment.datetime) } : appt
                );
                updatedList.sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());
                return updatedList;
            });
            setEditingAppointment(null);
            setHighlightedAppointmentId(returnedAppointment.id);
            showModal("Sucesso", "Agendamento atualizado com sucesso!");
            return true;
        } catch (error) {
            console.error(error);
            showModal("Erro", error instanceof Error ? error.message : "Não foi possível atualizar.");
            return false;
        }
    }, [getAuthHeaders, checkAppointmentConflict, appointments]);

    const handleUpdateAppointmentStatus = useCallback(async (appointmentId: number, update: Partial<Appointment>) => {
        const headers = getAuthHeaders();
        if (!headers) return;
        
        const originalAppointment = appointments.find(a => a.id === appointmentId);
        if (!originalAppointment) return;

        try {
            const response = await fetch(`${API_BASE_URL}/appointments/${appointmentId}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify(update),
            });
            const returnedAppointment = await response.json();
            if (!response.ok) throw new Error(returnedAppointment.message || 'Falha ao atualizar status.');
            
            setAppointments(prev => prev.map(appt => appt.id === appointmentId ? { ...appt, ...update } : appt));
            return returnedAppointment;
        } catch (error) {
            console.error(error);
            showModal("Erro", error instanceof Error ? error.message : "Não foi possível atualizar o status.");
            return null;
        }
    }, [appointments, getAuthHeaders]);


    const handleCompleteAppointment = useCallback(async (appointmentId: number) => {
        const completedAppt = appointments.find(a => a.id === appointmentId);
        if (completedAppt) {
            setRemovingAppointmentId(appointmentId);
            const updated = await handleUpdateAppointmentStatus(appointmentId, { status: 'completed' });
            if (updated) {
                 setTimeout(() => {
                    setRemovingAppointmentId(null);
                    showModal("Finalizado", `O agendamento de ${completedAppt.clientName} foi marcado como finalizado.`);
                }, 500);
            } else {
                setRemovingAppointmentId(null); // Clear animation on failure
            }
        }
    }, [appointments, handleUpdateAppointmentStatus]);

    const handleSendReminder = useCallback(async (appointmentId: number) => {
        const updated = await handleUpdateAppointmentStatus(appointmentId, { reminderSent: true });
        if (updated) {
            showModal("Lembrete Agendado", "O lembrete foi agendado para ser enviado automaticamente para a cliente.");
        }
    }, [handleUpdateAppointmentStatus]);

    const handleLogin = useCallback((loggedInUser: User) => {
        setUser(loggedInUser);
    }, []);

    const upcomingAppointments = useMemo(() => {
        return appointments.filter(appt => appt.status === 'scheduled');
    }, [appointments]);

    const projectedRevenue = useMemo(() => {
        return upcomingAppointments.reduce((total, appt) => total + appt.value, 0);
    }, [upcomingAppointments]);

    const monthlyRevenue = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        return appointments.reduce((total, appt) => {
            const apptDate = new Date(appt.datetime);
            if (
                appt.status === 'completed' &&
                apptDate.getMonth() === currentMonth &&
                apptDate.getFullYear() === currentYear
            ) {
                return total + appt.value;
            }
            return total;
        }, 0);
    }, [appointments]);

    const clients = useMemo(() => {
        const clientData: { [phone: string]: { name: string; totalSpent: number; lastVisit: Date | null } } = {};

        appointments.forEach(appt => {
            if (!clientData[appt.clientPhone]) {
                clientData[appt.clientPhone] = { name: appt.clientName, totalSpent: 0, lastVisit: null };
            }
            clientData[appt.clientPhone].name = appt.clientName;

            if (appt.status === 'completed') {
                clientData[appt.clientPhone].totalSpent += appt.value;
                const apptDate = new Date(appt.datetime);
                const currentLastVisit = clientData[appt.clientPhone].lastVisit;
                if (!currentLastVisit || apptDate > currentLastVisit) {
                    clientData[appt.clientPhone].lastVisit = apptDate;
                }
            }
        });

        const clientList: Client[] = Object.entries(clientData).map(([phone, data]) => {
            let daysSinceLastVisit: number | null = null;
            if (data.lastVisit) {
                const diffTime = Math.abs(new Date().getTime() - data.lastVisit.getTime());
                daysSinceLastVisit = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            }
            return { phone, name: data.name, totalSpent: data.totalSpent, daysSinceLastVisit };
        });

        clientList.sort((a, b) => a.name.localeCompare(b.name));
        return clientList;
    }, [appointments]);

    const TabButton: React.FC<{ label: string; viewName: 'appointments' | 'clients' }> = ({ label, viewName }) => (
        <button
            onClick={() => setActiveView(viewName)}
            className={`px-6 py-3 text-lg font-bold rounded-t-lg transition-colors duration-300 focus:outline-none ${
                activeView === viewName
                    ? 'bg-white/80 text-pink-600 shadow-inner'
                    : 'bg-transparent text-pink-800 hover:bg-white/40'
            }`}
        >
            {label}
        </button>
    );

    const sparkleSvg = `<svg width="20" height="20" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M50 0 L55.9 44.1 L100 50 L55.9 55.9 L50 100 L44.1 55.9 L0 50 L44.1 44.1 Z" fill="rgba(236, 72, 153, 0.08)" /></svg>`;
    const bgStyle = { backgroundImage: `url('data:image/svg+xml;base64,${btoa(sparkleSvg)}')` };

    if (!user) {
        return <LoginScreen onLogin={handleLogin} />;
    }

    return (
        <div className="min-h-screen bg-pink-50 text-pink-900 font-sans p-4 sm:p-6 md:p-8" style={bgStyle}>
            <div className="max-w-7xl mx-auto relative">
                <Header 
                    user={user}
                    onLogout={handleLogout}
                    notificationAppointments={notificationAppointments}
                    isNotificationPopoverOpen={isNotificationPopoverOpen}
                    onToggleNotificationPopover={handleToggleNotificationPopover}
                />
                
                <div className="mt-8 flex justify-center border-b-2 border-pink-200">
                    <TabButton label="Agendamentos" viewName="appointments" />
                    <TabButton label="Clientes" viewName="clients" />
                </div>

                <main className="mt-2">
                    {activeView === 'appointments' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
                            <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-pink-100">
                                <AppointmentForm 
                                    onSchedule={handleScheduleAppointment}
                                    appointmentToEdit={editingAppointment}
                                    onUpdate={handleUpdateAppointment}
                                    onCancelEdit={handleCancelEdit}
                                    blockedSlots={blockedSlots}
                                />
                            </div>
                            <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-pink-100">
                                <AppointmentList 
                                    appointments={upcomingAppointments} 
                                    onCancel={handleCancelAppointment}
                                    onComplete={handleCompleteAppointment}
                                    onEdit={handleStartEdit}
                                    onSendReminder={handleSendReminder}
                                    highlightedAppointmentId={highlightedAppointmentId}
                                    removingAppointmentId={removingAppointmentId}
                                />
                            </div>
                            <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-pink-100">
                                <RevenueDashboard
                                    projectedRevenue={projectedRevenue}
                                    monthlyRevenue={monthlyRevenue}
                                />
                                 <AgendaManagement
                                    blockedSlots={blockedSlots}
                                    onBlockSlot={handleBlockSlot}
                                    onUnblockSlot={handleUnblockSlot}
                                />
                                <div className="border-t-2 border-pink-200 pt-8 mt-8 text-center">
                                    <p className="text-sm text-pink-600 italic">
                                        Os dados agora são salvos automaticamente no servidor.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                     {activeView === 'clients' && (
                        <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-pink-100 mt-6">
                            <ClientList clients={clients} />
                        </div>
                    )}
                </main>
            </div>
            <Modal
                isOpen={modalInfo.isOpen}
                title={modalInfo.title}
                message={modalInfo.message}
                onClose={closeModal}
            />
        </div>
    );
};

export default App;