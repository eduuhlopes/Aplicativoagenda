import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Appointment, ModalInfo, Client, BlockedSlot } from './types';
import Header from './components/Header';
import AppointmentForm from './components/AppointmentForm';
import AppointmentList from './components/AppointmentList';
import Modal from './components/Modal';
import RevenueDashboard from './components/RevenueDashboard';
import ClientList from './components/ClientList';
import DateTimePickerModal from './components/DateTimePickerModal';

const AgendaManagementIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 inline-block ml-2 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2zM7 16h.01M12 16h.01M17 16h.01" />
    </svg>
);

const BackupIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 inline-block ml-2 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
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

const BackupManagement: React.FC<{
    onExport: () => void;
    onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
}> = ({ onExport, onImport }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    return (
         <div className="border-t-2 border-pink-200 pt-8 mt-8">
            <h2 className="text-2xl font-bold text-purple-800 text-center mb-4 flex items-center justify-center">
                Backup e Restauração
                <BackupIcon />
            </h2>
            <div className="flex flex-col sm:flex-row gap-4">
                <button
                    onClick={onExport}
                    className="flex-1 py-3 px-4 bg-blue-500 text-white font-bold text-lg rounded-lg shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-transform transform hover:scale-105"
                >
                    Exportar Dados
                </button>
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 py-3 px-4 bg-green-500 text-white font-bold text-lg rounded-lg shadow-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-transform transform hover:scale-105"
                >
                    Importar Dados
                </button>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={onImport}
                    className="hidden"
                    accept=".json"
                />
            </div>
            <p className="text-sm text-center text-pink-600 italic mt-4">
                Salve seus dados em um arquivo seguro ou restaure de um backup anterior.
            </p>
        </div>
    )
};


const App: React.FC = () => {
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

    // Load data from localStorage on initial render
    useEffect(() => {
        try {
            const savedAppointments = localStorage.getItem('appointments');
            if (savedAppointments) {
                setAppointments(JSON.parse(savedAppointments).map((a: any) => ({ ...a, datetime: new Date(a.datetime) })));
            }
            const savedBlockedSlots = localStorage.getItem('blockedSlots');
            if (savedBlockedSlots) {
                setBlockedSlots(JSON.parse(savedBlockedSlots).map((s: any) => ({ ...s, date: new Date(s.date) })));
            }
        } catch (error) {
            console.error("Failed to load data from localStorage", error);
            showModal("Erro", "Não foi possível carregar os dados salvos.");
        }
    }, []);

    // Save data to localStorage whenever it changes
    useEffect(() => {
        try {
            localStorage.setItem('appointments', JSON.stringify(appointments));
        } catch (error) {
            console.error("Failed to save appointments to localStorage", error);
        }
    }, [appointments]);

    useEffect(() => {
        try {
            localStorage.setItem('blockedSlots', JSON.stringify(blockedSlots));
        } catch (error) {
            console.error("Failed to save blocked slots to localStorage", error);
        }
    }, [blockedSlots]);


    const showModal = (title: string, message: string) => {
        setModalInfo({ isOpen: true, title, message });
    };

    const closeModal = () => {
        setModalInfo({ isOpen: false, title: '', message: '' });
    };

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
        if (datetime < now && (!appointmentIdToIgnore || (now.getTime() - datetime.getTime()) > 60000)) {
            return "Não é possível agendar horários no passado.";
        }

        const appointmentTime = `${String(datetime.getHours()).padStart(2, '0')}:00`;
        const appointmentDateStr = datetime.toDateString();

        for (const slot of blockedSlots) {
            if (new Date(slot.date).toDateString() !== appointmentDateStr) continue;
            if (slot.isFullDay) return "Este dia está totalmente bloqueado.";
            if (slot.endTime) {
                if (appointmentTime >= slot.startTime! && appointmentTime < slot.endTime) {
                    return `Este horário está indisponível (bloqueado de ${slot.startTime} às ${slot.endTime}).`;
                }
            } else if (appointmentTime === slot.startTime) {
                return `O horário das ${slot.startTime} está bloqueado.`;
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

    const handleBlockSlot = useCallback((data: { date: Date, isFullDay: boolean, startTime?: string, endTime?: string }) => {
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

        const newSlot: BlockedSlot = { ...data, id: Date.now() };
        setBlockedSlots(prev => [...prev, newSlot].sort((a,b) => a.date.getTime() - b.date.getTime()));
        showModal("Sucesso", "Horário bloqueado com sucesso.");
    }, [blockedSlots]);

    const handleUnblockSlot = useCallback((id: number) => {
        const slotToUnblock = blockedSlots.find(s => s.id === id);
        setBlockedSlots(prev => prev.filter(s => s.id !== id));
        showModal("Sucesso", `O bloqueio para ${slotToUnblock ? new Date(slotToUnblock.date).toLocaleDateString('pt-BR') : ''} foi removido.`);
    }, [blockedSlots]);

    const handleScheduleAppointment = useCallback(async (newAppointmentData: Omit<Appointment, 'id' | 'status'>): Promise<boolean> => {
        const conflictMessage = checkAppointmentConflict(newAppointmentData.datetime);
        if (conflictMessage) {
            showModal("Horário Indisponível", conflictMessage);
            return false;
        }
        
        const newAppointment: Appointment = {
            ...newAppointmentData,
            id: Date.now(),
            status: 'scheduled'
        };

        setAppointments(prev => [...prev, newAppointment].sort((a, b) => a.datetime.getTime() - b.datetime.getTime()));
        setHighlightedAppointmentId(newAppointment.id);
        showModal("Sucesso", `Agendamento para ${newAppointment.clientName} marcado com sucesso.`);
        
        const sanitizedClientPhone = newAppointment.clientPhone.replace(/\D/g, '');
        const clientMessage = `Olá, ${newAppointment.clientName}! ✨\n\nSeu agendamento no salão foi confirmado com sucesso!\n\n*Serviço:* ${newAppointment.service}\n*Valor:* R$ ${newAppointment.value.toFixed(2)}\n*Data:* ${new Date(newAppointment.datetime).toLocaleDateString('pt-BR')}\n*Hora:* ${new Date(newAppointment.datetime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}\n\nMal podemos esperar para te ver! 🌸`;
        window.open(`https://wa.me/55${sanitizedClientPhone}?text=${encodeURIComponent(clientMessage)}`, '_blank');
        return true;
    }, [checkAppointmentConflict]);

    const handleCancelAppointment = useCallback(async (appointmentId: number) => {
        const appointmentToCancel = appointments.find(appt => appt.id === appointmentId);
        if (appointmentToCancel) {
            setRemovingAppointmentId(appointmentId);
            setTimeout(() => {
                setAppointments(prev => prev.filter(appt => appt.id !== appointmentId));
                setRemovingAppointmentId(null);
                showModal("Cancelado", `O agendamento de ${appointmentToCancel.clientName} foi cancelado.`);
            }, 500);
        }
    }, [appointments]);

    const handleStartEdit = useCallback((appointment: Appointment) => {
        setEditingAppointment(appointment);
        setActiveView('appointments'); 
    }, []);

    const handleCancelEdit = useCallback(() => {
        setEditingAppointment(null);
    }, []);

    const handleUpdateAppointment = useCallback(async (updatedAppointment: Appointment): Promise<boolean> => {
        const conflictMessage = checkAppointmentConflict(updatedAppointment.datetime, updatedAppointment.id);
        if (conflictMessage) {
            showModal("Horário Indisponível", conflictMessage);
            return false;
        }
        setAppointments(prev => prev.map(appt => appt.id === updatedAppointment.id ? updatedAppointment : appt).sort((a, b) => a.datetime.getTime() - b.datetime.getTime()));
        setEditingAppointment(null);
        setHighlightedAppointmentId(updatedAppointment.id);
        showModal("Sucesso", "Agendamento atualizado com sucesso!");
        return true;
    }, [checkAppointmentConflict, appointments]);

    const handleUpdateAppointmentStatus = useCallback((appointmentId: number, status: 'completed' | 'scheduled') => {
        setAppointments(prev =>
            prev.map(appt =>
                appt.id === appointmentId ? { ...appt, status } : appt
            )
        );
    }, []);

    const handleCompleteAppointment = useCallback(async (appointmentId: number) => {
        const completedAppt = appointments.find(a => a.id === appointmentId);
        if (completedAppt) {
            setRemovingAppointmentId(appointmentId);
            handleUpdateAppointmentStatus(appointmentId, 'completed');
            setTimeout(() => {
                setRemovingAppointmentId(null);
                showModal("Finalizado", `O agendamento de ${completedAppt.clientName} foi marcado como finalizado.`);
            }, 500);
        }
    }, [appointments, handleUpdateAppointmentStatus]);

    const handleSendReminder = useCallback((appointmentId: number) => {
        setAppointments(prev => prev.map(appt =>
            appt.id === appointmentId ? { ...appt, reminderSent: true } : appt
        ));
        showModal("Lembrete Agendado", "O lembrete foi marcado como agendado para envio.");
    }, []);
    
    const handleExportData = () => {
        try {
            const dataStr = JSON.stringify({ appointments, blockedSlots }, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
            const exportFileDefaultName = `backup_agenda_${new Date().toISOString().slice(0, 10)}.json`;
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();
            showModal("Exportado", "Seus dados foram exportados com sucesso!");
        } catch (error) {
            showModal("Erro", "Não foi possível exportar os dados.");
            console.error(error);
        }
    };
    
    const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') throw new Error("File content is not readable text.");
                const data = JSON.parse(text);

                if (data.appointments && Array.isArray(data.appointments) && data.blockedSlots && Array.isArray(data.blockedSlots)) {
                    setAppointments(data.appointments.map((a: any) => ({ ...a, datetime: new Date(a.datetime) })));
                    setBlockedSlots(data.blockedSlots.map((s: any) => ({ ...s, date: new Date(s.date) })));
                    showModal("Importado", "Dados restaurados com sucesso a partir do backup!");
                } else {
                    throw new Error("Arquivo de backup inválido ou mal formatado.");
                }
            } catch (error) {
                showModal("Erro de Importação", error instanceof Error ? error.message : "Não foi possível ler o arquivo de backup.");
                console.error(error);
            } finally {
                event.target.value = ''; // Reset file input
            }
        };
        reader.readAsText(file);
    };

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

    return (
        <div className="min-h-screen bg-pink-50 text-pink-900 font-sans p-4 sm:p-6 md:p-8" style={bgStyle}>
            <div className="max-w-7xl mx-auto relative">
                <Header 
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
                                <BackupManagement 
                                    onExport={handleExportData}
                                    onImport={handleImportData}
                                />
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
